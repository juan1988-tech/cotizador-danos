import { pool } from '../config/database';
import { UbicacionResumen } from '../models/Location';
import { OpcionCobertura, PrimaUbicacion, ResultadoCalculo } from '../models/Quote';

const FACTOR_COMERCIAL = 1.2;
const DEFAULT_RATE = 0.005;

export class PremiumService {
  async calculate(
    locations: UbicacionResumen[],
    coverageOptions: OpcionCobertura[]
  ): Promise<ResultadoCalculo> {
    const selectedCoverages = coverageOptions.filter(c => c.seleccionada);
    const completeLocations = locations.filter(l => l.estadoValidacion === 'COMPLETA');
    const excludedIndices = locations
      .filter(l => l.estadoValidacion === 'INCOMPLETA')
      .map(l => l.indiceUbicacion);

    const primasPorUbicacion: PrimaUbicacion[] = [];

    for (const location of completeLocations) {
      const desglose = await this.buildDesglose(location, selectedCoverages);
      const primaNeta = Object.values(desglose).reduce<number>((sum, v) => sum + (v ?? 0), 0);
      primasPorUbicacion.push({
        indiceUbicacion: location.indiceUbicacion,
        primaNeta: round(primaNeta),
        primaComercial: round(primaNeta * FACTOR_COMERCIAL),
        desglose,
      });
    }

    const primaNetaTotal = primasPorUbicacion.reduce((s, p) => s + p.primaNeta, 0);
    const primaComercialTotal = primasPorUbicacion.reduce((s, p) => s + p.primaComercial, 0);

    return {
      primaNetaTotal: round(primaNetaTotal),
      primaComercialTotal: round(primaComercialTotal),
      primasPorUbicacion,
      ubicacionesExcluidas: excludedIndices,
    };
  }

  private async buildDesglose(
    location: UbicacionResumen,
    selectedCoverages: OpcionCobertura[]
  ): Promise<Record<string, number | undefined>> {
    const desglose: Record<string, number | undefined> = {};
    const totalSuma = location.garantias.reduce((s, g) => s + g.sumaAsegurada, 0);

    for (const coverage of selectedCoverages) {
      if (coverage.codigoCobertura === 'COB-001') {
        const rate = location.giroId ? await this.getIncendioRate(location.giroId) : DEFAULT_RATE;
        const suma =
          location.garantias
            .filter(g => g.tipoGarantia === 'INCENDIO')
            .reduce((s, g) => s + g.sumaAsegurada, 0) || totalSuma;
        desglose.incendio = round(suma * rate);
      } else if (coverage.codigoCobertura === 'COB-002') {
        const suma =
          location.garantias
            .filter(g => g.tipoGarantia === 'CAT_NATURAL')
            .reduce((s, g) => s + g.sumaAsegurada, 0) || totalSuma;
        desglose.catNatural = round(suma * 0.003);
      } else if (coverage.codigoCobertura === 'COB-003') {
        const suma =
          location.garantias
            .filter(g => g.tipoGarantia === 'INTERRUPCION_NEGOCIO')
            .reduce((s, g) => s + g.sumaAsegurada, 0) || totalSuma;
        desglose.interrupcionNegocio = round(suma * 0.002);
      }
    }

    return desglose;
  }

  private async getIncendioRate(giroId: string): Promise<number> {
    try {
      const result = await pool.query(
        `SELECT t.tasa_base
         FROM tarifas_incendio t
         JOIN catalogos_giros g ON g.clave_incendio = t.clave_incendio
         WHERE g.clave_giro = $1 AND t.vigente = true
         LIMIT 1`,
        [giroId]
      );
      if (result.rows.length > 0) {
        return parseFloat(result.rows[0].tasa_base as string);
      }
      return DEFAULT_RATE;
    } catch {
      return DEFAULT_RATE;
    }
  }
}

function round(n: number): number {
  return parseFloat(n.toFixed(2));
}
