import { useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuoteStore } from '../../../store/quoteStore';
import { createQuote, getQuote, patchGeneralData } from '../services/quoteApi';
import type { PatchGeneralDataRequest, Quote } from '../types/quote.types';

export interface UseQuoteReturn {
  quote: Quote | null;
  loading: boolean;
  error: string | null;
  folio: string | undefined;
  loadQuote: (folio: string) => Promise<void>;
  createNewQuote: () => Promise<string>;
  saveGeneralData: (data: Omit<PatchGeneralDataRequest, 'version'>) => Promise<void>;
}

export function useQuote(): UseQuoteReturn {
  const { folio } = useParams<{ folio: string }>();
  const navigate = useNavigate();
  const { currentQuote, loading, error, setQuote, setLoading, setError, updateDatosAsegurado, updateVersion } = useQuoteStore();
  const [localLoading, setLocalLoading] = useState(false);

  const loadQuote = useCallback(async (folioToLoad: string) => {
    setLoading(true);
    try {
      const quote = await getQuote(folioToLoad);
      setQuote(quote);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar la cotización');
    }
  }, [setLoading, setQuote, setError]);

  const createNewQuote = useCallback(async (): Promise<string> => {
    setLocalLoading(true);
    setError(null);
    try {
      const data = await createQuote();
      setQuote({
        numeroFolio: data.numeroFolio,
        estadoCotizacion: data.estadoCotizacion,
        datosAsegurado: null,
        configuracionLayout: null,
        opcionesCobertura: null,
        version: data.version,
        fechaCreacion: data.fechaCreacion,
        fechaUltimaActualizacion: data.fechaUltimaActualizacion,
      });
      navigate(`/quotes/${data.numeroFolio}/general-info`);
      return data.numeroFolio;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la cotización');
      throw err;
    } finally {
      setLocalLoading(false);
    }
  }, [navigate, setError, setQuote]);

  const saveGeneralData = useCallback(async (data: Omit<PatchGeneralDataRequest, 'version'>) => {
    if (!folio || !currentQuote) return;
    
    setLocalLoading(true);
    try {
      const result = await patchGeneralData(folio, {
        ...data,
        version: currentQuote.version,
      });
      updateDatosAsegurado(result.datosAsegurado);
      updateVersion(result.version);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar datos generales');
      throw err;
    } finally {
      setLocalLoading(false);
    }
  }, [folio, currentQuote, updateDatosAsegurado, updateVersion, setError]);

  return {
    quote: currentQuote,
    loading: loading || localLoading,
    error,
    folio,
    loadQuote,
    createNewQuote,
    saveGeneralData,
  };
}
