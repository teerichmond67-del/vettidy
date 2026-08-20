import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

type PackContextValue = {
  packId: string | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

const PackContext = createContext<PackContextValue | undefined>(undefined);

export function PackProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [packId, setPackId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!session) {
      setPackId(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('pack_members')
      .select('pack_id, role')
      .eq('user_id', session.user.id);

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    const memberships = data ?? [];
    // A user always has their own auto-created pack (as owner). If they've
    // also been invited into someone else's pack, that's presumably the
    // one they actually want to use day-to-day — there's no "switch pack"
    // UI yet, so prefer a non-owner membership when one exists.
    const chosen = memberships.find((m) => m.role !== 'owner') ?? memberships[0] ?? null;

    setPackId(chosen?.pack_id ?? null);
    setLoading(false);
  }, [session]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount/session-change, not derived state
    refetch();
  }, [refetch]);

  const value = useMemo<PackContextValue>(
    () => ({ packId, loading, error, refetch }),
    [packId, loading, error, refetch],
  );

  return <PackContext.Provider value={value}>{children}</PackContext.Provider>;
}

export function usePack() {
  const context = useContext(PackContext);
  if (!context) {
    throw new Error('usePack must be used within a PackProvider');
  }
  return context;
}
