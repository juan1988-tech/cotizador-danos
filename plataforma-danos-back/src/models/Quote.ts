// ─── Quote State ────────────────────────────────────────────────────────────
export type QuoteState =
  | 'EN_EDICION'
  | 'DATOS_GENERALES_COMPLETOS'
  | 'UBICACIONES_CONFIGURADAS'
  | 'COBERTURAS_SELECCIONADAS'
  | 'CALCULADA';

export const ESTADO_ORDER: Record<QuoteState, number> = {
  EN_EDICION: 0,
  DATOS_GENERALES_COMPLETOS: 1,
  UBICACIONES_CONFIGURADAS: 2,
  COBERTURAS_SELECCIONADAS: 3,
  CALCULADA: 4,
};

export function maxEstado(a: QuoteState, b: QuoteState): QuoteState {
  return ESTADO_ORDER[a] >= ESTADO_ORDER[b] ? a : b;
}

// ─── DatosAsegurado ──────────────────────────────────────────────────────────
// Stored as JSONB in datos_asegurado column
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

// ─── DatosConduccion ─────────────────────────────────────────────────────────
export interface DatosConduccion {
  codigoAgente: string;
  nombreAgente?: string;
  suscriptor: string;
}

// ─── OpcionCobertura ─────────────────────────────────────────────────────────
export interface OpcionCobertura {
  codigoCobertura: string;
  descripcion: string;
  seleccionada: boolean;
  obligatoria: boolean;
}

// ─── Supporting types ────────────────────────────────────────────────────────
export interface LayoutConfig {
  tipoLayout: string;
  numeroUbicaciones: number;
  distribucion?: string;
}

export interface ComponentePrima {
  tipo: string;
  sumaAsegurada: number;
  tasa: number;
  prima: number;
}

export interface LocationPremium {
  indiceUbicacion: number;
  primaNeta: number;
  primaComercial: number;
  desglose: Record<string, number>;
}

export interface PremiumCalculationResult {
  primaNetaTotal: number;
  primaComercialTotal: number;
  primasPorUbicacion: LocationPremium[];
  ubicacionesExcluidas: number[];
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
  fechaCreacion: Date;
  fechaUltimaActualizacion: Date;
}

// ─── CreateQuoteResponse ──────────────────────────────────────────────────────
export interface CreateQuoteResponseData {
  numeroFolio: string;
  estadoCotizacion: 'EN_EDICION';
  version: number;
  fechaCreacion: string;
  fechaUltimaActualizacion: string;
}

export interface CreateQuoteResponse {
  data: CreateQuoteResponseData;
}

// ─── UpdateGeneralInfoRequest ─────────────────────────────────────────────────
export interface UpdateGeneralInfoRequest {
  nombreAsegurado?: string;
  rfcAsegurado?: string;
  agenteId?: string;
  suscriptorId?: string;
  tipoNegocio?: string;
  giroId?: string;
  vigenciaInicio?: string;
  vigenciaFin?: string;
  /** Required for optimistic locking. Must match the current version in the DB. */
  version: number;
}

// ─── UpdateGeneralInfoResponse ────────────────────────────────────────────────
export interface UpdateGeneralInfoResponseData {
  numeroFolio: string;
  estadoCotizacion: QuoteState;
  datosAsegurado: DatosAsegurado;
  version: number;
  fechaUltimaActualizacion: string;
}

export interface UpdateGeneralInfoResponse {
  data: UpdateGeneralInfoResponseData;
}
