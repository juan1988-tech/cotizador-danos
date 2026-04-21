// ─── Premium Calculation Types ───────────────────────────────────────────────

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

// ─── API Request/Response types ──────────────────────────────────────────────
export interface CalculateRequest {
  version: number;
}

export interface CalculateResponse {
  data: {
    primaNetaTotal: number;
    primaComercialTotal: number;
    primasPorUbicacion: LocationPremium[];
    ubicacionesExcluidas: number[];
    estadoCotizacion: 'CALCULADA';
    version: number;
    fechaUltimaActualizacion: string;
  };
}

export interface GetCoverageOptionsResponse {
  data: {
    codigoCobertura: string;
    descripcion: string;
    seleccionada: boolean;
    obligatoria: boolean;
  }[];
}

export interface PutCoverageOptionsRequest {
  version: number;
  opcionesCobertura: {
    codigoCobertura: string;
    seleccionada: boolean;
  }[];
}

export interface PutCoverageOptionsResponse {
  data: {
    estadoCotizacion: 'COBERTURAS_SELECCIONADAS' | 'CALCULADA';
    opcionesCobertura: {
      codigoCobertura: string;
      descripcion: string;
      seleccionada: boolean;
      obligatoria: boolean;
    }[];
    version: number;
    fechaUltimaActualizacion: string;
  };
}
