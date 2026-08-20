import { useCallback, useState } from 'react';

import { fetchWeightEntriesForPet } from '../lib/weightEntriesApi';
import type { WeightEntry } from '../types/weightEntry';

export function useWeightEntries(petId: string) {
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await fetchWeightEntriesForPet(petId);

    if (fetchError) {
      setError(fetchError);
      setLoading(false);
      return;
    }

    setWeightEntries(data);
    setLoading(false);
  }, [petId]);

  return { weightEntries, loading, error, refetch };
}
