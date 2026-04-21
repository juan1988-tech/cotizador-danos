import { Pool } from 'pg';
import { pool as defaultPool } from '../config/database';
import { OpcionCobertura, LocationPremium, PremiumCalculationResult } from '../models/Quote';
import { GarantiaResumen } from '../models/Location';
import {
  CatalogServiceUnavailableError,
  NoCoverageSelectedError,
  NoValidLocationsError,
} from '../utils/errors';

// ─── Fixed commercial conversion parameters ───────────────────────────────────
const CALC_PARAMS = {
  factorComercial: 1.0,
  derecho: 0,
  recargo: 0.05,
  iva: 0.16,
};

// ─── Internal DB row shape ────────────────────────────────────────────────────
interface LocationRateRow {
  indice_ubicacion: number;
  estado_validacion: 'COMPLETA' | 'INCOMPLETA';
  garantias: GarantiaResumen[];
  tasa_base: string | null; // DECIMAL comes as string from node-postgres
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// ─── PremiumService ───────────────────────────────────────────────────────────
export class PremiumService {
  private readonly db: Pool;

  constructor(db?: Pool) {
    this.db = db ?? defaultPool;
  }

  async calculate(
    folio: string,
    opcionesCobertura: OpcionCobertura[],
  ): Promise<PremiumCalculationResult> {
    // 1. Guard: at least one coverage must be selected
    if (!opcionesCobertura.some((c) => c.seleccionada)) {
      throw new NoCoverageSelectedError();
    }

    // 2. Query all locations with their fire rate (via giro → clave_incendio → tasa_base)
    let rows: LocationRateRow[];
    try {
      const { rows: dbRows } = await this.db.query(
        `SELECT
           l.indice_ubicacion,
           l.estado_validacion,
           l.garantias,
           ti.tasa_base
         FROM locations l
         LEFT JOIN catalogos_giros cg
                ON cg.clave_giro = l.giro_id AND cg.activo = true
         LEFT JOIN tarifas_incendio ti
                ON ti.clave_incendio = cg.clave_incendio AND ti.vigente = true
         WHERE l.numero_folio = $1
         ORDER BY l.indice_ubicacion`,
        [folio],
      );
      rows = dbRows as LocationRateRow[];
    } catch {
      throw new CatalogServiceUnavailableError();
    }

    // 3. Separate COMPLETA (with valid rate) vs excluded
    const validRows: LocationRateRow[] = [];
    const ubicacionesExcluidas: number[] = [];

    for (const row of rows) {
      if (row.estado_validacion === 'COMPLETA' && row.tasa_base != null) {
        validRows.push(row);
      } else {
        ubicacionesExcluidas.push(row.indice_ubicacion);
      }
    }

    if (validRows.length === 0) {
      throw new NoValidLocationsError(ubicacionesExcluidas);
    }

    // 4. Calculate per location
    const primasPorUbicacion: LocationPremium[] = validRows.map((loc) => {
      const tasa = parseFloat(loc.tasa_base as string);
      const garantias = loc.garantias ?? [];
      const desglose: Record<string, number> = {};
      let primaNeta = 0;

      for (const g of garantias) {
        if (g.sumaAsegurada > 0) {
          const prima = round2(g.sumaAsegurada * tasa);
          desglose[g.tipoGarantia] = (desglose[g.tipoGarantia] ?? 0) + prima;
          primaNeta += prima;
        }
      }
      primaNeta = round2(primaNeta);

      const primaComercial = round2(
        (primaNeta * CALC_PARAMS.factorComercial + CALC_PARAMS.derecho) *
          (1 + CALC_PARAMS.recargo) *
          (1 + CALC_PARAMS.iva),
      );

      return {
        indiceUbicacion: loc.indice_ubicacion,
        primaNeta,
        primaComercial,
        desglose,
      };
    });

    const primaNetaTotal = round2(
      primasPorUbicacion.reduce((sum, p) => sum + p.primaNeta, 0),
    );
    const primaComercialTotal = round2(
      primasPorUbicacion.reduce((sum, p) => sum + p.primaComercial, 0),
    );

    return {
      primaNetaTotal,
      primaComercialTotal,
      primasPorUbicacion,
      ubicacionesExcluidas,
    };
  }
}
