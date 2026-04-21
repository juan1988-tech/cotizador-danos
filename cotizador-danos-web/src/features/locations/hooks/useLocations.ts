import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuoteStore } from '../../../store/quoteStore';
import { getLocations, patchLocation, postLayout } from '../services/locationApi';
import type { UbicacionResumen, PatchLocationRequest, PostLayoutRequest } from '../types/location.types';

export interface UseLocationsReturn {
  locations: UbicacionResumen[];
  loading: boolean;
  error: string | null;
  loadLocations: () => Promise<void>;
  updateLocation: (index: number, data: Omit<PatchLocationRequest, 'version'>) => Promise<void>;
  createLayout: (data: Omit<PostLayoutRequest, 'version'>) => Promise<void>;
  getCompletedCount: () => number;
  getIncompleteCount: () => number;
}

export function useLocations(): UseLocationsReturn {
  const { folio } = useParams<{ folio: string }>();
  const { currentQuote, updateVersion, updateLayoutConfig } = useQuoteStore();
  const [locations, setLocations] = useState<UbicacionResumen[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLocations = useCallback(async () => {
    if (!folio) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getLocations(folio);
      setLocations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar ubicaciones');
    } finally {
      setLoading(false);
    }
  }, [folio]);

  const updateLocation = useCallback(async (
    index: number,
    data: Omit<PatchLocationRequest, 'version'>
  ) => {
    if (!folio) return;
    const location = locations.find(l => l.indiceUbicacion === index);
    const locationVersion = location?.version ?? 0;
    setLoading(true);
    try {
      await patchLocation(folio, index, {
        ...data,
        version: locationVersion,
      });
      // Recargar ubicaciones para obtener versiones actualizadas
      await loadLocations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar ubicación');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [folio, locations, loadLocations]);

  const createLayout = useCallback(async (
    data: Omit<PostLayoutRequest, 'version'>
  ) => {
    if (!folio || !currentQuote) return;
    setLoading(true);
    try {
      const result = await postLayout(folio, {
        ...data,
        version: currentQuote.version,
      });
      updateLayoutConfig(result.configuracionLayout);
      updateVersion(result.version);
    
      await loadLocations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear layout');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [folio, currentQuote, updateLayoutConfig, updateVersion, loadLocations]);

  const getCompletedCount = useCallback(() => {
    return locations.filter(loc => loc.estadoValidacion === 'COMPLETA').length;
  }, [locations]);

  const getIncompleteCount = useCallback(() => {
    return locations.filter(loc => loc.estadoValidacion === 'INCOMPLETA').length;
  }, [locations]);

  // Cargar ubicaciones al montar
  useEffect(() => {
    if (folio && currentQuote?.configuracionLayout) {
      loadLocations();
    }
  }, [folio, currentQuote?.configuracionLayout, loadLocations]);

  return {
    locations,
    loading,
    error,
    loadLocations,
    updateLocation,
    createLayout,
    getCompletedCount,
    getIncompleteCount,
  };
}
