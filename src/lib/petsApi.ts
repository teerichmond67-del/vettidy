import * as Crypto from 'expo-crypto';
import { File } from 'expo-file-system';

import { supabase } from './supabase';
import type { Pet, PetInput, PetStatus } from '../types/pet';

const DOCUMENTS_BUCKET = 'documents';
// Photo thumbnails stay visible on-screen far longer than a one-time
// document view, so they get a much longer signed-URL lifetime than
// getSignedDocumentUrl's 60s.
const PHOTO_SIGNED_URL_TTL_SECONDS = 60 * 60;

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

export async function uploadPetPhoto(
  packId: string,
  localUri: string,
  mimeType: string,
): Promise<{ path: string | null; error: string | null }> {
  const extensionMatch = localUri.match(/\.[a-zA-Z0-9]+$/);
  const extension = extensionMatch ? extensionMatch[0] : '.jpg';
  const path = `${packId}/pet-photos/${Crypto.randomUUID()}${extension}`;

  const file = new File(localUri);
  const bytes = await file.bytes();

  const { error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(path, bytes, { contentType: mimeType, upsert: true });

  return { path: error ? null : path, error: error?.message ?? null };
}

export async function getSignedPetPhotoUrl(
  photoPath: string,
): Promise<{ url: string | null; error: string | null }> {
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(photoPath, PHOTO_SIGNED_URL_TTL_SECONDS);

  return { url: data?.signedUrl ?? null, error: error?.message ?? null };
}
