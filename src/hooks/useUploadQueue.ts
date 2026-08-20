import { useCallback, useSyncExternalStore } from 'react';

import { getQueueSnapshot, subscribe } from '../lib/uploadQueue';
import type { QueuedUpload } from '../lib/uploadQueue';

export function useUploadQueue(petId: string): QueuedUpload[] {
  const getSnapshot = useCallback(() => getQueueSnapshot(), []);

  const queue = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return queue.filter((item) => item.petId === petId);
}
