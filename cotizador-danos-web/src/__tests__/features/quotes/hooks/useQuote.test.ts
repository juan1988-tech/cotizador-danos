import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useQuote } from '../../../../features/quotes/hooks/useQuote';
import { useQuoteStore } from '../../../../store/quoteStore';
import * as quoteApi from '../../../../features/quotes/services/quoteApi';

// Hoisted so the factory closure can reference it before the mock is applied
const mockNavigate = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({}),
  };
});

vi.mock('../../../../features/quotes/services/quoteApi');
const mockedCreateQuote = vi.mocked(quoteApi.createQuote);

const CREATE_RESPONSE = {
  numeroFolio: 'COT-2026-001000',
  estadoCotizacion: 'EN_EDICION' as const,
  version: 1,
  fechaCreacion: '2026-04-20T00:00:00.000Z',
  fechaUltimaActualizacion: '2026-04-20T00:00:00.000Z',
};

describe('useQuote — createNewQuote', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    act(() => {
      useQuoteStore.getState().clearQuote();
    });
  });

  // ─── Happy path ───────────────────────────────────────────────────────────

  it('navigates to /quotes/:folio/general-info on success', async () => {
    mockedCreateQuote.mockResolvedValue(CREATE_RESPONSE);

    const { result } = renderHook(() => useQuote());

    await act(async () => {
      await result.current.createNewQuote();
    });

    expect(mockNavigate).toHaveBeenCalledWith('/quotes/COT-2026-001000/general-info');
  });

  it('returns the folio string on success', async () => {
    mockedCreateQuote.mockResolvedValue(CREATE_RESPONSE);

    const { result } = renderHook(() => useQuote());

    let folio: string | undefined;
    await act(async () => {
      folio = await result.current.createNewQuote();
    });

    expect(folio).toBe('COT-2026-001000');
  });

  it('persists the new quote in the global store on success', async () => {
    mockedCreateQuote.mockResolvedValue(CREATE_RESPONSE);

    const { result } = renderHook(() => useQuote());

    await act(async () => {
      await result.current.createNewQuote();
    });

    const stored = useQuoteStore.getState().currentQuote;
    expect(stored?.numeroFolio).toBe('COT-2026-001000');
    expect(stored?.estadoCotizacion).toBe('EN_EDICION');
    expect(stored?.datosAsegurado).toBeNull();
    expect(stored?.configuracionLayout).toBeNull();
    expect(stored?.opcionesCobertura).toBeNull();
    expect(stored?.version).toBe(1);
  });

  it('clears a previous error before attempting creation', async () => {
    act(() => {
      useQuoteStore.getState().setError('error previo');
    });

    mockedCreateQuote.mockResolvedValue(CREATE_RESPONSE);

    const { result } = renderHook(() => useQuote());

    await act(async () => {
      await result.current.createNewQuote();
    });

    expect(useQuoteStore.getState().error).toBeNull();
  });

  // ─── Error path ───────────────────────────────────────────────────────────

  it('sets error in store and does not navigate when createQuote rejects', async () => {
    mockedCreateQuote.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useQuote());

    await act(async () => {
      try {
        await result.current.createNewQuote();
      } catch {
        // expected to re-throw
      }
    });

    expect(useQuoteStore.getState().error).toBe('Network error');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('sets generic error message when rejection is not an Error instance', async () => {
    mockedCreateQuote.mockRejectedValue('string error');

    const { result } = renderHook(() => useQuote());

    await act(async () => {
      try {
        await result.current.createNewQuote();
      } catch {
        // expected
      }
    });

    expect(useQuoteStore.getState().error).toBe('Error al crear la cotización');
  });

  it('does not persist a quote in the store when createQuote rejects', async () => {
    mockedCreateQuote.mockRejectedValue(new Error('DB down'));

    const { result } = renderHook(() => useQuote());

    await act(async () => {
      try {
        await result.current.createNewQuote();
      } catch {
        // expected
      }
    });

    expect(useQuoteStore.getState().currentQuote).toBeNull();
  });
});
