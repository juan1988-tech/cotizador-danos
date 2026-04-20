import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuoteStore } from '../../../store/quoteStore';
import { getCoverageOptions, putCoverageOptions, calculatePremium } from '../services/calculationApi';
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
  const { currentQuote, updateVersion, updateCoberturas, updatePrimas } = useQuoteStore();
  const [coverageOptions, setCoverageOptions] = useState<GetCoverageOptionsResponse['data']>([]);
  const [calculationResult, setCalculationResult] = useState<UseCalculationReturn['calculationResult']>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!folio || !currentQuote) return;
    setLoading(true);
    try {
      const result = await putCoverageOptions(folio, {
        version: currentQuote.version,
        opcionesCobertura: coverageOptions.map(opt => ({
          codigoCobertura: opt.codigoCobertura,
          seleccionada: opt.seleccionada,
        })),
      });
      setCoverageOptions(result.opcionesCobertura);
      updateCoberturas(result.opcionesCobertura);
      updateVersion(result.version);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar coberturas');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [folio, currentQuote, coverageOptions, updateCoberturas, updateVersion]);

  const calculate = useCallback(async () => {
    if (!folio || !currentQuote) return;
    setLoading(true);
    setError(null);
    try {
      const result = await calculatePremium(folio, {
        version: currentQuote.version,
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
      setError(err instanceof Error ? err.message : 'Error al calcular prima');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [folio, currentQuote, updatePrimas, updateVersion]);

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
