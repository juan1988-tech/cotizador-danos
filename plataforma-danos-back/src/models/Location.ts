export type EstadoValidacionUbicacion = 'COMPLETA' | 'INCOMPLETA';

export interface Garantia {
  tipoGarantia: string;
  sumaAsegurada: number;
}

export interface UbicacionResumen {
  indiceUbicacion: number;
  descripcion: string | null;
  codigoPostal: string | null;
  giroId: string | null;
  estadoValidacion: EstadoValidacionUbicacion;
  alertasBloqueantes: string[];
  garantias: Garantia[];
  version: number;
}

export interface LocationInput {
  indiceUbicacion: number;
  descripcion?: string;
  codigoPostal?: string;
  giroId?: string;
  garantias?: Garantia[];
  version: number;
}

export function computeValidation(location: {
  codigoPostal?: string | null;
  giroId?: string | null;
  garantias?: Garantia[];
  hasClaveIncendio?: boolean;
}): { estadoValidacion: EstadoValidacionUbicacion; alertasBloqueantes: string[] } {
  const alerts: string[] = [];

  if (!location.codigoPostal) {
    alerts.push('Código postal no válido o no encontrado');
  }
  if (!location.giroId || location.hasClaveIncendio === false) {
    alerts.push('El giro seleccionado no tiene tarifa de incendio asociada');
  }
  const validGarantias = (location.garantias ?? []).filter(g => g.sumaAsegurada > 0);
  if (validGarantias.length === 0) {
    alerts.push('La ubicación no tiene garantías tarifables para calcular');
  }

  return {
    estadoValidacion: alerts.length === 0 ? 'COMPLETA' : 'INCOMPLETA',
    alertasBloqueantes: alerts,
  };
}
