import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import * as Crypto from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';

import { supabase } from './supabase';

const QUEUE_STORAGE_KEY = 'pet-health-app:upload-queue';
const DOCUMENTS_BUCKET = 'documents';

const queueDirectory = new Directory(Paths.document, 'upload-queue');

export type QueueItemStatus = 'queued' | 'uploading' | 'failed';

export type QueuedUpload = {
  id: string;
  documentId: string | null;
  packId: string;
  petId: string;
  uploadedBy: string;
  title: string | null;
  fileName: string;
  mimeType: string;
  localUri: string;
  status: QueueItemStatus;
  errorMessage: string | null;
  createdAt: string;
};

let queue: QueuedUpload[] = [];
let loaded = false;
let processing = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

async function persistQueue() {
  await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  notify();
}

async function loadQueue() {
  if (loaded) return;
  const raw = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
  queue = raw ? (JSON.parse(raw) as QueuedUpload[]) : [];
  loaded = true;
  notify();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getQueueSnapshot(): QueuedUpload[] {
  return queue;
}

async function updateItem(id: string, patch: Partial<QueuedUpload>) {
  queue = queue.map((item) => (item.id === id ? { ...item, ...patch } : item));
  await persistQueue();
}

function storagePath(packId: string, petId: string, documentId: string, fileName: string) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${packId}/${petId}/${documentId}-${safeName}`;
}

export async function enqueueUpload(input: {
  packId: string;
  petId: string;
  uploadedBy: string;
  title: string | null;
  fileName: string;
  mimeType: string;
  sourceUri: string;
}): Promise<QueuedUpload> {
  await loadQueue();

  if (!queueDirectory.exists) {
    queueDirectory.create({ intermediates: true, idempotent: true });
  }

  const id = Crypto.randomUUID();
  const extensionMatch = input.fileName.match(/\.[a-zA-Z0-9]+$/);
  const destination = new File(queueDirectory, `${id}${extensionMatch ? extensionMatch[0] : ''}`);

  const source = new File(input.sourceUri);
  await source.copy(destination, { overwrite: true });

  const item: QueuedUpload = {
    id,
    documentId: null,
    packId: input.packId,
    petId: input.petId,
    uploadedBy: input.uploadedBy,
    title: input.title,
    fileName: input.fileName,
    mimeType: input.mimeType,
    localUri: destination.uri,
    status: 'queued',
    errorMessage: null,
    createdAt: new Date().toISOString(),
  };

  queue = [...queue, item];
  await persistQueue();

  processQueue();

  return item;
}

export async function retryUpload(id: string): Promise<void> {
  await loadQueue();
  await updateItem(id, { status: 'queued', errorMessage: null });
  processQueue();
}

export async function removeFromQueue(id: string): Promise<void> {
  await loadQueue();
  const item = queue.find((entry) => entry.id === id);
  queue = queue.filter((entry) => entry.id !== id);
  await persistQueue();

  if (item) {
    const file = new File(item.localUri);
    if (file.exists) {
      file.delete();
    }
  }
}

export function findQueueItemByDocumentId(documentId: string): QueuedUpload | null {
  return queue.find((item) => item.documentId === documentId) ?? null;
}

export async function processQueue(): Promise<void> {
  if (processing) return;

  const netState = await NetInfo.fetch();
  if (!netState.isConnected) return;

  await loadQueue();

  const pendingIds = queue
    .filter((item) => item.status === 'queued' || item.status === 'failed')
    .map((item) => item.id);

  if (pendingIds.length === 0) return;

  processing = true;

  try {
    for (const id of pendingIds) {
      const current = queue.find((entry) => entry.id === id);
      if (!current) continue;

      await updateItem(id, { status: 'uploading', errorMessage: null });

      try {
        let documentId = current.documentId;

        if (!documentId) {
          documentId = Crypto.randomUUID();
          const path = storagePath(current.packId, current.petId, documentId, current.fileName);

          const { error: insertError } = await supabase.from('documents').insert({
            id: documentId,
            pet_id: current.petId,
            uploaded_by: current.uploadedBy,
            file_path: path,
            file_type: current.mimeType,
            title: current.title,
            linked_type: 'standalone',
            upload_status: 'pending',
          });

          if (insertError) throw new Error(insertError.message);

          await updateItem(id, { documentId });
        }

        const path = storagePath(current.packId, current.petId, documentId, current.fileName);
        const file = new File(current.localUri);

        if (!file.exists) {
          throw new Error('The original file is no longer on this device. Delete and re-upload.');
        }

        const bytes = await file.bytes();

        const { error: uploadError } = await supabase.storage
          .from(DOCUMENTS_BUCKET)
          .upload(path, bytes, { contentType: current.mimeType, upsert: true });

        if (uploadError) throw new Error(uploadError.message);

        const { error: statusError } = await supabase
          .from('documents')
          .update({ upload_status: 'synced' })
          .eq('id', documentId);

        if (statusError) throw new Error(statusError.message);

        queue = queue.filter((entry) => entry.id !== id);
        await persistQueue();

        try {
          if (file.exists) {
            file.delete();
          }
        } catch {
          // Best-effort cleanup — a leftover cached copy is harmless.
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed. Please try again.';
        await updateItem(id, { status: 'failed', errorMessage: message });

        const failedItem = queue.find((entry) => entry.id === id);
        if (failedItem?.documentId) {
          await supabase
            .from('documents')
            .update({ upload_status: 'failed' })
            .eq('id', failedItem.documentId);
        }
      }
    }
  } finally {
    processing = false;
  }
}

let initialized = false;

export function initUploadQueue(): void {
  if (initialized) return;
  initialized = true;

  loadQueue().then(async () => {
    // Any item still marked 'uploading' at startup can only be a leftover
    // from a session that was killed mid-upload (not just backgrounded) —
    // requeue it so it re-enters the retry cycle instead of sitting stuck.
    const hasStuckUploads = queue.some((item) => item.status === 'uploading');
    if (hasStuckUploads) {
      queue = queue.map((item) =>
        item.status === 'uploading' ? { ...item, status: 'queued' as const } : item,
      );
      await persistQueue();
    }
    processQueue();
  });

  NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      processQueue();
    }
  });

  AppState.addEventListener('change', (nextState) => {
    if (nextState === 'active') {
      processQueue();
    }
  });
}
