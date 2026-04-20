// ─── Validation state ────────────────────────────────────────────────────────
export type ValidationState = 'PENDIENTE' | 'VALIDA' | 'INVALIDA' | 'INCOMPLETA' | 'COMPLETA';

export type AlertSeverity = 'ERROR' | 'WARNING' | 'INFO';

// ─── GiroInfo ─────────────────────────────────────────────────────────────────
// Stored as JSONB: { claveGiro, descripcion, claveIncendio }
export interface GiroInfo {
  claveGiro: string;
  descripcion: string;
  claveIncendio: string;
  categoria?: string;
}

// ─── Guarantee ───────────────────────────────────────────────────────────────
// Stored as JSONB array: [{ clave, descripcion, sumaAsegurada, deducible }]
export interface Guarantee {
  clave: string;
  descripcion: string;
  sumaAsegurada: number;
  deducible?: number;
}

// Flat garantia shape used in DB/UbicacionResumen
export interface GarantiaResumen {
  tipoGarantia: string;
  sumaAsegurada: number;
}

// ─── Supporting types ────────────────────────────────────────────────────────
export interface LocationAlert {
  tipo: string;
  mensaje: string;
  severidad: AlertSeverity;
}

// ─── UbicacionResumen ─────────────────────────────────────────────────────────
// Flat read model returned from DB for calculation/display
export interface UbicacionResumen {
  indiceUbicacion: number;
  descripcion: string | null;
  codigoPostal: string | null;
  giroId: string | null;
  estadoValidacion: 'COMPLETA' | 'INCOMPLETA';
  alertasBloqueantes: string[];
  garantias: GarantiaResumen[];
  version: number;
}

// ─── Location model ──────────────────────────────────────────────────────────
export interface Location {
  id?: number;
  numeroFolio: string;
  indice: number;
  nombreUbicacion: string;
  direccion: string;
  codigoPostal: string;
  estado: string;
  municipio: string;
  colonia?: string;
  ciudad?: string;
  tipoConstructivo?: string;
  nivel?: string;
  anioConstruccion?: number;
  giro: GiroInfo;
  garantias: Guarantee[];
  zonaCatastrofica?: string;
  zonaTev?: string;
  zonaFhm?: string;
  alertasBloqueantes: LocationAlert[];
  estadoValidacion: ValidationState;
  fechaCreacion?: Date;
  fechaActualizacion?: Date;
}

// ─── computeValidation ─────────────────────────────────────────────────────────
interface ComputeValidationInput {
  codigoPostal?: string | null;
  giroId?: string | null;
  garantias?: GarantiaResumen[];
  hasClaveIncendio?: boolean;
}

interface ComputeValidationResult {
  estadoValidacion: 'COMPLETA' | 'INCOMPLETA';
  alertasBloqueantes: string[];
}

export function computeValidation(input: ComputeValidationInput): ComputeValidationResult {
  const alerts: string[] = [];

  if (!input.codigoPostal) {
    alerts.push('C\u00f3digo postal no v\u00e1lido o no encontrado');
  }

  const giroInvalid = !input.giroId || input.hasClaveIncendio === false;
  if (giroInvalid) {
    alerts.push('El giro seleccionado no tiene tarifa de incendio asociada');
  }

  const hasValidGarantias =
    Array.isArray(input.garantias) &&
    input.garantias.length > 0 &&
    input.garantias.some((g) => g.sumaAsegurada > 0);

  if (!hasValidGarantias) {
    alerts.push('La ubicaci\u00f3n no tiene garant\u00edas tarifables para calcular');
  }

  return {
    estadoValidacion: alerts.length === 0 ? 'COMPLETA' : 'INCOMPLETA',
    alertasBloqueantes: alerts,
  };
}
