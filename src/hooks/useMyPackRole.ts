import { useCallback, useEffect, useState } from 'react';

import { fetchMyPackRole } from '../lib/packApi';
import type { PackRole } from '../types/pack';
import { useAuth } from './useAuth';

export function useMyPackRole(packId: string | null) {
  const { session } = useAuth();
  const [role, setRole] = useState<PackRole | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!packId || !session) {
      setRole(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { role: fetchedRole } = await fetchMyPackRole(packId, session.user.id);
    setRole(fetchedRole);
    setLoading(false);
  }, [packId, session]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount/dependency-change, not derived state
    refetch();
  }, [refetch]);

  const isSitter = role === 'sitter_view_only';
  const canWrite = role === 'owner' || role === 'caregiver';
  const isOwner = role === 'owner';

  return { role, loading, isSitter, canWrite, isOwner, refetch };
}
