jest.mock('../../src/config/database', () => ({
  pool: { query: jest.fn(), connect: jest.fn() },
}));

jest.mock('../../src/services/ExternalCoreService');
jest.mock('../../src/services/PremiumService');

import { Request, Response, NextFunction } from 'express';
import { pool } from '../../src/config/database';
import { ExternalCoreService } from '../../src/services/ExternalCoreService';
import { PremiumService } from '../../src/services/PremiumService';
import {
  createQuote,
  getQuote,
  patchGeneralData,
  getCoverageOptions,
  putCoverageOptions,
  calculatePremium,
} from '../../src/controllers/QuoteController';
import {
  QuoteNotFoundError,
  VersionConflictError,
  ExternalValidationError,
  NoValidLocationsError,
  NoCoverageSelectedError,
  ObligatoryCoberturaCantBeDeselectedError,
} from '../../src/utils/errors';

// ── Helpers ───────────────────────────────────────────────────────────────────

const FOLIO = 'COT-2026-001000';
const NOW = new Date();

const QUOTE_ROW = {
  numero_folio: FOLIO,
  estado_cotizacion: 'EN_EDICION',
  datos_asegurado: null,
  configuracion_layout: null,
  opciones_cobertura: null,
  primas_por_ubicacion: null,
  version: 1,
  fecha_creacion: NOW,
  fecha_ultima_actualizacion: NOW,
};

const COMPLETE_DATOS = {
  nombreAsegurado: 'Empresa Test S.A.',
  rfcAsegurado: 'EEJ900101AAA',
  agenteId: 'AGT-001',
  suscriptorId: 'SUB-042',
  tipoNegocio: 'Comercio al por menor',
  giroId: 'GIR-015',
  vigenciaInicio: '2026-05-01',
  vigenciaFin: '2027-05-01',
};

function buildReq(overrides: Partial<{ params: Record<string, string>; body: unknown; query: Record<string, string> }> = {}): Request {
  return {
    params: { folio: FOLIO },
    body: {},
    query: {},
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

describe('QuoteController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (next as jest.Mock).mockClear();
  });

  // ── createQuote ─────────────────────────────────────────────────────────────
  describe('createQuote', () => {
    it('returns 201 with new folio when quote does not exist yet', async () => {
      (ExternalCoreService.prototype.generateFolio as jest.Mock).mockResolvedValue(FOLIO);
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] }) // check existing
        .mockResolvedValueOnce({ rows: [{ ...QUOTE_ROW }] }); // insert

      const req = buildReq({ params: {} });
      const res = buildRes();

      await createQuote(req as unknown as Request<never>, res as unknown as Response, next);

      expect(res.status).toHaveBeenCalledWith(201);
      const body = res.json.mock.calls[0][0];
      expect(body.data.numeroFolio).toBe(FOLIO);
      expect(body.data.estadoCotizacion).toBe('EN_EDICION');
    });

    it('returns 200 when the generated folio already exists (idempotent)', async () => {
      (ExternalCoreService.prototype.generateFolio as jest.Mock).mockResolvedValue(FOLIO);
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ ...QUOTE_ROW }] }); // existing found

      const req = buildReq({ params: {} });
      const res = buildRes();

      await createQuote(req as unknown as Request<never>, res as unknown as Response, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('calls next when generateFolio throws CatalogServiceUnavailableError', async () => {
      const err = new (require('../../src/utils/errors').CatalogServiceUnavailableError)();
      (ExternalCoreService.prototype.generateFolio as jest.Mock).mockRejectedValue(err);

      const req = buildReq({ params: {} });
      const res = buildRes();

      await createQuote(req as unknown as Request<never>, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  // ── getQuote ─────────────────────────────────────────────────────────────────
  describe('getQuote', () => {
    it('returns 200 with quote data', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [{ ...QUOTE_ROW }] });

      const req = buildReq();
      const res = buildRes();

      await getQuote(req as unknown as Request<{ folio: string }>, res as unknown as Response, next);

      expect(res.status).toHaveBeenCalledWith(200);
      const body = res.json.mock.calls[0][0];
      expect(body.data.numeroFolio).toBe(FOLIO);
    });

    it('calls next with QuoteNotFoundError when folio does not exist', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      const req = buildReq();
      const res = buildRes();

      await getQuote(req as unknown as Request<{ folio: string }>, res as unknown as Response, next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(QuoteNotFoundError);
    });
  });

  // ── patchGeneralData ─────────────────────────────────────────────────────────
  describe('patchGeneralData', () => {
    it('returns 200 when version matches and all catalog refs are valid', async () => {
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ ...QUOTE_ROW }] }) // findQuote
        .mockResolvedValueOnce({ rows: [{ ...QUOTE_ROW, datos_asegurado: COMPLETE_DATOS, version: 2 }] }); // update

      (ExternalCoreService.prototype.agentExists as jest.Mock).mockResolvedValue(true);
      (ExternalCoreService.prototype.subscriberExists as jest.Mock).mockResolvedValue(true);
      (ExternalCoreService.prototype.giroExists as jest.Mock).mockResolvedValue(true);

      const req = buildReq({ body: { ...COMPLETE_DATOS, version: 1 } });
      const res = buildRes();

      await patchGeneralData(req as unknown as Request<{ folio: string }>, res as unknown as Response, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('calls next with VersionConflictError when version does not match', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [{ ...QUOTE_ROW }] }); // version=1

      const req = buildReq({ body: { nombreAsegurado: 'Test', version: 99 } });
      const res = buildRes();

      await patchGeneralData(req as unknown as Request<{ folio: string }>, res as unknown as Response, next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(VersionConflictError);
    });

    it('calls next with ExternalValidationError when agente does not exist', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [{ ...QUOTE_ROW }] });
      (ExternalCoreService.prototype.agentExists as jest.Mock).mockResolvedValue(false);

      const req = buildReq({ body: { agenteId: 'AGT-999', version: 1 } });
      const res = buildRes();

      await patchGeneralData(req as unknown as Request<{ folio: string }>, res as unknown as Response, next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(ExternalValidationError);
    });

    it('calls next with ExternalValidationError when suscriptor does not exist', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [{ ...QUOTE_ROW }] });
      (ExternalCoreService.prototype.agentExists as jest.Mock).mockResolvedValue(true);
      (ExternalCoreService.prototype.subscriberExists as jest.Mock).mockResolvedValue(false);

      const req = buildReq({ body: { agenteId: 'AGT-001', suscriptorId: 'SUB-999', version: 1 } });
      const res = buildRes();

      await patchGeneralData(req as unknown as Request<{ folio: string }>, res as unknown as Response, next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(ExternalValidationError);
    });

    it('calls next with QuoteNotFoundError when folio does not exist', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      const req = buildReq({ body: { nombreAsegurado: 'Test', version: 1 } });
      const res = buildRes();

      await patchGeneralData(req as unknown as Request<{ folio: string }>, res as unknown as Response, next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(QuoteNotFoundError);
    });

    it('calls next with ExternalValidationError when giro does not exist', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [{ ...QUOTE_ROW }] });
      (ExternalCoreService.prototype.agentExists as jest.Mock).mockResolvedValue(true);
      (ExternalCoreService.prototype.subscriberExists as jest.Mock).mockResolvedValue(true);
      (ExternalCoreService.prototype.giroExists as jest.Mock).mockResolvedValue(false);

      const req = buildReq({
        body: { agenteId: 'AGT-001', suscriptorId: 'SUB-042', giroId: 'GIR-999', version: 1 },
      });
      const res = buildRes();

      await patchGeneralData(req as unknown as Request<{ folio: string }>, res as unknown as Response, next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(ExternalValidationError);
      expect(err.message).toContain('GIR-999');
    });

    it('calls next with VersionConflictError when UPDATE returns no rows (concurrent modification)', async () => {
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ ...QUOTE_ROW }] }) // findQuote
        .mockResolvedValueOnce({ rows: [] }); // UPDATE → race condition
      (ExternalCoreService.prototype.agentExists as jest.Mock).mockResolvedValue(true);

      const req = buildReq({ body: { agenteId: 'AGT-001', version: 1 } });
      const res = buildRes();

      await patchGeneralData(req as unknown as Request<{ folio: string }>, res as unknown as Response, next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(VersionConflictError);
    });
  });

  // ── getCoverageOptions ────────────────────────────────────────────────────────
  describe('getCoverageOptions', () => {
    it('returns 200 with DEFAULT_COVERAGE_OPTIONS when opciones_cobertura is null', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [{ ...QUOTE_ROW, opciones_cobertura: null }] });

      const req = buildReq();
      const res = buildRes();

      await getCoverageOptions(req as unknown as Request<{ folio: string }>, res as unknown as Response, next);

      expect(res.status).toHaveBeenCalledWith(200);
      const body = res.json.mock.calls[0][0];
      expect(body.data.opcionesCobertura).toBeDefined();
      expect(Array.isArray(body.data.opcionesCobertura)).toBe(true);
      // Default includes COB-001
      const incendio = body.data.opcionesCobertura.find((c: { codigoCobertura: string }) => c.codigoCobertura === 'COB-001');
      expect(incendio).toBeDefined();
    });

    it('returns 200 with stored opcionesCobertura when present', async () => {
      const storedOptions = [
        { codigoCobertura: 'COB-001', descripcion: 'Incendio', seleccionada: true, obligatoria: true },
      ];
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [{ ...QUOTE_ROW, opciones_cobertura: storedOptions }],
      });

      const req = buildReq();
      const res = buildRes();

      await getCoverageOptions(req as unknown as Request<{ folio: string }>, res as unknown as Response, next);

      expect(res.status).toHaveBeenCalledWith(200);
      const body = res.json.mock.calls[0][0];
      expect(body.data.opcionesCobertura).toEqual(storedOptions);
    });

    it('calls next with QuoteNotFoundError when folio does not exist', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      const req = buildReq();
      const res = buildRes();

      await getCoverageOptions(req as unknown as Request<{ folio: string }>, res as unknown as Response, next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(QuoteNotFoundError);
    });
  });

  // ── putCoverageOptions ────────────────────────────────────────────────────────
  describe('putCoverageOptions', () => {
    const validCoverageInput = [
      { codigoCobertura: 'COB-001', seleccionada: true },
      { codigoCobertura: 'COB-002', seleccionada: false },
    ];

    it('returns 200 when version matches and coverage is valid', async () => {
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ ...QUOTE_ROW }] }) // findQuote
        .mockResolvedValueOnce({ rows: [{ ...QUOTE_ROW, opciones_cobertura: validCoverageInput, version: 2 }] }); // update

      const req = buildReq({ body: { opcionesCobertura: validCoverageInput, version: 1 } });
      const res = buildRes();

      await putCoverageOptions(req as unknown as Request<{ folio: string }>, res as unknown as Response, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('calls next with VersionConflictError when version does not match', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [{ ...QUOTE_ROW }] }); // version=1

      const req = buildReq({ body: { opcionesCobertura: validCoverageInput, version: 99 } });
      const res = buildRes();

      await putCoverageOptions(req as unknown as Request<{ folio: string }>, res as unknown as Response, next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(VersionConflictError);
    });

    it('calls next with ObligatoryCoberturaCantBeDeselectedError when COB-001 is deselected', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [{ ...QUOTE_ROW }] });

      const req = buildReq({
        body: {
          opcionesCobertura: [{ codigoCobertura: 'COB-001', seleccionada: false }],
          version: 1,
        },
      });
      const res = buildRes();

      await putCoverageOptions(req as unknown as Request<{ folio: string }>, res as unknown as Response, next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(ObligatoryCoberturaCantBeDeselectedError);
    });

    it('calls next with VersionConflictError when UPDATE returns no rows (concurrent modification)', async () => {
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ ...QUOTE_ROW }] }) // findQuote
        .mockResolvedValueOnce({ rows: [] }); // UPDATE → race condition

      const req = buildReq({
        body: { opcionesCobertura: [{ codigoCobertura: 'COB-001', seleccionada: true }], version: 1 },
      });
      const res = buildRes();

      await putCoverageOptions(req as unknown as Request<{ folio: string }>, res as unknown as Response, next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(VersionConflictError);
    });
  });

  // ── calculatePremium ──────────────────────────────────────────────────────────
  describe('calculatePremium', () => {
    const LOCATIONS_ROWS = [
      {
        indice_ubicacion: 1,
        descripcion: 'Bodega',
        codigo_postal: '06600',
        giro_id: 'GIR-015',
        estado_validacion: 'COMPLETA',
        alertas_bloqueantes: [],
        garantias: [{ tipoGarantia: 'INCENDIO', sumaAsegurada: 500000 }],
        version: 1,
      },
    ];

    const CALCULATION_RESULT = {
      primaNetaTotal: 2500,
      primaComercialTotal: 3000,
      primasPorUbicacion: [{ indiceUbicacion: 1, primaNeta: 2500, primaComercial: 3000, desglose: { incendio: 2500 } }],
      ubicacionesExcluidas: [],
    };

    it('returns 200 with calculation result when all conditions are met', async () => {
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ ...QUOTE_ROW, opciones_cobertura: [{ codigoCobertura: 'COB-001', seleccionada: true, obligatoria: true }] }] }) // findQuote
        .mockResolvedValueOnce({ rows: LOCATIONS_ROWS }) // getLocationsSummary
        .mockResolvedValueOnce({ rows: [{ version: 2, fecha_ultima_actualizacion: NOW }] }); // update

      (PremiumService.prototype.calculate as jest.Mock).mockResolvedValue(CALCULATION_RESULT);

      const req = buildReq({ body: { version: 1 } });
      const res = buildRes();

      await calculatePremium(req as unknown as Request<{ folio: string }>, res as unknown as Response, next);

      expect(res.status).toHaveBeenCalledWith(200);
      const body = res.json.mock.calls[0][0];
      expect(body.data.estadoCotizacion).toBe('CALCULADA');
      expect(body.data.primaNetaTotal).toBe(2500);
    });

    it('calls next with VersionConflictError when version does not match', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [{ ...QUOTE_ROW }] }); // version=1

      const req = buildReq({ body: { version: 99 } });
      const res = buildRes();

      await calculatePremium(req as unknown as Request<{ folio: string }>, res as unknown as Response, next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(VersionConflictError);
    });

    it('calls next with NoValidLocationsError when all locations are INCOMPLETA', async () => {
      const incompleteRow = { ...LOCATIONS_ROWS[0], estado_validacion: 'INCOMPLETA' };
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ ...QUOTE_ROW }] }) // findQuote
        .mockResolvedValueOnce({ rows: [incompleteRow] }); // getLocationsSummary

      const req = buildReq({ body: { version: 1 } });
      const res = buildRes();

      await calculatePremium(req as unknown as Request<{ folio: string }>, res as unknown as Response, next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(NoValidLocationsError);
    });

    it('calls next with NoCoverageSelectedError when all coverages are deselected', async () => {
      const quoteWithNoCoverage = {
        ...QUOTE_ROW,
        opciones_cobertura: [{ codigoCobertura: 'COB-002', seleccionada: false, obligatoria: false }],
      };
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [quoteWithNoCoverage] }) // findQuote
        .mockResolvedValueOnce({ rows: LOCATIONS_ROWS }); // getLocationsSummary

      const req = buildReq({ body: { version: 1 } });
      const res = buildRes();

      await calculatePremium(req as unknown as Request<{ folio: string }>, res as unknown as Response, next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(NoCoverageSelectedError);
    });

    it('calls next with QuoteNotFoundError when folio does not exist', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      const req = buildReq({ body: { version: 1 } });
      const res = buildRes();

      await calculatePremium(req as unknown as Request<{ folio: string }>, res as unknown as Response, next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(QuoteNotFoundError);
    });

    it('calls next with VersionConflictError when UPDATE returns no rows (concurrent modification)', async () => {
      const quoteWithCoverage = {
        ...QUOTE_ROW,
        opciones_cobertura: [{ codigoCobertura: 'COB-001', seleccionada: true, obligatoria: true }],
      };
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [quoteWithCoverage] }) // findQuote
        .mockResolvedValueOnce({ rows: LOCATIONS_ROWS }) // getLocationsSummary
        .mockResolvedValueOnce({ rows: [] }); // UPDATE → race condition
      (PremiumService.prototype.calculate as jest.Mock).mockResolvedValue(CALCULATION_RESULT);

      const req = buildReq({ body: { version: 1 } });
      const res = buildRes();

      await calculatePremium(req as unknown as Request<{ folio: string }>, res as unknown as Response, next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(VersionConflictError);
    });
  });
});
