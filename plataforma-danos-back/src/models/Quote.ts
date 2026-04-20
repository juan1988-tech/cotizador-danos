export type EstadoCotizacion =
  | 'EN_EDICION'
  | 'DATOS_GENERALES_COMPLETOS'
  | 'UBICACIONES_CONFIGURADAS'
  | 'COBERTURAS_SELECCIONADAS'
  | 'CALCULADA';

export type TipoLayout = 'UNIFORME' | 'PERSONALIZADO';

export const ESTADO_ORDER: Record<EstadoCotizacion, number> = {
  EN_EDICION: 0,
  DATOS_GENERALES_COMPLETOS: 1,
  UBICACIONES_CONFIGURADAS: 2,
  COBERTURAS_SELECCIONADAS: 3,
  CALCULADA: 4,
};

export interface DatosAsegurado {
  nombreAsegurado: string;
  rfcAsegurado: string;
  agenteId: string;
  suscriptorId: string;
  tipoNegocio: string;
  giroId: string;
  vigenciaInicio: string;
  vigenciaFin: string;
}

export interface ConfiguracionLayout {
  numeroUbicaciones: number;
  tipoLayout: TipoLayout;
}

export interface OpcionCobertura {
  codigoCobertura: string;
  descripcion: string;
  seleccionada: boolean;
  obligatoria: boolean;
}

export interface PrimaUbicacion {
  indiceUbicacion: number;
  primaNeta: number;
  primaComercial: number;
  desglose: Record<string, number | undefined>;
}

export interface ResultadoCalculo {
  primaNetaTotal: number;
  primaComercialTotal: number;
  primasPorUbicacion: PrimaUbicacion[];
  ubicacionesExcluidas: number[];
}

export interface Quote {
  numeroFolio: string;
  estadoCotizacion: EstadoCotizacion;
  datosAsegurado: DatosAsegurado | null;
  configuracionLayout: ConfiguracionLayout | null;
  opcionesCobertura: OpcionCobertura[] | null;
  primasPorUbicacion: ResultadoCalculo | null;
  version: number;
  fechaCreacion: string;
  fechaUltimaActualizacion: string;
}

export function maxEstado(a: EstadoCotizacion, b: EstadoCotizacion): EstadoCotizacion {
  return ESTADO_ORDER[a] >= ESTADO_ORDER[b] ? a : b;
}
