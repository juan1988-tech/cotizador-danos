import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuoteStore } from '../../../store/quoteStore';
import { getCoverageOptions, putCoverageOptions, calculatePremium } from '../services/calculationApi';
import { OptimisticLockError } from '../../../shared/utils/errors';
import type { GetCoverageOptionsResponse, LocationPremium } from '../types/calculation.types';

export interface UseCalculationReturn {
  coverageOptions: GetCoverageOptionsResponse['data'];
  calculationResult: {
    primaNetaTotal: number;
    primaComercialTotal: number;
    primasPorUbicacion: LocationPremium[];
    ubicacionesExcluidas: number[];
  } | null;
  loading: boolean;
  error: string | null;
  loadCoverageOptions: () => Promise<void>;
  toggleCoverage: (codigoCobertura: string, seleccionada: boolean) => void;
  saveCoverageOptions: () => Promise<void>;
  calculate: () => Promise<void>;
}

export function useCalculation(): UseCalculationReturn {
  const { folio } = useParams<{ folio: string }>();
  const { currentQuote, updateVersion, updateCoberturas, updateEstado, updatePrimas } = useQuoteStore();
  const [coverageOptions, setCoverageOptions] = useState<GetCoverageOptionsResponse['data']>([]);
  const [calculationResult, setCalculationResult] = useState<UseCalculationReturn['calculationResult']>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Guard against concurrent invocations before React re-renders with loading=true
  const isInFlight = useRef(false);

  const loadCoverageOptions = useCallback(async () => {
    if (!folio) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getCoverageOptions(folio);
      setCoverageOptions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar opciones de cobertura');
    } finally {
      setLoading(false);
    }
  }, [folio]);

  const toggleCoverage = useCallback((codigoCobertura: string, seleccionada: boolean) => {
    setCoverageOptions(prev => 
      prev.map(opt => 
        opt.codigoCobertura === codigoCobertura && !opt.obligatoria
          ? { ...opt, seleccionada }
          : opt
      )
    );
  }, []);

  const saveCoverageOptions = useCallback(async () => {
    if (!folio) return;
    // Read fresh version from store to avoid stale closure after concurrent mutations
    const freshQuote = useQuoteStore.getState().currentQuote;
    if (!freshQuote) return;
    setLoading(true);
    try {
      const result = await putCoverageOptions(folio, {
        version: freshQuote.version,
        opcionesCobertura: coverageOptions.map(opt => ({
          codigoCobertura: opt.codigoCobertura,
          seleccionada: opt.seleccionada,
        })),
      });
      setCoverageOptions(result.opcionesCobertura);
      updateCoberturas(result.opcionesCobertura);
      updateEstado(result.estadoCotizacion);
      updateVersion(result.version);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar coberturas');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [folio, coverageOptions, updateCoberturas, updateEstado, updateVersion]);

  const calculate = useCallback(async () => {
    // Re-entry guard: prevents concurrent calls before React re-renders with loading=true
    if (!folio || isInFlight.current) return;
    // Read fresh version from store — avoids stale closure when called after saveCoverageOptions
    const freshQuote = useQuoteStore.getState().currentQuote;
    if (!freshQuote) return;
    isInFlight.current = true;
    setLoading(true);
    setError(null);
    try {
      const result = await calculatePremium(folio, {
        version: freshQuote.version,
      });
      setCalculationResult({
        primaNetaTotal: result.primaNetaTotal,
        primaComercialTotal: result.primaComercialTotal,
        primasPorUbicacion: result.primasPorUbicacion,
        ubicacionesExcluidas: result.ubicacionesExcluidas,
      });
      updatePrimas(result.primaNetaTotal, result.primaComercialTotal, result.primasPorUbicacion);
      updateVersion(result.version);
    } catch (err) {
      if (err instanceof OptimisticLockError) {
        setError('La cotización fue modificada por otra operación. Por favor, intenta de nuevo.');
      } else {
        setError(err instanceof Error ? err.message : 'Error al calcular prima');
      }
      // Do not re-throw: error is managed via state; re-throwing causes
      // "Uncaught (in promise)" in event handlers and unmounts test components.
    } finally {
      setLoading(false);
      isInFlight.current = false;
    }
  }, [folio, updatePrimas, updateVersion]);

  // Cargar opciones al montar
  useEffect(() => {
    if (folio) {
      loadCoverageOptions();
    }
  }, [folio, loadCoverageOptions]);

  // Inicializar resultado si ya existe en la cotización
  useEffect(() => {
    if (currentQuote?.primaNetaTotal !== null && currentQuote?.primaNetaTotal !== undefined) {
      setCalculationResult({
        primaNetaTotal: currentQuote.primaNetaTotal,
        primaComercialTotal: currentQuote.primaComercialTotal ?? 0,
        primasPorUbicacion: currentQuote.primasPorUbicacion ?? [],
        ubicacionesExcluidas: [],
      });
    }
  }, [currentQuote]);

  return {
    coverageOptions,
    calculationResult,
    loading,
    error,
    loadCoverageOptions,
    toggleCoverage,
    saveCoverageOptions,
    calculate,
  };
}
