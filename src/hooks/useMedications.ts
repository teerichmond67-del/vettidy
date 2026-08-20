import { useCallback, useState } from 'react';

import { fetchMedicationsForPet } from '../lib/medicationsApi';
import type { Medication } from '../types/medication';

export function useMedications(petId: string) {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await fetchMedicationsForPet(petId);

    if (fetchError) {
      setError(fetchError);
      setLoading(false);
      return;
    }

    setMedications(data);
    setLoading(false);
  }, [petId]);

  return { medications, loading, error, refetch };
}
