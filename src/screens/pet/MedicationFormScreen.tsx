import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { TimeListInput } from '../../components/TimeListInput';
import { useMedication } from '../../hooks/useMedication';
import { usePet } from '../../hooks/usePet';
import { createMedication, updateMedication } from '../../lib/medicationsApi';
import { scheduleMedicationReminders } from '../../lib/notifications';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'MedicationForm'>;

type DatePickerTarget = 'start' | 'end' | null;

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function MedicationFormScreen({ route, navigation }: Props) {
  const { petId, medicationId } = route.params;
  const isEditing = !!medicationId;

  const { pet, refetch: refetchPet } = usePet(petId);
  const {
    medication,
    loading: loadingMedication,
    error: loadError,
    refetch: refetchMedication,
  } = useMedication(medicationId);

  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [times, setTimes] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [active, setActive] = useState(true);
  const [datePickerTarget, setDatePickerTarget] = useState<DatePickerTarget>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: isEditing ? 'Edit Medication' : 'Add Medication' });
  }, [isEditing, navigation]);

  useEffect(() => {
    refetchPet();
    refetchMedication();
  }, [refetchPet, refetchMedication]);

  useEffect(() => {
    if (!medication) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- prefilling the form once edit-mode data arrives
    setName(medication.name);
    setDosage(medication.dosage ?? '');
    setTimes(medication.schedule_rule ? medication.schedule_rule.split(',').filter(Boolean) : []);
    setStartDate(medication.start_date ? new Date(medication.start_date) : new Date());
    setEndDate(medication.end_date ? new Date(medication.end_date) : null);
    setActive(medication.active);
  }, [medication]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Medication name is required.');
      return;
    }

    setError(null);
    setSaving(true);

    const input = {
      name: name.trim(),
      dosage: dosage.trim() || null,
      schedule_rule: times.length > 0 ? times.join(',') : null,
      start_date: formatDate(startDate),
      end_date: endDate ? formatDate(endDate) : null,
      active,
    };

    const result =
      isEditing && medicationId
        ? await updateMedication(medicationId, input)
        : await createMedication(petId, input);

    setSaving(false);

    if (result.error || !result.data) {
      setError(result.error ?? 'Could not save this medication.');
      return;
    }

    await scheduleMedicationReminders({
      medicationId: result.data.id,
      petId,
      petName: pet?.name ?? 'Your pet',
      medicationName: result.data.name,
      scheduleRule: result.data.schedule_rule,
      active: result.data.active,
      endDate: result.data.end_date,
    });

    navigation.goBack();
  };

  if (isEditing && loadingMedication) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isEditing && loadError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{loadError}</Text>
        <Pressable style={styles.retryButton} onPress={refetchMedication}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g. Apoquel"
        accessibilityLabel="Medication name"
      />

      <Text style={styles.label}>Dosage</Text>
      <TextInput
        style={styles.input}
        value={dosage}
        onChangeText={setDosage}
        placeholder="e.g. 1 tablet, 5mg"
        accessibilityLabel="Dosage"
      />

      <Text style={styles.label}>Daily Times</Text>
      <TimeListInput times={times} onChange={setTimes} />
      {times.length > 0 ? (
        <Text style={styles.hint}>A reminder will fire daily at each time above.</Text>
      ) : null}

      <Text style={styles.label}>Start Date</Text>
      <Pressable
        style={styles.input}
        onPress={() => setDatePickerTarget('start')}
        accessibilityRole="button"
        accessibilityLabel={`Start date, ${formatDate(startDate)}`}
      >
        <Text>{formatDate(startDate)}</Text>
      </Pressable>

      <Text style={styles.label}>End Date</Text>
      <Pressable
        style={styles.input}
        onPress={() => setDatePickerTarget('end')}
        accessibilityRole="button"
        accessibilityLabel={`End date, ${endDate ? formatDate(endDate) : 'ongoing'}`}
      >
        <Text>{endDate ? formatDate(endDate) : 'Ongoing'}</Text>
      </Pressable>
      {endDate ? (
        <Pressable onPress={() => setEndDate(null)} hitSlop={16}>
          <Text style={styles.clearLink}>Clear end date</Text>
        </Pressable>
      ) : null}

      {datePickerTarget ? (
        <DateTimePicker
          value={(datePickerTarget === 'start' ? startDate : endDate) ?? new Date()}
          mode="date"
          onChange={(event, selectedDate) => {
            const target = datePickerTarget;
            setDatePickerTarget(Platform.OS === 'ios' ? target : null);
            if (event.type === 'set' && selectedDate) {
              if (target === 'start') setStartDate(selectedDate);
              else if (target === 'end') setEndDate(selectedDate);
            }
          }}
        />
      ) : null}

      <View style={styles.switchRow}>
        <Text style={styles.label}>Active</Text>
        <Switch value={active} onValueChange={setActive} />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>{isEditing ? 'Save Changes' : 'Add Medication'}</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
    gap: 6,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  errorText: {
    color: '#c00',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#111',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  retryButtonText: {
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    justifyContent: 'center',
  },
  hint: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  clearLink: {
    color: '#c00',
    fontSize: 13,
    marginTop: 4,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  error: {
    color: '#c00',
    marginTop: 12,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#111',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
