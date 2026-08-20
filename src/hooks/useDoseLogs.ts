import { useCallback, useState } from 'react';

import { fetchDoseLogsForMedication } from '../lib/doseLogsApi';
import type { DoseLog } from '../types/doseLog';

export function useDoseLogs(medicationId: string) {
  const [doseLogs, setDoseLogs] = useState<DoseLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await fetchDoseLogsForMedication(medicationId);

    if (fetchError) {
      setError(fetchError);
      setLoading(false);
      return;
    }

    setDoseLogs(data);
    setLoading(false);
  }, [medicationId]);

  return { doseLogs, loading, error, refetch };
}
