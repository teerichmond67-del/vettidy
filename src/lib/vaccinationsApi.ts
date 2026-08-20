import { supabase } from './supabase';
import type { Vaccination, VaccinationInput } from '../types/vaccination';

export async function fetchVaccinationsForPet(
  petId: string,
): Promise<{ data: Vaccination[]; error: string | null }> {
  const { data, error } = await supabase
    .from('vaccinations')
    .select('*')
    .eq('pet_id', petId)
    .order('next_due_date', { ascending: true, nullsFirst: false });

  return { data: data ?? [], error: error?.message ?? null };
}

export async function fetchVaccinationById(
  id: string,
): Promise<{ data: Vaccination | null; error: string | null }> {
  const { data, error } = await supabase.from('vaccinations').select('*').eq('id', id).single();

  return { data: data ?? null, error: error?.message ?? null };
}

export async function createVaccination(
  petId: string,
  input: VaccinationInput,
): Promise<{ data: Vaccination | null; error: string | null }> {
  const { data, error } = await supabase
    .from('vaccinations')
    .insert({ ...input, pet_id: petId })
    .select()
    .single();

  return { data: data ?? null, error: error?.message ?? null };
}

export async function updateVaccination(
  id: string,
  input: Partial<VaccinationInput>,
): Promise<{ data: Vaccination | null; error: string | null }> {
  const { data, error } = await supabase
    .from('vaccinations')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  return { data: data ?? null, error: error?.message ?? null };
}

export async function deleteVaccination(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('vaccinations').delete().eq('id', id);

  return { error: error?.message ?? null };
}
