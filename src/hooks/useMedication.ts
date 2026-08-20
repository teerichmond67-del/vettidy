import { useCallback, useState } from 'react';

import { fetchMedicationById } from '../lib/medicationsApi';
import type { Medication } from '../types/medication';

export function useMedication(medicationId: string | undefined) {
  const [medication, setMedication] = useState<Medication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!medicationId) {
      setMedication(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await fetchMedicationById(medicationId);

    if (fetchError) {
      setError(fetchError);
      setLoading(false);
      return;
    }

    setMedication(data);
    setLoading(false);
  }, [medicationId]);

  return { medication, loading, error, refetch };
}
