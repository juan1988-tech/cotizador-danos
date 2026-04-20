jest.mock('../../src/config/database', () => ({
  pool: { query: jest.fn() },
}));

import { pool } from '../../src/config/database';
import { PremiumService } from '../../src/services/PremiumService';
import { UbicacionResumen } from '../../src/models/Location';
import { OpcionCobertura } from '../../src/models/Quote';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeLocation(overrides: Partial<UbicacionResumen> = {}): UbicacionResumen {
  return {
    indiceUbicacion: 1,
    descripcion: 'Bodega principal',
    codigoPostal: '06600',
    giroId: 'GIR-015',
    estadoValidacion: 'COMPLETA',
    alertasBloqueantes: [],
    garantias: [{ tipoGarantia: 'INCENDIO', sumaAsegurada: 500000 }],
    version: 1,
    ...overrides,
  };
}

const COB_INCENDIO: OpcionCobertura = {
  codigoCobertura: 'COB-001',
  descripcion: 'Incendio y/o Rayo',
  seleccionada: true,
  obligatoria: true,
};

const COB_CAT_NATURAL: OpcionCobertura = {
  codigoCobertura: 'COB-002',
  descripcion: 'Catástrofe Natural',
  seleccionada: true,
  obligatoria: false,
};

const COB_INTERRUPCION: OpcionCobertura = {
  codigoCobertura: 'COB-003',
  descripcion: 'Interrupción de Negocio',
  seleccionada: true,
  obligatoria: false,
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PremiumService', () => {
  let service: PremiumService;

  beforeEach(() => {
    service = new PremiumService();
    jest.clearAllMocks();
    // Default: no DB tarifa found → falls back to DEFAULT_RATE = 0.005
    (pool.query as jest.Mock).mockResolvedValue({ rows: [] });
  });

  describe('calculate', () => {
    it('returns zero totals and no primasPorUbicacion when all locations are INCOMPLETA', async () => {
      const incompleteLocation = makeLocation({ estadoValidacion: 'INCOMPLETA' });

      const result = await service.calculate([incompleteLocation], [COB_INCENDIO]);

      expect(result.primaNetaTotal).toBe(0);
      expect(result.primaComercialTotal).toBe(0);
      expect(result.primasPorUbicacion).toHaveLength(0);
      expect(result.ubicacionesExcluidas).toContain(1);
    });

    it('calculates incendio premium at DEFAULT_RATE (0.5%) when no DB tarifa found', async () => {
      const location = makeLocation();

      const result = await service.calculate([location], [COB_INCENDIO]);

      // 500000 * 0.005 = 2500
      expect(result.primaNetaTotal).toBe(2500);
      expect(result.primasPorUbicacion[0].desglose.incendio).toBe(2500);
    });

    it('uses DB tarifa rate when found for the giro', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [{ tasa_base: '0.0015' }] });
      const location = makeLocation();

      const result = await service.calculate([location], [COB_INCENDIO]);

      // 500000 * 0.0015 = 750
      expect(result.primaNetaTotal).toBe(750);
      expect(result.primasPorUbicacion[0].desglose.incendio).toBe(750);
    });

    it('calculates catNatural premium at 0.3% of matching garantia', async () => {
      const location = makeLocation({
        garantias: [{ tipoGarantia: 'CAT_NATURAL', sumaAsegurada: 300000 }],
      });

      const result = await service.calculate([location], [COB_CAT_NATURAL]);

      // 300000 * 0.003 = 900
      expect(result.primasPorUbicacion[0].desglose.catNatural).toBe(900);
    });

    it('falls back to totalSuma for catNatural when no specific CAT_NATURAL garantia', async () => {
      const location = makeLocation({
        garantias: [{ tipoGarantia: 'INCENDIO', sumaAsegurada: 200000 }],
      });

      const result = await service.calculate([location], [COB_CAT_NATURAL]);

      // falls back to total: 200000 * 0.003 = 600
      expect(result.primasPorUbicacion[0].desglose.catNatural).toBe(600);
    });

    it('calculates interrupcionNegocio premium at 0.2% of matching garantia', async () => {
      const location = makeLocation({
        garantias: [{ tipoGarantia: 'INTERRUPCION_NEGOCIO', sumaAsegurada: 200000 }],
      });

      const result = await service.calculate([location], [COB_INTERRUPCION]);

      // 200000 * 0.002 = 400
      expect(result.primasPorUbicacion[0].desglose.interrupcionNegocio).toBe(400);
    });

    it('applies FACTOR_COMERCIAL of 1.2 to primaComercial', async () => {
      const location = makeLocation();

      const result = await service.calculate([location], [COB_INCENDIO]);

      expect(result.primaComercialTotal).toBeCloseTo(result.primaNetaTotal * 1.2, 2);
      expect(result.primasPorUbicacion[0].primaComercial).toBeCloseTo(
        result.primasPorUbicacion[0].primaNeta * 1.2,
        2,
      );
    });

    it('excludes INCOMPLETA locations and lists them in ubicacionesExcluidas', async () => {
      const completeLocation = makeLocation({ indiceUbicacion: 1 });
      const incompleteLocation = makeLocation({
        indiceUbicacion: 2,
        estadoValidacion: 'INCOMPLETA',
      });

      const result = await service.calculate(
        [completeLocation, incompleteLocation],
        [COB_INCENDIO],
      );

      expect(result.primasPorUbicacion).toHaveLength(1);
      expect(result.primasPorUbicacion[0].indiceUbicacion).toBe(1);
      expect(result.ubicacionesExcluidas).toEqual([2]);
    });

    it('accumulates primaNetaTotal across multiple COMPLETA locations', async () => {
      const loc1 = makeLocation({ indiceUbicacion: 1 });
      const loc2 = makeLocation({ indiceUbicacion: 2 });

      const result = await service.calculate([loc1, loc2], [COB_INCENDIO]);

      expect(result.primasPorUbicacion).toHaveLength(2);
      const expectedTotal =
        result.primasPorUbicacion[0].primaNeta + result.primasPorUbicacion[1].primaNeta;
      expect(result.primaNetaTotal).toBe(expectedTotal);
    });

    it('returns empty ubicacionesExcluidas when all locations are COMPLETA', async () => {
      const location = makeLocation();

      const result = await service.calculate([location], [COB_INCENDIO]);

      expect(result.ubicacionesExcluidas).toHaveLength(0);
    });

    it('rounds results to 2 decimal places', async () => {
      const location = makeLocation({
        garantias: [{ tipoGarantia: 'INCENDIO', sumaAsegurada: 333333 }],
      });

      const result = await service.calculate([location], [COB_INCENDIO]);

      const primaNeta = result.primaNetaTotal;
      expect(primaNeta).toBe(parseFloat(primaNeta.toFixed(2)));
    });

    it('calculates multiple coverage components correctly in the same location', async () => {
      const location = makeLocation({
        garantias: [
          { tipoGarantia: 'INCENDIO', sumaAsegurada: 500000 },
          { tipoGarantia: 'CAT_NATURAL', sumaAsegurada: 300000 },
        ],
      });

      const result = await service.calculate([location], [COB_INCENDIO, COB_CAT_NATURAL]);

      const desglose = result.primasPorUbicacion[0].desglose;
      expect(desglose.incendio).toBeDefined();
      expect(desglose.catNatural).toBeDefined();
      // primaNeta = incendio + catNatural = 2500 + 900 = 3400
      expect(result.primaNetaTotal).toBeCloseTo(3400, 2);
    });

    it('falls back to DEFAULT_RATE when pool.query throws inside getIncendioRate', async () => {
      (pool.query as jest.Mock).mockRejectedValue(new Error('DB connection failed'));
      const location = makeLocation({ giroId: 'GIR-FAIL' });

      const result = await service.calculate([location], [COB_INCENDIO]);

      // 500000 * 0.005 (DEFAULT_RATE) = 2500
      expect(result.primaNetaTotal).toBe(2500);
      expect(result.primasPorUbicacion[0].desglose.incendio).toBe(2500);
    });

    it('skips non-selected coverages', async () => {
      const location = makeLocation();
      const deselectedCoverage = { ...COB_CAT_NATURAL, seleccionada: false };

      const result = await service.calculate([location], [deselectedCoverage]);

      expect(result.primaNetaTotal).toBe(0);
      expect(result.primasPorUbicacion[0].desglose.catNatural).toBeUndefined();
    });
  });
});
