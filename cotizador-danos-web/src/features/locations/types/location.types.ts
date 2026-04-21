// ─── Validation state ────────────────────────────────────────────────────────
export type ValidationState = 'COMPLETA' | 'INCOMPLETA';

export type AlertSeverity = 'ERROR' | 'WARNING' | 'INFO';

// ─── GiroInfo ─────────────────────────────────────────────────────────────────
export interface GiroInfo {
  claveGiro: string;
  descripcion: string;
  claveIncendio: string;
  categoria?: string;
}

// ─── Guarantee ───────────────────────────────────────────────────────────────
export interface Guarantee {
  clave: string;
  descripcion: string;
  sumaAsegurada: number;
  deducible?: number;
}

// ─── GarantiaResumen ─────────────────────────────────────────────────────────
export interface GarantiaResumen {
  tipoGarantia: string;
  sumaAsegurada: number;
}

// ─── LocationAlert ───────────────────────────────────────────────────────────
export interface LocationAlert {
  tipo: string;
  mensaje: string;
  severidad: AlertSeverity;
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
  giro: GiroInfo | null;
  garantias: Guarantee[];
  zonaCatastrofica?: string;
  zonaTev?: string;
  zonaFhm?: string;
  alertasBloqueantes: LocationAlert[];
  estadoValidacion: ValidationState;
  fechaCreacion?: string;
  fechaActualizacion?: string;
  version?: number;
}

// ─── UbicacionResumen ─────────────────────────────────────────────────────────
export interface UbicacionResumen {
  indiceUbicacion: number;
  descripcion: string | null;
  codigoPostal: string | null;
  giroId: string | null;
  estadoValidacion: ValidationState;
  alertasBloqueantes: string[];
  garantias: GarantiaResumen[];
  version: number;
}

// ─── API Request/Response types ──────────────────────────────────────────────
export interface GetLocationsResponse {
  data: {
    ubicaciones: UbicacionResumen[];
    resumen: {
      total: number;
      completas: number;
      incompletas: number;
    };
  };
}

export interface PatchLocationRequest {
  version: number;
  descripcion?: string;
  direccion?: string;
  codigoPostal?: string;
  estado?: string;
  municipio?: string;
  colonia?: string;
  ciudad?: string;
  tipoConstructivo?: string;
  nivel?: string;
  anioConstruccion?: number;
  giroId?: string;
  garantias?: GarantiaResumen[];
}

export interface PatchLocationResponse {
  data: UbicacionResumen;
}

export interface PostLayoutRequest {
  version: number;
  tipoLayout: 'UNIFORME' | 'PERSONALIZADO';
  numeroUbicaciones: number;
}

export interface PostLayoutResponse {
  data: {
    configuracionLayout: {
      tipoLayout: 'UNIFORME' | 'PERSONALIZADO';
      numeroUbicaciones: number;
    };
    version: number;
    fechaUltimaActualizacion: string;
  };
}

export interface PutLocationsRequest {
  version: number;
  ubicaciones: Partial<Location>[];
}

