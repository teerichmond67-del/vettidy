import { supabase } from './supabase';
import type { WeightEntry, WeightEntryInput } from '../types/weightEntry';

export async function fetchWeightEntriesForPet(
  petId: string,
): Promise<{ data: WeightEntry[]; error: string | null }> {
  const { data, error } = await supabase
    .from('weight_entries')
    .select('*')
    .eq('pet_id', petId)
    .order('recorded_at', { ascending: true });

  return { data: data ?? [], error: error?.message ?? null };
}

export async function fetchWeightEntryById(
  id: string,
): Promise<{ data: WeightEntry | null; error: string | null }> {
  const { data, error } = await supabase.from('weight_entries').select('*').eq('id', id).single();

  return { data: data ?? null, error: error?.message ?? null };
}

export async function createWeightEntry(
  petId: string,
  input: WeightEntryInput,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('weight_entries').insert({ ...input, pet_id: petId });

  return { error: error?.message ?? null };
}

export async function updateWeightEntry(
  id: string,
  input: Partial<WeightEntryInput>,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('weight_entries').update(input).eq('id', id);

  return { error: error?.message ?? null };
}

export async function deleteWeightEntry(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('weight_entries').delete().eq('id', id);

  return { error: error?.message ?? null };
}
