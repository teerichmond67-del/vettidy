import { useCallback, useState } from 'react';

import { fetchVaccinationsForPet } from '../lib/vaccinationsApi';
import type { Vaccination } from '../types/vaccination';

export function useVaccinations(petId: string) {
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await fetchVaccinationsForPet(petId);

    if (fetchError) {
      setError(fetchError);
      setLoading(false);
      return;
    }

    setVaccinations(data);
    setLoading(false);
  }, [petId]);

  return { vaccinations, loading, error, refetch };
}
