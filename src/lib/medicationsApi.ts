import { supabase } from './supabase';
import type { Medication, MedicationInput } from '../types/medication';

export async function fetchMedicationsForPet(
  petId: string,
): Promise<{ data: Medication[]; error: string | null }> {
  const { data, error } = await supabase
    .from('medications')
    .select('*')
    .eq('pet_id', petId)
    .order('active', { ascending: false })
    .order('name', { ascending: true });

  return { data: data ?? [], error: error?.message ?? null };
}

export async function fetchMedicationById(
  id: string,
): Promise<{ data: Medication | null; error: string | null }> {
  const { data, error } = await supabase.from('medications').select('*').eq('id', id).single();

  return { data: data ?? null, error: error?.message ?? null };
}

export async function createMedication(
  petId: string,
  input: MedicationInput,
): Promise<{ data: Medication | null; error: string | null }> {
  const { data, error } = await supabase
    .from('medications')
    .insert({ ...input, pet_id: petId })
    .select()
    .single();

  return { data: data ?? null, error: error?.message ?? null };
}

export async function updateMedication(
  id: string,
  input: Partial<MedicationInput>,
): Promise<{ data: Medication | null; error: string | null }> {
  const { data, error } = await supabase
    .from('medications')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  return { data: data ?? null, error: error?.message ?? null };
}

export async function deleteMedication(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('medications').delete().eq('id', id);

  return { error: error?.message ?? null };
}
