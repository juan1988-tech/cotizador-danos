import { create } from 'zustand';
import type { Quote, DatosAsegurado, OpcionCobertura, LayoutConfig, LocationPremium } from '../features/quotes/types/quote.types';

interface QuoteStore {
  // Estado
  currentQuote: Quote | null;
  loading: boolean;
  error: string | null;
  
  // Acciones
  setQuote: (quote: Quote | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Actualización parcial
  updateDatosAsegurado: (datos: DatosAsegurado) => void;
  updateLayoutConfig: (config: LayoutConfig) => void;
  updateCoberturas: (coberturas: OpcionCobertura[]) => void;
  updatePrimas: (primaNetaTotal: number, primaComercialTotal: number, primasPorUbicacion: LocationPremium[]) => void;
  updateVersion: (version: number) => void;
  
  // Reset
  clearQuote: () => void;
}

export const useQuoteStore = create<QuoteStore>((set) => ({
  currentQuote: null,
  loading: false,
  error: null,

  setQuote: (quote) => set({ currentQuote: quote, error: null }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),

  updateDatosAsegurado: (datos) =>
    set((state) => {
      if (!state.currentQuote) return state;
      return {
        currentQuote: {
          ...state.currentQuote,
          datosAsegurado: { ...state.currentQuote.datosAsegurado, ...datos },
        },
      };
    }),

  updateLayoutConfig: (config) =>
    set((state) => {
      if (!state.currentQuote) return state;
      return {
        currentQuote: {
          ...state.currentQuote,
          configuracionLayout: config,
        },
      };
    }),

  updateCoberturas: (coberturas) =>
    set((state) => {
      if (!state.currentQuote) return state;
      return {
        currentQuote: {
          ...state.currentQuote,
          opcionesCobertura: coberturas,
        },
      };
    }),

  updatePrimas: (primaNetaTotal, primaComercialTotal, primasPorUbicacion) =>
    set((state) => {
      if (!state.currentQuote) return state;
      return {
        currentQuote: {
          ...state.currentQuote,
          primaNetaTotal,
          primaComercialTotal,
          primasPorUbicacion,
          estadoCotizacion: 'CALCULADA',
        },
      };
    }),

  updateVersion: (version) =>
    set((state) => {
      if (!state.currentQuote) return state;
      return {
        currentQuote: {
          ...state.currentQuote,
          version,
        },
      };
    }),

  clearQuote: () => set({ currentQuote: null, loading: false, error: null }),
}));
