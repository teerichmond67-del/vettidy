import { supabase } from './supabase';
import type { Pet, PetInput, PetStatus } from '../types/pet';

export async function fetchPetsForPack(
  packId: string,
): Promise<{ data: Pet[]; error: string | null }> {
  const { data, error } = await supabase
    .from('pets')
    .select('*')
    .eq('pack_id', packId)
    .order('name', { ascending: true });

  return { data: data ?? [], error: error?.message ?? null };
}

export async function fetchPetById(
  petId: string,
): Promise<{ data: Pet | null; error: string | null }> {
  const { data, error } = await supabase.from('pets').select('*').eq('id', petId).single();

  return { data: data ?? null, error: error?.message ?? null };
}

export async function createPet(
  packId: string,
  input: PetInput,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('pets').insert({ ...input, pack_id: packId });

  return { error: error?.message ?? null };
}

export async function updatePet(
  petId: string,
  input: Partial<PetInput>,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('pets').update(input).eq('id', petId);

  return { error: error?.message ?? null };
}

export async function setPetStatus(
  petId: string,
  status: PetStatus,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('pets').update({ status }).eq('id', petId);

  return { error: error?.message ?? null };
}

export async function deletePet(petId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('pets').delete().eq('id', petId);

  return { error: error?.message ?? null };
}
