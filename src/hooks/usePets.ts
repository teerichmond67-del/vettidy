import { useCallback, useState } from 'react';

import { fetchPetsForPack } from '../lib/petsApi';
import type { Pet } from '../types/pet';

export function usePets(packId: string | null) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!packId) {
      setPets([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await fetchPetsForPack(packId);

    if (fetchError) {
      setError(fetchError);
      setLoading(false);
      return;
    }

    setPets(data);
    setLoading(false);
  }, [packId]);

  return { pets, loading, error, refetch };
}
