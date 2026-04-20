import { DatosAsegurado, EstadoCotizacion, ESTADO_ORDER } from '../models/Quote';

export function isValidRFC(rfc: string): boolean {
  return /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/i.test(rfc);
}

export function isValidISODate(dateStr: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr) && !isNaN(Date.parse(dateStr));
}

export function isPastDate(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dateStr) < today;
}

export function isGeneralDataComplete(data: Partial<DatosAsegurado>): boolean {
  return (
    !!data.nombreAsegurado &&
    !!data.rfcAsegurado &&
    !!data.agenteId &&
    !!data.suscriptorId &&
    !!data.tipoNegocio &&
    !!data.giroId &&
    !!data.vigenciaInicio &&
    !!data.vigenciaFin
  );
}

export function advanceEstado(
  current: EstadoCotizacion,
  candidate: EstadoCotizacion
): EstadoCotizacion {
  return ESTADO_ORDER[current] >= ESTADO_ORDER[candidate] ? current : candidate;
}
