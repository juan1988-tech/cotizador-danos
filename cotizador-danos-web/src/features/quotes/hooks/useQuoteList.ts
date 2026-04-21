import { useState, useEffect, useCallback } from 'react';
import { listQuotes } from '../services/quoteApi';
import type { QuoteSummary } from '../types/quote.types';

export interface UseQuoteListReturn {
  quotes: QuoteSummary[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useQuoteList(): UseQuoteListReturn {
  const [quotes, setQuotes] = useState<QuoteSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function fetchQuotes() {
      if (!cancelled) setLoading(true);
      if (!cancelled) setError(null);
      try {
        const data = await listQuotes();
        if (!cancelled) setQuotes(data);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error al cargar las cotizaciones');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchQuotes();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  return { quotes, loading, error, refresh };
}
