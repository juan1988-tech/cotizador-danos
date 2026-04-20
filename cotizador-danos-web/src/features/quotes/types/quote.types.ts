export type QuoteStepStatus = 'pending' | 'active' | 'completed';

export interface QuoteStep {
  id: string;
  label: string;
  path: string;
  order: number;
}

export const QUOTE_STEPS: QuoteStep[] = [
  { id: 'general-info',        label: 'Datos Generales',     path: 'general-info',        order: 1 },
  { id: 'locations',           label: 'Ubicaciones',         path: 'locations',           order: 2 },
  { id: 'technical-info',      label: 'Información Técnica', path: 'technical-info',      order: 3 },
  { id: 'terms-and-conditions',label: 'Términos y Cond.',    path: 'terms-and-conditions', order: 4 },
];

// ─── Quote State ────────────────────────────────────────────────────────────
export type QuoteState =
  | 'EN_EDICION'
  | 'DATOS_GENERALES_COMPLETOS'
  | 'UBICACIONES_CONFIGURADAS'
  | 'COBERTURAS_SELECCIONADAS'
  | 'CALCULADA';

// ─── DatosAsegurado ──────────────────────────────────────────────────────────
export interface DatosAsegurado {
  nombreAsegurado?: string;
  rfcAsegurado?: string;
  agenteId?: string;
  suscriptorId?: string;
  tipoNegocio?: string;
  giroId?: string;
  vigenciaInicio?: string;
  vigenciaFin?: string;
}

// ─── LayoutConfig ────────────────────────────────────────────────────────────
export type TipoLayout = 'UNIFORME' | 'PERSONALIZADO';

export interface LayoutConfig {
  tipoLayout: TipoLayout;
  numeroUbicaciones: number;
  distribucion?: string;
}

// ─── OpcionCobertura ─────────────────────────────────────────────────────────
export interface OpcionCobertura {
  codigoCobertura: string;
  descripcion: string;
  seleccionada: boolean;
  obligatoria: boolean;
}

// ─── LocationPremium ─────────────────────────────────────────────────────────
export interface LocationPremium {
  indiceUbicacion: number;
  primaNeta: number;
  primaComercial: number;
  desglose: Record<string, number>;
}

// ─── Quote model ─────────────────────────────────────────────────────────────
export interface Quote {
  numeroFolio: string;
  estadoCotizacion: QuoteState;
  datosAsegurado: DatosAsegurado | null;
  configuracionLayout: LayoutConfig | null;
  opcionesCobertura: OpcionCobertura[] | null;
  primaNetaTotal?: number | null;
  primaComercialTotal?: number | null;
  primasPorUbicacion?: LocationPremium[] | null;
  version: number;
  fechaCreacion: string;
  fechaUltimaActualizacion: string;
}

// ─── API Request/Response types ──────────────────────────────────────────────
export interface CreateQuoteResponse {
  data: {
    numeroFolio: string;
    estadoCotizacion: 'EN_EDICION';
    version: number;
    fechaCreacion: string;
    fechaUltimaActualizacion: string;
  };
}

export interface GetQuoteResponse {
  data: Quote;
}

export interface PatchGeneralDataRequest {
  nombreAsegurado?: string;
  rfcAsegurado?: string;
  agenteId?: string;
  suscriptorId?: string;
  tipoNegocio?: string;
  giroId?: string;
  vigenciaInicio?: string;
  vigenciaFin?: string;
  version: number;
}

export interface PatchGeneralDataResponse {
  data: {
    datosAsegurado: DatosAsegurado;
    estadoCotizacion: QuoteState;
    version: number;
    fechaUltimaActualizacion: string;
  };
}

// ─── QuoteListItem ───────────────────────────────────────────────────────────
export interface QuoteListItem {
  numeroFolio: string;
  estadoCotizacion: QuoteState;
  nombreAsegurado?: string;
  fechaCreacion: string;
  fechaUltimaActualizacion: string;
}

