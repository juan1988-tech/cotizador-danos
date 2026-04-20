// ─── RFC ─────────────────────────────────────────────────────────────────────
export function isValidRFC(value: string): boolean {
  return /^[A-Z]{3,4}\d{6}[A-Z0-9]{3}$/i.test(value);
}

// ─── ISO date (YYYY-MM-DD only) ───────────────────────────────────────────────
export function isValidISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
}

// ─── Past date check ──────────────────────────────────────────────────────────
export function isPastDate(dateStr: string): boolean {
  const todayStr = new Date().toISOString().split('T')[0];
  return dateStr < todayStr;
}

// ─── General data completeness ────────────────────────────────────────────────
const REQUIRED_GENERAL_FIELDS = [
  'nombreAsegurado',
  'rfcAsegurado',
  'agenteId',
  'suscriptorId',
  'tipoNegocio',
  'giroId',
  'vigenciaInicio',
  'vigenciaFin',
] as const;

export function isGeneralDataComplete(data: Record<string, unknown>): boolean {
  return REQUIRED_GENERAL_FIELDS.every((field) => data[field] != null && data[field] !== '');
}

// ─── Quote state progression ──────────────────────────────────────────────────
type QuoteStateKey =
  | 'EN_EDICION'
  | 'DATOS_GENERALES_COMPLETOS'
  | 'UBICACIONES_CONFIGURADAS'
  | 'COBERTURAS_SELECCIONADAS'
  | 'CALCULADA';

const STATE_ORDER: Record<QuoteStateKey, number> = {
  EN_EDICION: 0,
  DATOS_GENERALES_COMPLETOS: 1,
  UBICACIONES_CONFIGURADAS: 2,
  COBERTURAS_SELECCIONADAS: 3,
  CALCULADA: 4,
};

export function advanceEstado(current: QuoteStateKey, candidate: QuoteStateKey): QuoteStateKey {
  return STATE_ORDER[current] >= STATE_ORDER[candidate] ? current : candidate;
}
