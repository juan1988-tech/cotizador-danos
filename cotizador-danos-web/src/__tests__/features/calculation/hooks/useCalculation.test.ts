import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCalculation } from '../../../../features/calculation/hooks/useCalculation';
import { useQuoteStore } from '../../../../store/quoteStore';
import { OptimisticLockError } from '../../../../shared/utils/errors';
import * as calculationApi from '../../../../features/calculation/services/calculationApi';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ folio: 'COT-2026-001025' }),
  };
});

vi.mock('../../../../features/calculation/services/calculationApi');
const mockedGetCoverageOptions = vi.mocked(calculationApi.getCoverageOptions);
const mockedPutCoverageOptions = vi.mocked(calculationApi.putCoverageOptions);
const mockedCalculatePremium = vi.mocked(calculationApi.calculatePremium);

const BASE_QUOTE = {
  numeroFolio: 'COT-2026-001025',
  estadoCotizacion: 'EN_EDICION' as const,
  version: 3,
  fechaCreacion: '2026-04-20T00:00:00.000Z',
  fechaUltimaActualizacion: '2026-04-20T00:00:00.000Z',
  datosAsegurado: null,
  configuracionLayout: null,
  opcionesCobertura: null,
  primaNetaTotal: null,
  primaComercialTotal: null,
  primasPorUbicacion: null,
};

const COVERAGE_OPTIONS = [
  { codigoCobertura: 'INC', descripcion: 'Incendio', seleccionada: true, obligatoria: true },
  { codigoCobertura: 'TER', descripcion: 'Terremoto', seleccionada: false, obligatoria: false },
];

const CALCULATE_RESPONSE = {
  folio: 'COT-2026-001025',
  primaNetaTotal: 15000,
  primaComercialTotal: 18000,
  primasPorUbicacion: [],
  ubicacionesExcluidas: [],
  version: 4,
};

beforeEach(() => {
  vi.clearAllMocks();
  act(() => {
    useQuoteStore.getState().clearQuote();
  });
  mockedGetCoverageOptions.mockResolvedValue(COVERAGE_OPTIONS);
});

describe('useCalculation — calculate()', () => {
  // ─── Happy path ───────────────────────────────────────────────────────────

  it('calls calculatePremium with the current store version and sets result', async () => {
    act(() => {
      useQuoteStore.getState().setQuote({ ...BASE_QUOTE, version: 3 });
    });
    mockedCalculatePremium.mockResolvedValue(CALCULATE_RESPONSE);

    const { result } = renderHook(() => useCalculation());

    await act(async () => {
      await result.current.calculate();
    });

    expect(mockedCalculatePremium).toHaveBeenCalledWith('COT-2026-001025', { version: 3 });
    expect(result.current.calculationResult?.primaNetaTotal).toBe(15000);
    expect(result.current.error).toBeNull();
  });

  it('updates the store version after a successful calculation', async () => {
    act(() => {
      useQuoteStore.getState().setQuote({ ...BASE_QUOTE, version: 3 });
    });
    mockedCalculatePremium.mockResolvedValue(CALCULATE_RESPONSE);

    const { result } = renderHook(() => useCalculation());

    await act(async () => {
      await result.current.calculate();
    });

    expect(useQuoteStore.getState().currentQuote?.version).toBe(4);
  });

  // ─── Re-entry guard ───────────────────────────────────────────────────────

  it('ignores concurrent duplicate calls (re-entry guard)', async () => {
    act(() => {
      useQuoteStore.getState().setQuote({ ...BASE_QUOTE, version: 3 });
    });
    let resolveCalc!: (v: typeof CALCULATE_RESPONSE) => void;
    mockedCalculatePremium.mockReturnValue(
      new Promise<typeof CALCULATE_RESPONSE>((res) => { resolveCalc = res; })
    );

    const { result } = renderHook(() => useCalculation());

    // Fire both calls inside the same act to avoid overlapping act() warnings.
    // isInFlight is set synchronously before the first await, so the second
    // call is blocked by the guard before any async work happens.
    await act(async () => {
      void result.current.calculate(); // first — sets isInFlight = true
      void result.current.calculate(); // second — blocked by guard
      resolveCalc(CALCULATE_RESPONSE);
    });

    expect(mockedCalculatePremium).toHaveBeenCalledTimes(1);
  });

  // ─── OptimisticLockError ──────────────────────────────────────────────────

  it('shows user-friendly message on OptimisticLockError (409)', async () => {
    act(() => {
      useQuoteStore.getState().setQuote({ ...BASE_QUOTE, version: 3 });
    });
    mockedCalculatePremium.mockRejectedValue(new OptimisticLockError('VersionConflict'));

    const { result } = renderHook(() => useCalculation());
    // Flush initial loadCoverageOptions effect before testing calculate
    await act(async () => {});

    await act(async () => {
      await result.current.calculate();
    });

    expect(result.current.error).toMatch(/modificada por otra operaci[oó]n/i);
  });

  it('resets isInFlight after an OptimisticLockError so a retry is possible', async () => {
    act(() => {
      useQuoteStore.getState().setQuote({ ...BASE_QUOTE, version: 3 });
    });
    mockedCalculatePremium
      .mockRejectedValueOnce(new OptimisticLockError('VersionConflict'))
      .mockResolvedValueOnce(CALCULATE_RESPONSE);

    const { result } = renderHook(() => useCalculation());
    await act(async () => {}); // flush initial effects

    // First call — fails with OptimisticLockError (does not re-throw)
    await act(async () => {
      await result.current.calculate();
    });

    // Update version in store to simulate a fresh fetch by the user
    act(() => {
      useQuoteStore.getState().updateVersion(5);
    });

    // Second call — succeeds (guard must have been released)
    await act(async () => {
      await result.current.calculate();
    });

    expect(mockedCalculatePremium).toHaveBeenCalledTimes(2);
    expect(mockedCalculatePremium).toHaveBeenLastCalledWith('COT-2026-001025', { version: 5 });
  });

  // ─── Stale-closure fix ────────────────────────────────────────────────────

  it('reads the fresh store version, not the closure-captured version', async () => {
    act(() => {
      useQuoteStore.getState().setQuote({ ...BASE_QUOTE, version: 3 });
    });
    mockedCalculatePremium.mockResolvedValue(CALCULATE_RESPONSE);

    const { result } = renderHook(() => useCalculation());
    await act(async () => {}); // flush initial effects

    // Simulate store version being updated externally (e.g. by saveCoverageOptions)
    // before calculate() is called — this is exactly the scenario that caused the bug.
    act(() => {
      useQuoteStore.getState().updateVersion(7);
    });

    await act(async () => {
      await result.current.calculate();
    });

    // Must use the FRESH version (7), not the one from the initial closure (3)
    expect(mockedCalculatePremium).toHaveBeenCalledWith('COT-2026-001025', { version: 7 });
  });
});

describe('useCalculation — saveCoverageOptions()', () => {
  it('reads fresh store version when saving coverage options', async () => {
    act(() => {
      useQuoteStore.getState().setQuote({ ...BASE_QUOTE, version: 2 });
    });
    mockedPutCoverageOptions.mockResolvedValue({
      opcionesCobertura: COVERAGE_OPTIONS,
      estadoCotizacion: 'EN_EDICION',
      version: 3,
    });

    const { result } = renderHook(() => useCalculation());
    await act(async () => {}); // flush initial effects

    // Update version in store before saving — simulates a version bump from a prior operation
    act(() => {
      useQuoteStore.getState().updateVersion(6);
    });

    await act(async () => {
      await result.current.saveCoverageOptions();
    });

    expect(mockedPutCoverageOptions).toHaveBeenCalledWith(
      'COT-2026-001025',
      expect.objectContaining({ version: 6 })
    );
  });
});
