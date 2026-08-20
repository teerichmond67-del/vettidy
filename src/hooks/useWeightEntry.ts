import { useCallback, useState } from 'react';

import { fetchWeightEntryById } from '../lib/weightEntriesApi';
import type { WeightEntry } from '../types/weightEntry';

export function useWeightEntry(weightEntryId: string | undefined) {
  const [weightEntry, setWeightEntry] = useState<WeightEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!weightEntryId) {
      setWeightEntry(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await fetchWeightEntryById(weightEntryId);

    if (fetchError) {
      setError(fetchError);
      setLoading(false);
      return;
    }

    setWeightEntry(data);
    setLoading(false);
  }, [weightEntryId]);

  return { weightEntry, loading, error, refetch };
}
