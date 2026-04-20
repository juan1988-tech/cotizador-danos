import { useMemo } from 'react';
import { useQuoteStore } from '../../../store/quoteStore';
import type { QuoteState } from '../types/quote.types';

const STATE_ORDER: Record<QuoteState, number> = {
  EN_EDICION: 0,
  DATOS_GENERALES_COMPLETOS: 1,
  UBICACIONES_CONFIGURADAS: 2,
  COBERTURAS_SELECCIONADAS: 3,
  CALCULADA: 4,
};

interface UseQuoteStateReturn {
  currentState: QuoteState | null;
  canAccessStep: (stepId: string) => boolean;
  isStepCompleted: (stepId: string) => boolean;
  getNextStep: () => string | null;
}

const STEP_TO_STATE: Record<string, QuoteState> = {
  'general-info': 'DATOS_GENERALES_COMPLETOS',
  'locations': 'UBICACIONES_CONFIGURADAS',
  'technical-info': 'COBERTURAS_SELECCIONADAS',
  'terms-and-conditions': 'CALCULADA',
};

export function useQuoteState(): UseQuoteStateReturn {
  const { currentQuote } = useQuoteStore();

  const currentState = currentQuote?.estadoCotizacion ?? null;

  const canAccessStep = useMemo(() => {
    return (stepId: string): boolean => {
      if (!currentState) return stepId === 'general-info';
      
      const requiredStates: Record<string, QuoteState[]> = {
        'general-info': ['EN_EDICION', 'DATOS_GENERALES_COMPLETOS', 'UBICACIONES_CONFIGURADAS', 'COBERTURAS_SELECCIONADAS', 'CALCULADA'],
        'locations': ['DATOS_GENERALES_COMPLETOS', 'UBICACIONES_CONFIGURADAS', 'COBERTURAS_SELECCIONADAS', 'CALCULADA'],
        'technical-info': ['UBICACIONES_CONFIGURADAS', 'COBERTURAS_SELECCIONADAS', 'CALCULADA'],
        'terms-and-conditions': ['COBERTURAS_SELECCIONADAS', 'CALCULADA'],
      };
      
      const allowedStates = requiredStates[stepId] ?? [];
      return allowedStates.includes(currentState);
    };
  }, [currentState]);

  const isStepCompleted = useMemo(() => {
    return (stepId: string): boolean => {
      if (!currentState) return false;
      const targetState = STEP_TO_STATE[stepId];
      if (!targetState) return false;
      return STATE_ORDER[currentState] >= STATE_ORDER[targetState];
    };
  }, [currentState]);

  const getNextStep = useMemo(() => {
    return (): string | null => {
      if (!currentState) return 'general-info';
      
      const nextSteps: Record<QuoteState, string | null> = {
        EN_EDICION: 'general-info',
        DATOS_GENERALES_COMPLETOS: 'locations',
        UBICACIONES_CONFIGURADAS: 'technical-info',
        COBERTURAS_SELECCIONADAS: 'terms-and-conditions',
        CALCULADA: null,
      };
      
      return nextSteps[currentState];
    };
  }, [currentState]);

  return {
    currentState,
    canAccessStep,
    isStepCompleted,
    getNextStep,
  };
}
