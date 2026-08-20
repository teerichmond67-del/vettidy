import { supabase } from './supabase';
import type { DoseLog, DoseStatus } from '../types/doseLog';

export async function fetchDoseLogsForMedication(
  medicationId: string,
): Promise<{ data: DoseLog[]; error: string | null }> {
  const { data: logs, error } = await supabase
    .from('dose_logs')
    .select('id, medication_id, logged_by, status, logged_at, sync_status')
    .eq('medication_id', medicationId)
    .order('logged_at', { ascending: false });

  if (error) return { data: [], error: error.message };

  const userIds = Array.from(new Set((logs ?? []).map((l) => l.logged_by)));

  const { data: profiles, error: profilesError } = userIds.length
    ? await supabase.from('profiles').select('id, email').in('id', userIds)
    : { data: [], error: null };

  if (profilesError) return { data: [], error: profilesError.message };

  const emailById = new Map((profiles ?? []).map((p) => [p.id, p.email]));

  const merged: DoseLog[] = (logs ?? []).map((log) => ({
    ...log,
    logged_by_email: emailById.get(log.logged_by) ?? null,
  }));

  return { data: merged, error: null };
}

export async function createDoseLog(
  medicationId: string,
  loggedBy: string,
  status: DoseStatus,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('dose_logs')
    .insert({ medication_id: medicationId, logged_by: loggedBy, status });

  return { error: error?.message ?? null };
}
