import { useCallback, useState } from 'react';

import { fetchVaccinationById } from '../lib/vaccinationsApi';
import type { Vaccination } from '../types/vaccination';

export function useVaccination(vaccinationId: string | undefined) {
  const [vaccination, setVaccination] = useState<Vaccination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!vaccinationId) {
      setVaccination(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await fetchVaccinationById(vaccinationId);

    if (fetchError) {
      setError(fetchError);
      setLoading(false);
      return;
    }

    setVaccination(data);
    setLoading(false);
  }, [vaccinationId]);

  return { vaccination, loading, error, refetch };
}
