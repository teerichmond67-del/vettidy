import { useCallback, useState } from 'react';

import { fetchPackMembers } from '../lib/packApi';
import type { PackMember } from '../types/pack';

export function usePackMembers(packId: string | null) {
  const [members, setMembers] = useState<PackMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!packId) {
      setMembers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await fetchPackMembers(packId);

    if (fetchError) {
      setError(fetchError);
      setLoading(false);
      return;
    }

    setMembers(data);
    setLoading(false);
  }, [packId]);

  return { members, loading, error, refetch };
}
