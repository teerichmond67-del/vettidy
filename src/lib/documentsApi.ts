import { supabase } from './supabase';
import type { DocumentRecord } from '../types/document';

const DOCUMENTS_BUCKET = 'documents';

export async function fetchDocumentsForPet(
  petId: string,
): Promise<{ data: DocumentRecord[]; error: string | null }> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('pet_id', petId)
    .order('created_at', { ascending: false });

  return { data: data ?? [], error: error?.message ?? null };
}

export async function deleteDocumentRecord(
  documentId: string,
  filePath: string,
): Promise<{ error: string | null }> {
  const { error: storageError } = await supabase.storage.from(DOCUMENTS_BUCKET).remove([filePath]);

  if (storageError) {
    return { error: storageError.message };
  }

  const { error } = await supabase.from('documents').delete().eq('id', documentId);

  return { error: error?.message ?? null };
}

export async function getSignedDocumentUrl(
  filePath: string,
): Promise<{ url: string | null; error: string | null }> {
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(filePath, 60);

  return { url: data?.signedUrl ?? null, error: error?.message ?? null };
}
