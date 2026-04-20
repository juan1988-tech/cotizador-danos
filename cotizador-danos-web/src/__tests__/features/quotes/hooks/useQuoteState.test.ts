import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useQuoteStore } from '../../../../store/quoteStore';
import { useQuoteState } from '../../../../features/quotes/hooks/useQuoteState';
import type { Quote } from '../../../../features/quotes/types/quote.types';

const BASE_QUOTE: Quote = {
  numeroFolio: 'COT-2026-001',
  estadoCotizacion: 'EN_EDICION',
  datosAsegurado: null,
  configuracionLayout: null,
  opcionesCobertura: null,
  version: 1,
  fechaCreacion: '2026-04-01T00:00:00.000Z',
  fechaUltimaActualizacion: '2026-04-01T00:00:00.000Z',
};

describe('useQuoteState', () => {
  beforeEach(() => {
    // Reset Zustand store before each test
    act(() => {
      useQuoteStore.getState().clearQuote();
    });
  });

  // ─── currentState ─────────────────────────────────────────────────────────

  it('returns null currentState when no quote is loaded', () => {
    const { result } = renderHook(() => useQuoteState());

    expect(result.current.currentState).toBeNull();
  });

  it('returns the quote state when a quote is loaded', () => {
    act(() => {
      useQuoteStore.getState().setQuote({ ...BASE_QUOTE, estadoCotizacion: 'DATOS_GENERALES_COMPLETOS' });
    });

    const { result } = renderHook(() => useQuoteState());

    expect(result.current.currentState).toBe('DATOS_GENERALES_COMPLETOS');
  });

  // ─── canAccessStep ────────────────────────────────────────────────────────

  it('allows only general-info when no quote is loaded', () => {
    const { result } = renderHook(() => useQuoteState());

    expect(result.current.canAccessStep('general-info')).toBe(true);
    expect(result.current.canAccessStep('locations')).toBe(false);
    expect(result.current.canAccessStep('technical-info')).toBe(false);
    expect(result.current.canAccessStep('terms-and-conditions')).toBe(false);
  });

  it('allows general-info and locations when state is DATOS_GENERALES_COMPLETOS', () => {
    act(() => {
      useQuoteStore.getState().setQuote({ ...BASE_QUOTE, estadoCotizacion: 'DATOS_GENERALES_COMPLETOS' });
    });

    const { result } = renderHook(() => useQuoteState());

    expect(result.current.canAccessStep('general-info')).toBe(true);
    expect(result.current.canAccessStep('locations')).toBe(true);
    expect(result.current.canAccessStep('technical-info')).toBe(false);
    expect(result.current.canAccessStep('terms-and-conditions')).toBe(false);
  });

  it('allows all steps when state is CALCULADA', () => {
    act(() => {
      useQuoteStore.getState().setQuote({ ...BASE_QUOTE, estadoCotizacion: 'CALCULADA' });
    });

    const { result } = renderHook(() => useQuoteState());

    expect(result.current.canAccessStep('general-info')).toBe(true);
    expect(result.current.canAccessStep('locations')).toBe(true);
    expect(result.current.canAccessStep('technical-info')).toBe(true);
    expect(result.current.canAccessStep('terms-and-conditions')).toBe(true);
  });

  it('allows general-info when state is EN_EDICION', () => {
    act(() => {
      useQuoteStore.getState().setQuote({ ...BASE_QUOTE, estadoCotizacion: 'EN_EDICION' });
    });

    const { result } = renderHook(() => useQuoteState());

    expect(result.current.canAccessStep('general-info')).toBe(true);
    expect(result.current.canAccessStep('locations')).toBe(false);
  });

  it('returns false for unknown step', () => {
    act(() => {
      useQuoteStore.getState().setQuote({ ...BASE_QUOTE, estadoCotizacion: 'CALCULADA' });
    });

    const { result } = renderHook(() => useQuoteState());

    expect(result.current.canAccessStep('unknown-step')).toBe(false);
  });

  // ─── isStepCompleted ──────────────────────────────────────────────────────

  it('returns false for all steps when no quote is loaded', () => {
    const { result } = renderHook(() => useQuoteState());

    expect(result.current.isStepCompleted('general-info')).toBe(false);
    expect(result.current.isStepCompleted('locations')).toBe(false);
  });

  it('marks general-info as completed when state is DATOS_GENERALES_COMPLETOS', () => {
    act(() => {
      useQuoteStore.getState().setQuote({ ...BASE_QUOTE, estadoCotizacion: 'DATOS_GENERALES_COMPLETOS' });
    });

    const { result } = renderHook(() => useQuoteState());

    expect(result.current.isStepCompleted('general-info')).toBe(true);
    expect(result.current.isStepCompleted('locations')).toBe(false);
  });

  it('marks all steps completed when state is CALCULADA', () => {
    act(() => {
      useQuoteStore.getState().setQuote({ ...BASE_QUOTE, estadoCotizacion: 'CALCULADA' });
    });

    const { result } = renderHook(() => useQuoteState());

    expect(result.current.isStepCompleted('general-info')).toBe(true);
    expect(result.current.isStepCompleted('locations')).toBe(true);
    expect(result.current.isStepCompleted('technical-info')).toBe(true);
    expect(result.current.isStepCompleted('terms-and-conditions')).toBe(true);
  });

  // ─── getNextStep ──────────────────────────────────────────────────────────

  it('returns "general-info" as next step when no quote is loaded', () => {
    const { result } = renderHook(() => useQuoteState());

    expect(result.current.getNextStep()).toBe('general-info');
  });

  it('returns "locations" as next step when state is DATOS_GENERALES_COMPLETOS', () => {
    act(() => {
      useQuoteStore.getState().setQuote({ ...BASE_QUOTE, estadoCotizacion: 'DATOS_GENERALES_COMPLETOS' });
    });

    const { result } = renderHook(() => useQuoteState());

    expect(result.current.getNextStep()).toBe('locations');
  });

  it('returns "technical-info" as next step when state is UBICACIONES_CONFIGURADAS', () => {
    act(() => {
      useQuoteStore.getState().setQuote({ ...BASE_QUOTE, estadoCotizacion: 'UBICACIONES_CONFIGURADAS' });
    });

    const { result } = renderHook(() => useQuoteState());

    expect(result.current.getNextStep()).toBe('technical-info');
  });

  it('returns null when state is CALCULADA (no more steps)', () => {
    act(() => {
      useQuoteStore.getState().setQuote({ ...BASE_QUOTE, estadoCotizacion: 'CALCULADA' });
    });

    const { result } = renderHook(() => useQuoteState());

    expect(result.current.getNextStep()).toBeNull();
  });
});
