import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useQuoteList } from '../../../../features/quotes/hooks/useQuoteList';
import * as quoteApi from '../../../../features/quotes/services/quoteApi';

vi.mock('../../../../features/quotes/services/quoteApi');
const mockedListQuotes = vi.mocked(quoteApi.listQuotes);

const SUMMARIES = [
  {
    numeroFolio: 'COT-2026-001000',
    estadoCotizacion: 'CALCULADA' as const,
    nombreAsegurado: 'María López',
    primaNetaTotal: 2500.5,
    fechaCreacion: '2026-04-20T00:00:00.000Z',
    fechaUltimaActualizacion: '2026-04-20T00:00:00.000Z',
  },
];

describe('useQuoteList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('given_initial_render_when_api_succeeds_then_returns_quotes_and_loading_false', async () => {
    mockedListQuotes.mockResolvedValue(SUMMARIES);

    const { result } = renderHook(() => useQuoteList());

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.quotes).toEqual(SUMMARIES);
    expect(result.current.error).toBeNull();
  });

  it('given_initial_render_when_api_returns_empty_then_quotes_is_empty_array', async () => {
    mockedListQuotes.mockResolvedValue([]);

    const { result } = renderHook(() => useQuoteList());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.quotes).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('given_api_throws_when_fetching_then_error_is_set_and_loading_is_false', async () => {
    mockedListQuotes.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useQuoteList());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeTruthy();
    expect(result.current.quotes).toEqual([]);
  });

  it('given_refresh_called_when_previous_fetch_succeeded_then_refetches', async () => {
    mockedListQuotes.mockResolvedValue(SUMMARIES);

    const { result } = renderHook(() => useQuoteList());
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockedListQuotes.mockResolvedValue([]);

    act(() => {
      result.current.refresh();
    });

    await waitFor(() => {
      expect(mockedListQuotes).toHaveBeenCalledTimes(2);
    });
  });
});
