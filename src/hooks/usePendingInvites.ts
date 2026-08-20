import { useCallback, useState } from 'react';

import { fetchPendingInvites } from '../lib/packApi';
import type { PackInvite } from '../types/pack';

export function usePendingInvites(packId: string | null) {
  const [invites, setInvites] = useState<PackInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!packId) {
      setInvites([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await fetchPendingInvites(packId);

    if (fetchError) {
      setError(fetchError);
      setLoading(false);
      return;
    }

    setInvites(data);
    setLoading(false);
  }, [packId]);

  return { invites, loading, error, refetch };
}
