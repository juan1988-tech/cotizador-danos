jest.mock('../../src/config/database', () => ({
  pool: { query: jest.fn() },
}));

import { pool } from '../../src/config/database';
import { PremiumService } from '../../src/services/PremiumService';
import { OpcionCobertura } from '../../src/models/Quote';
import {
  CatalogServiceUnavailableError,
  NoCoverageSelectedError,
  NoValidLocationsError,
} from '../../src/utils/errors';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const COB_INCENDIO: OpcionCobertura = {
  codigoCobertura: 'COB-001',
  descripcion: 'Incendio y/o Rayo',
  seleccionada: true,
  obligatoria: true,
};

function makeDbRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    indice_ubicacion: 1,
    estado_validacion: 'COMPLETA',
    garantias: [{ tipoGarantia: 'INCENDIO', sumaAsegurada: 500000 }],
    tasa_base: '0.005',
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PremiumService', () => {
  let service: PremiumService;

  beforeEach(() => {
    service = new PremiumService();
    jest.clearAllMocks();
  });

  describe('calculate', () => {
    it('throws NoCoverageSelectedError when no coverage is selected', async () => {
      const noCoverage = { ...COB_INCENDIO, seleccionada: false };

      await expect(service.calculate('COT-TEST', [noCoverage])).rejects.toThrow(
        NoCoverageSelectedError,
      );
    });

    it('throws CatalogServiceUnavailableError when DB query throws', async () => {
      (pool.query as jest.Mock).mockRejectedValue(new Error('DB down'));

      await expect(service.calculate('COT-TEST', [COB_INCENDIO])).rejects.toThrow(
        CatalogServiceUnavailableError,
      );
    });

    it('throws NoValidLocationsError when all rows are INCOMPLETA', async () => {
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [makeDbRow({ estado_validacion: 'INCOMPLETA', tasa_base: null })],
      });

      await expect(service.calculate('COT-TEST', [COB_INCENDIO])).rejects.toThrow(
        NoValidLocationsError,
      );
    });

    it('throws NoValidLocationsError when tasa_base is null for all COMPLETA rows', async () => {
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [makeDbRow({ tasa_base: null })],
      });

      await expect(service.calculate('COT-TEST', [COB_INCENDIO])).rejects.toThrow(
        NoValidLocationsError,
      );
    });

    it('calculates prima using DB tasa_base and garantia sumaAsegurada', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [makeDbRow()] });

      const result = await service.calculate('COT-TEST', [COB_INCENDIO]);

      // 500000 * 0.005 = 2500
      expect(result.primaNetaTotal).toBe(2500);
      expect(result.primasPorUbicacion[0].desglose['INCENDIO']).toBe(2500);
    });

    it('uses different tasa_base from DB when returned', async () => {
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [makeDbRow({ tasa_base: '0.0015' })],
      });

      const result = await service.calculate('COT-TEST', [COB_INCENDIO]);

      // 500000 * 0.0015 = 750
      expect(result.primaNetaTotal).toBe(750);
    });

    it('excludes INCOMPLETA rows and lists them in ubicacionesExcluidas', async () => {
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [
          makeDbRow({ indice_ubicacion: 1 }),
          makeDbRow({ indice_ubicacion: 2, estado_validacion: 'INCOMPLETA', tasa_base: null }),
        ],
      });

      const result = await service.calculate('COT-TEST', [COB_INCENDIO]);

      expect(result.primasPorUbicacion).toHaveLength(1);
      expect(result.primasPorUbicacion[0].indiceUbicacion).toBe(1);
      expect(result.ubicacionesExcluidas).toEqual([2]);
    });

    it('accumulates primaNetaTotal across multiple COMPLETA locations', async () => {
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [makeDbRow({ indice_ubicacion: 1 }), makeDbRow({ indice_ubicacion: 2 })],
      });

      const result = await service.calculate('COT-TEST', [COB_INCENDIO]);

      // 2500 + 2500 = 5000
      expect(result.primasPorUbicacion).toHaveLength(2);
      expect(result.primaNetaTotal).toBe(5000);
    });

    it('applies primaComercial formula: neta * factorComercial * (1+recargo) * (1+iva)', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [makeDbRow()] });

      const result = await service.calculate('COT-TEST', [COB_INCENDIO]);

      // round2(2500 * 1.0 * 1.05 * 1.16) = round2(3045) = 3045
      expect(result.primaComercialTotal).toBeCloseTo(3045, 2);
    });

    it('returns empty ubicacionesExcluidas when all rows are COMPLETA with valid tasa', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [makeDbRow()] });

      const result = await service.calculate('COT-TEST', [COB_INCENDIO]);

      expect(result.ubicacionesExcluidas).toHaveLength(0);
    });

    it('rounds results to 2 decimal places', async () => {
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [makeDbRow({ garantias: [{ tipoGarantia: 'INCENDIO', sumaAsegurada: 333333 }] })],
      });

      const result = await service.calculate('COT-TEST', [COB_INCENDIO]);

      const primaNeta = result.primaNetaTotal;
      expect(primaNeta).toBe(parseFloat(primaNeta.toFixed(2)));
    });

    it('builds desglose with separate keys per tipoGarantia', async () => {
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [
          makeDbRow({
            garantias: [
              { tipoGarantia: 'INCENDIO', sumaAsegurada: 500000 },
              { tipoGarantia: 'ROBO', sumaAsegurada: 100000 },
            ],
          }),
        ],
      });

      const result = await service.calculate('COT-TEST', [COB_INCENDIO]);

      const desglose = result.primasPorUbicacion[0].desglose;
      // 500000 * 0.005 = 2500, 100000 * 0.005 = 500
      expect(desglose['INCENDIO']).toBe(2500);
      expect(desglose['ROBO']).toBe(500);
      expect(result.primaNetaTotal).toBe(3000);
    });
  });
});
