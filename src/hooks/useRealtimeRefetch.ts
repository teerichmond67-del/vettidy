import { useEffect } from 'react';

import { supabase } from '../lib/supabase';

/**
 * Subscribes to Postgres changes on a table (scoped by a PostgREST-style
 * filter, e.g. `pack_id=eq.<id>`) and calls `onChange` whenever a row is
 * inserted, updated, or deleted — the "no manual sync step" requirement
 * for Pack sharing (Spec.md §8.1).
 */
export function useRealtimeRefetch(table: string, filter: string | null, onChange: () => void) {
  useEffect(() => {
    if (!filter) return;

    const channel = supabase
      .channel(`${table}-${filter}`)
      .on('postgres_changes', { event: '*', schema: 'public', table, filter }, () => {
        onChange();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter, onChange]);
}
