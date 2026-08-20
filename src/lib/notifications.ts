import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from './supabase';

const REMINDER_OFFSETS = [
  { days: 7, suffix: '7d', label: '7 days' },
  { days: 1, suffix: '1d', label: '1 day' },
];

let handlerConfigured = false;

export function configureNotifications(): void {
  if (handlerConfigured) return;
  handlerConfigured = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

function reminderIdentifier(vaccinationId: string, suffix: string) {
  return `vaccination-${vaccinationId}-${suffix}`;
}

export async function cancelVaccinationReminders(vaccinationId: string): Promise<void> {
  await Promise.all(
    REMINDER_OFFSETS.map((offset) =>
      Notifications.cancelScheduledNotificationAsync(
        reminderIdentifier(vaccinationId, offset.suffix),
      ),
    ),
  );

  await supabase
    .from('reminders')
    .delete()
    .eq('linked_type', 'vaccination')
    .eq('linked_id', vaccinationId);
}

export async function scheduleVaccinationReminders(params: {
  vaccinationId: string;
  petId: string;
  petName: string;
  vaccineName: string;
  nextDueDate: string | null;
}): Promise<void> {
  await cancelVaccinationReminders(params.vaccinationId);

  if (!params.nextDueDate) return;

  const granted = await ensureNotificationPermission();
  if (!granted) return;

  const dueDate = new Date(`${params.nextDueDate}T09:00:00`);

  for (const offset of REMINDER_OFFSETS) {
    const fireDate = new Date(dueDate);
    fireDate.setDate(fireDate.getDate() - offset.days);

    if (fireDate.getTime() <= Date.now()) continue;

    await Notifications.scheduleNotificationAsync({
      identifier: reminderIdentifier(params.vaccinationId, offset.suffix),
      content: {
        title: `${params.petName}'s vaccination is due in ${offset.label}`,
        body: `${params.vaccineName} is due on ${params.nextDueDate}.`,
        data: { petId: params.petId, vaccinationId: params.vaccinationId },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireDate,
      },
    });

    await supabase.from('reminders').insert({
      pet_id: params.petId,
      type: 'vaccination',
      linked_type: 'vaccination',
      linked_id: params.vaccinationId,
      due_at: fireDate.toISOString(),
    });
  }
}

// Medication schedules are stored as a simple comma-separated list of
// "HH:mm" times (e.g. "08:00,20:00") rather than a full RRULE grammar —
// covers the vast majority of real dosing schedules (once/twice/thrice
// daily at fixed times) without pulling in a recurrence-rule library.
const MAX_MEDICATION_TIMES = 10;

export function parseScheduleTimes(scheduleRule: string | null): string[] {
  if (!scheduleRule) return [];
  return scheduleRule
    .split(',')
    .map((t) => t.trim())
    .filter((t) => /^\d{2}:\d{2}$/.test(t));
}

function medicationReminderIdentifier(medicationId: string, index: number) {
  return `medication-${medicationId}-${index}`;
}

export async function cancelMedicationReminders(medicationId: string): Promise<void> {
  await Promise.all(
    Array.from({ length: MAX_MEDICATION_TIMES }, (_, index) =>
      Notifications.cancelScheduledNotificationAsync(
        medicationReminderIdentifier(medicationId, index),
      ),
    ),
  );

  await supabase
    .from('reminders')
    .delete()
    .eq('linked_type', 'medication')
    .eq('linked_id', medicationId);
}

export async function scheduleMedicationReminders(params: {
  medicationId: string;
  petId: string;
  petName: string;
  medicationName: string;
  scheduleRule: string | null;
  active: boolean;
  endDate: string | null;
}): Promise<void> {
  await cancelMedicationReminders(params.medicationId);

  if (!params.active) return;

  const today = new Date().toISOString().slice(0, 10);
  if (params.endDate && params.endDate < today) return;

  const times = parseScheduleTimes(params.scheduleRule);
  if (times.length === 0) return;

  const granted = await ensureNotificationPermission();
  if (!granted) return;

  for (let index = 0; index < times.length; index++) {
    const [hourStr, minuteStr] = times[index].split(':');
    const hour = Number(hourStr);
    const minute = Number(minuteStr);

    await Notifications.scheduleNotificationAsync({
      identifier: medicationReminderIdentifier(params.medicationId, index),
      content: {
        title: `Time for ${params.petName}'s medication`,
        body: `${params.medicationName} — scheduled for ${times[index]}.`,
        data: { petId: params.petId, medicationId: params.medicationId },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });

    const nextFire = new Date();
    nextFire.setHours(hour, minute, 0, 0);
    if (nextFire.getTime() <= Date.now()) {
      nextFire.setDate(nextFire.getDate() + 1);
    }

    await supabase.from('reminders').insert({
      pet_id: params.petId,
      type: 'medication',
      linked_type: 'medication',
      linked_id: params.medicationId,
      due_at: nextFire.toISOString(),
      recurrence_rule: `daily@${times[index]}`,
    });
  }
}
