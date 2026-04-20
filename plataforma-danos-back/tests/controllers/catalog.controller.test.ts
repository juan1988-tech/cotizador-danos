jest.mock('../../src/config/database', () => ({
  pool: { query: jest.fn() },
}));

jest.mock('../../src/services/ExternalCoreService');

import { Request, Response, NextFunction } from 'express';
import { pool } from '../../src/config/database';
import { ExternalCoreService } from '../../src/services/ExternalCoreService';
import { getAgents, getSubscribers, getGiros, getPostalCode } from '../../src/controllers/CatalogController';
import { ValidationError, ExternalValidationError, CatalogServiceUnavailableError } from '../../src/utils/errors';

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildReq(overrides: Partial<{ params: Record<string, string>; query: Record<string, string>; body: unknown }> = {}): Request {
  return {
    params: {},
    query: {},
    body: {},
    ...overrides,
  } as unknown as Request;
}

function buildRes(): { status: jest.Mock; json: jest.Mock } {
  const res = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
}

const next: NextFunction = jest.fn();

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CatalogController', () => {
  const AGENTS_RESULT = { data: [{ id: 'AGT-001', nombre: 'Juan Pérez', codigo: 'AGT-001' }], total: 1 };
  const SUBSCRIBERS_RESULT = { data: [{ id: 'SUB-042', nombre: 'Suscriptor', codigo: 'SUB-042' }], total: 1 };
  const GIROS_RESULT = { data: [{ id: 'GIR-015', nombre: 'Comercio al por menor', claveIncendio: 'INC-01' }], total: 1 };
  const CP_RESULT = { codigoPostal: '06600', municipio: 'Cuauhtémoc', estado: 'Ciudad de México', pais: 'México' };

  beforeEach(() => {
    jest.clearAllMocks();
    (next as jest.Mock).mockClear();
  });

  describe('getAgents', () => {
    it('returns 200 with agents list', async () => {
      (ExternalCoreService.prototype.getAgents as jest.Mock).mockResolvedValue(AGENTS_RESULT);
      const req = buildReq();
      const res = buildRes();

      await getAgents(req, res as unknown as Response, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(AGENTS_RESULT);
    });

    it('passes q query param to the service', async () => {
      (ExternalCoreService.prototype.getAgents as jest.Mock).mockResolvedValue({ data: [], total: 0 });
      const req = buildReq({ query: { q: 'Juan' } });
      const res = buildRes();

      await getAgents(req, res as unknown as Response, next);

      expect(ExternalCoreService.prototype.getAgents).toHaveBeenCalledWith('Juan');
    });

    it('does not pass q when query param is absent', async () => {
      (ExternalCoreService.prototype.getAgents as jest.Mock).mockResolvedValue({ data: [], total: 0 });
      const req = buildReq();
      const res = buildRes();

      await getAgents(req, res as unknown as Response, next);

      expect(ExternalCoreService.prototype.getAgents).toHaveBeenCalledWith(undefined);
    });

    it('calls next when service throws', async () => {
      const err = new CatalogServiceUnavailableError();
      (ExternalCoreService.prototype.getAgents as jest.Mock).mockRejectedValue(err);
      const req = buildReq();
      const res = buildRes();

      await getAgents(req, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe('getSubscribers', () => {
    it('returns 200 with subscribers list', async () => {
      (ExternalCoreService.prototype.getSubscribers as jest.Mock).mockResolvedValue(SUBSCRIBERS_RESULT);
      const req = buildReq();
      const res = buildRes();

      await getSubscribers(req, res as unknown as Response, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(SUBSCRIBERS_RESULT);
    });

    it('passes q query param to the service', async () => {
      (ExternalCoreService.prototype.getSubscribers as jest.Mock).mockResolvedValue({ data: [], total: 0 });
      const req = buildReq({ query: { q: 'Suscr' } });
      const res = buildRes();

      await getSubscribers(req, res as unknown as Response, next);

      expect(ExternalCoreService.prototype.getSubscribers).toHaveBeenCalledWith('Suscr');
    });

    it('calls next when service throws', async () => {
      const err = new CatalogServiceUnavailableError();
      (ExternalCoreService.prototype.getSubscribers as jest.Mock).mockRejectedValue(err);
      const req = buildReq();
      const res = buildRes();

      await getSubscribers(req, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe('getGiros', () => {
    it('returns 200 with giros list', async () => {
      (ExternalCoreService.prototype.getGiros as jest.Mock).mockResolvedValue(GIROS_RESULT);
      const req = buildReq();
      const res = buildRes();

      await getGiros(req, res as unknown as Response, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(GIROS_RESULT);
    });

    it('calls next when service throws', async () => {
      const err = new CatalogServiceUnavailableError();
      (ExternalCoreService.prototype.getGiros as jest.Mock).mockRejectedValue(err);
      const req = buildReq();
      const res = buildRes();

      await getGiros(req, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe('getPostalCode', () => {
    it('returns 200 with postal code data when cp is valid', async () => {
      (ExternalCoreService.prototype.validatePostalCode as jest.Mock).mockResolvedValue(CP_RESULT);
      const req = buildReq({ params: { cp: '06600' } });
      const res = buildRes();

      await getPostalCode(req, res as unknown as Response, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ data: CP_RESULT });
    });

    it('calls next with ValidationError when cp has fewer than 3 characters', async () => {
      const req = buildReq({ params: { cp: '06' } });
      const res = buildRes();

      await getPostalCode(req, res as unknown as Response, next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(ValidationError);
    });

    it('calls next with ValidationError when cp is empty', async () => {
      const req = buildReq({ params: { cp: '' } });
      const res = buildRes();

      await getPostalCode(req, res as unknown as Response, next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(ValidationError);
    });

    it('calls next when service throws ExternalValidationError', async () => {
      const err = new ExternalValidationError('CP no encontrado', { field: 'cp', value: '99999' });
      (ExternalCoreService.prototype.validatePostalCode as jest.Mock).mockRejectedValue(err);
      const req = buildReq({ params: { cp: '99999' } });
      const res = buildRes();

      await getPostalCode(req, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });
});
