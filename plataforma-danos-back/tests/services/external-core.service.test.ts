jest.mock('../../src/config/database', () => ({
  pool: { query: jest.fn() },
}));

import { pool } from '../../src/config/database';
import { ExternalCoreService } from '../../src/services/ExternalCoreService';
import {
  CatalogServiceUnavailableError,
  ExternalValidationError,
} from '../../src/utils/errors';

const CURRENT_YEAR = new Date().getFullYear();

describe('ExternalCoreService', () => {
  let service: ExternalCoreService;

  beforeEach(() => {
    service = new ExternalCoreService();
    jest.clearAllMocks();
  });

  // ── getAgents ──────────────────────────────────────────────────────────────
  describe('getAgents', () => {
    it('returns agents list from DB', async () => {
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [{ id: 'AGT-001', nombre: 'Juan Pérez', codigo: 'AGT-001' }],
        rowCount: 1,
      });

      const result = await service.getAgents();

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.data[0].nombre).toBe('Juan Pérez');
    });

    it('returns empty list when no agents match', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [], rowCount: 0 });

      const result = await service.getAgents();

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('passes LIKE filter in query when q is provided', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [], rowCount: 0 });

      await service.getAgents('Juan');

      const [sql, params] = (pool.query as jest.Mock).mock.calls[0];
      expect(sql).toContain('LIKE');
      expect(params).toContain('%Juan%');
    });

    it('does not include filter when q is undefined', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [], rowCount: 0 });

      await service.getAgents();

      const [, params] = (pool.query as jest.Mock).mock.calls[0];
      expect(params).toHaveLength(0);
    });

    it('throws CatalogServiceUnavailableError on DB error', async () => {
      (pool.query as jest.Mock).mockRejectedValue(new Error('Connection failed'));

      await expect(service.getAgents()).rejects.toThrow(CatalogServiceUnavailableError);
    });
  });

  // ── getSubscribers ─────────────────────────────────────────────────────────
  describe('getSubscribers', () => {
    it('returns subscribers list from DB', async () => {
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [{ id: 'SUB-042', nombre: 'Suscriptor Principal', codigo: 'SUB-042' }],
        rowCount: 1,
      });

      const result = await service.getSubscribers();

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('passes filter when q is provided', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [], rowCount: 0 });

      await service.getSubscribers('Princ');

      const [sql, params] = (pool.query as jest.Mock).mock.calls[0];
      expect(sql).toContain('LIKE');
      expect(params).toContain('%Princ%');
    });

    it('throws CatalogServiceUnavailableError on DB error', async () => {
      (pool.query as jest.Mock).mockRejectedValue(new Error('DB down'));

      await expect(service.getSubscribers()).rejects.toThrow(CatalogServiceUnavailableError);
    });
  });

  // ── getGiros ───────────────────────────────────────────────────────────────
  describe('getGiros', () => {
    it('returns giros list from DB', async () => {
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [{ id: 'GIR-015', nombre: 'Comercio al por menor', claveIncendio: 'INC-01' }],
        rowCount: 1,
      });

      const result = await service.getGiros();

      expect(result.data[0].claveIncendio).toBe('INC-01');
    });

    it('passes LIKE filter in query when q is provided', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [], rowCount: 0 });

      await service.getGiros('Comercio');

      const [sql, params] = (pool.query as jest.Mock).mock.calls[0];
      expect(sql).toContain('LIKE');
      expect(params).toContain('%Comercio%');
    });

    it('throws CatalogServiceUnavailableError on DB error', async () => {
      (pool.query as jest.Mock).mockRejectedValue(new Error('DB error'));

      await expect(service.getGiros()).rejects.toThrow(CatalogServiceUnavailableError);
    });
  });

  // ── validatePostalCode ─────────────────────────────────────────────────────
  describe('validatePostalCode', () => {
    it('returns PostalCodeInfo when CP exists in DB', async () => {
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [{ codigoPostal: '06600', municipio: 'Cuauhtémoc', estado: 'Ciudad de México', pais: 'México' }],
      });

      const result = await service.validatePostalCode('06600');

      expect(result.codigoPostal).toBe('06600');
      expect(result.municipio).toBe('Cuauhtémoc');
      expect(result.pais).toBe('México');
    });

    it('throws ExternalValidationError when CP is not found in DB', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      await expect(service.validatePostalCode('99999')).rejects.toThrow(ExternalValidationError);
    });

    it('throws CatalogServiceUnavailableError on DB connection error', async () => {
      (pool.query as jest.Mock).mockRejectedValue(new Error('DB error'));

      await expect(service.validatePostalCode('06600')).rejects.toThrow(
        CatalogServiceUnavailableError,
      );
    });
  });

  // ── agentExists ────────────────────────────────────────────────────────────
  describe('agentExists', () => {
    it('returns true when agent row is found', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [{}] });

      expect(await service.agentExists('AGT-001')).toBe(true);
    });

    it('returns false when no agent row is found', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      expect(await service.agentExists('AGT-999')).toBe(false);
    });

    it('throws CatalogServiceUnavailableError on DB error', async () => {
      (pool.query as jest.Mock).mockRejectedValue(new Error('DB down'));

      await expect(service.agentExists('AGT-001')).rejects.toThrow(CatalogServiceUnavailableError);
    });
  });

  // ── subscriberExists ───────────────────────────────────────────────────────
  describe('subscriberExists', () => {
    it('returns true when subscriber is found', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [{}] });

      expect(await service.subscriberExists('SUB-042')).toBe(true);
    });

    it('returns false when subscriber is not found', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      expect(await service.subscriberExists('SUB-999')).toBe(false);
    });

    it('throws CatalogServiceUnavailableError on DB error', async () => {
      (pool.query as jest.Mock).mockRejectedValue(new Error('DB down'));

      await expect(service.subscriberExists('SUB-042')).rejects.toThrow(
        CatalogServiceUnavailableError,
      );
    });
  });

  // ── giroExists ─────────────────────────────────────────────────────────────
  describe('giroExists', () => {
    it('returns true when giro is found', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [{}] });

      expect(await service.giroExists('GIR-015')).toBe(true);
    });

    it('returns false when giro is not found', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      expect(await service.giroExists('GIR-999')).toBe(false);
    });

    it('throws CatalogServiceUnavailableError on DB error', async () => {
      (pool.query as jest.Mock).mockRejectedValue(new Error('DB down'));

      await expect(service.giroExists('GIR-015')).rejects.toThrow(
        CatalogServiceUnavailableError,
      );
    });
  });

  // ── generateFolio ──────────────────────────────────────────────────────────
  describe('generateFolio', () => {
    it('returns a folio formatted as COT-YEAR-NNNNNN', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [{ seq: 1000 }] });

      const folio = await service.generateFolio();

      expect(folio).toBe(`COT-${CURRENT_YEAR}-001000`);
    });

    it('pads the sequence number with leading zeros to 6 digits', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [{ seq: 1 }] });

      const folio = await service.generateFolio();

      expect(folio).toBe(`COT-${CURRENT_YEAR}-000001`);
    });

    it('throws CatalogServiceUnavailableError on DB error', async () => {
      (pool.query as jest.Mock).mockRejectedValue(new Error('sequence error'));

      await expect(service.generateFolio()).rejects.toThrow(CatalogServiceUnavailableError);
    });
  });
});
