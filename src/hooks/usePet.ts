import { useCallback, useState } from 'react';

import { fetchPetById } from '../lib/petsApi';
import type { Pet } from '../types/pet';

export function usePet(petId: string | undefined) {
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!petId) {
      setPet(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await fetchPetById(petId);

    if (fetchError) {
      setError(fetchError);
      setLoading(false);
      return;
    }

    setPet(data);
    setLoading(false);
  }, [petId]);

  return { pet, loading, error, refetch };
}
