import { useCallback, useState } from 'react';

import { fetchDocumentsForPet } from '../lib/documentsApi';
import type { DocumentRecord } from '../types/document';

export function useDocuments(petId: string) {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await fetchDocumentsForPet(petId);

    if (fetchError) {
      setError(fetchError);
      setLoading(false);
      return;
    }

    setDocuments(data);
    setLoading(false);
  }, [petId]);

  return { documents, loading, error, refetch };
}
