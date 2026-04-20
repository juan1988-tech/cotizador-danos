jest.mock('../../src/config/database', () => ({
  pool: { query: jest.fn(), connect: jest.fn() },
}));

jest.mock('../../src/services/ExternalCoreService');

import { Request, Response, NextFunction } from 'express';
import { pool } from '../../src/config/database';
import { ExternalCoreService } from '../../src/services/ExternalCoreService';
import {
  postLayout,
  getLocations,
  putLocations,
  patchLocation,
} from '../../src/controllers/LocationController';
import {
  QuoteNotFoundError,
  LocationNotFoundError,
  VersionConflictError,
  ValidationError,
} from '../../src/utils/errors';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const FOLIO = 'COT-2026-001000';
const NOW = new Date();

const QUOTE_ROW = {
  numero_folio: FOLIO,
  estado_cotizacion: 'EN_EDICION',
  configuracion_layout: null,
  version: 1,
  fecha_ultima_actualizacion: NOW,
};

const LOCATION_ROW = {
  indice_ubicacion: 1,
  descripcion: null,
  codigo_postal: null,
  giro_id: null,
  estado_validacion: 'INCOMPLETA',
  alertas_bloqueantes: ['Código postal no válido o no encontrado', 'El giro seleccionado no tiene tarifa de incendio asociada', 'La ubicación no tiene garantías tarifables para calcular'],
  garantias: [],
  version: 1,
};

const COMPLETE_LOCATION_ROW = {
  ...LOCATION_ROW,
  codigo_postal: '06600',
  giro_id: 'GIR-015',
  garantias: [{ tipoGarantia: 'INCENDIO', sumaAsegurada: 500000 }],
  estado_validacion: 'COMPLETA',
  alertas_bloqueantes: [],
};

// Mock transaction client
function buildMockClient(queryResponses: Array<{ rows: unknown[] }>) {
  const queryMock = jest.fn();
  queryResponses.forEach(response => {
    queryMock.mockResolvedValueOnce(response);
  });
  return {
    query: queryMock,
    release: jest.fn(),
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildReq(overrides: Partial<{ params: Record<string, string>; body: unknown }> = {}): Request {
  return {
    params: { folio: FOLIO },
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

describe('LocationController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (next as jest.Mock).mockClear();
  });

  // ── postLayout ──────────────────────────────────────────────────────────────
  describe('postLayout', () => {
    it('returns 200 with ubicacionesInicializadas=2 when going from 0 to 2 locations', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [{ ...QUOTE_ROW }] });

      const mockClient = buildMockClient([
        { rows: [] }, // BEGIN
        { rows: [] }, // INSERT location 1
        { rows: [] }, // INSERT location 2
        { rows: [{ version: 2, fecha_ultima_actualizacion: NOW }] }, // UPDATE quotes
        { rows: [] }, // COMMIT
      ]);
      (pool.connect as jest.Mock).mockResolvedValue(mockClient);

      const req = buildReq({ body: { numeroUbicaciones: 2, tipoLayout: 'UNIFORME', version: 1 } });
      const res = buildRes();

      await postLayout(req as unknown as Request<{ folio: string }>, res as unknown as Response, next);

      expect(res.status).toHaveBeenCalledWith(200);
      const body = res.json.mock.calls[0][0];
      expect(body.data.ubicacionesInicializadas).toBe(2);
      expect(body.data.configuracionLayout.numeroUbicaciones).toBe(2);
    });

    it('returns 200 with ubicacionesInicializadas=0 when reducing layout (locations removed)', async () => {
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [{
          ...QUOTE_ROW,
          configuracion_layout: { numeroUbicaciones: 3, tipoLayout: 'UNIFORME' },
        }],
      });

      const mockClient = buildMockClient([
        { rows: [] }, // BEGIN
        { rows: [] }, // DELETE (reduce from 3 to 2)
        { rows: [{ version: 2, fecha_ultima_actualizacion: NOW }] }, // UPDATE quotes
        { rows: [] }, // COMMIT
      ]);
      (pool.connect as jest.Mock).mockResolvedValue(mockClient);

      const req = buildReq({ body: { numeroUbicaciones: 2, tipoLayout: 'UNIFORME', version: 1 } });
      const res = buildRes();

      await postLayout(req as unknown as Request<{ folio: string }>, res as unknown as Response, next);

      expect(res.status).toHaveBeenCalledWith(200);
      const body = res.json.mock.calls[0][0];
      expect(body.data.ubicacionesInicializadas).toBe(0);
    });

    it('calls next with VersionConflictError when quote version does not match', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [{ ...QUOTE_ROW }] }); // version=1

      const req = buildReq({ body: { numeroUbicaciones: 2, tipoLayout: 'UNIFORME', version: 99 } });
      const res = buildRes();

      await postLayout(req as unknown as Request<{ folio: string }>, res as unknown as Response, next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(VersionConflictError);
    });

    it('calls next with QuoteNotFoundError when folio does not exist', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      const req = buildReq({ body: { numeroUbicaciones: 2, tipoLayout: 'UNIFORME', version: 1 } });
      const res = buildRes();

      await postLayout(req as unknown as Request<{ folio: string }>, res as unknown as Response, next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(QuoteNotFoundError);
    });

    it('calls next with VersionConflictError when UPDATE inside transaction returns no rows (race condition)', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [{ ...QUOTE_ROW }] });

      const mockClient = buildMockClient([
        { rows: [] }, // BEGIN
        { rows: [] }, // INSERT location 1
        { rows: [] }, // INSERT location 2
        { rows: [] }, // UPDATE quotes → returns empty → race condition
        { rows: [] }, // ROLLBACK (explicit from if block)
        { rows: [] }, // ROLLBACK (catch block)
      ]);
      (pool.connect as jest.Mock).mockResolvedValue(mockClient);

      const req = buildReq({ body: { numeroUbicaciones: 2, tipoLayout: 'UNIFORME', version: 1 } });
      const res = buildRes();

      await postLayout(req as unknown as Request<{ folio: string }>, res as unknown as Response, next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(VersionConflictError);
    });
  });

  // ── getLocations ────────────────────────────────────────────────────────────
  describe('getLocations', () => {
    it('returns 200 with locations and resumen', async () => {
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ ...QUOTE_ROW }] }) // findQuoteRow
        .mockResolvedValueOnce({ rows: [COMPLETE_LOCATION_ROW, LOCATION_ROW] }); // SELECT locations

      const req = buildReq();
      const res = buildRes();

      await getLocations(req as unknown as Request<{ folio: string }>, res as unknown as Response, next);

      expect(res.status).toHaveBeenCalledWith(200);
      const body = res.json.mock.calls[0][0];
      expect(body.data.ubicaciones).toHaveLength(2);
      expect(body.data.resumen.total).toBe(2);
      expect(body.data.resumen.completas).toBe(1);
      expect(body.data.resumen.incompletas).toBe(1);
    });

    it('returns 200 with empty ubicaciones when no locations exist', async () => {
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ ...QUOTE_ROW }] })
        .mockResolvedValueOnce({ rows: [] });

      const req = buildReq();
      const res = buildRes();

      await getLocations(req as unknown as Request<{ folio: string }>, res as unknown as Response, next);

      expect(res.status).toHaveBeenCalledWith(200);
      const body = res.json.mock.calls[0][0];
      expect(body.data.ubicaciones).toHaveLength(0);
      expect(body.data.resumen.total).toBe(0);
    });

    it('calls next with QuoteNotFoundError when folio does not exist', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      const req = buildReq();
      const res = buildRes();

      await getLocations(req as unknown as Request<{ folio: string }>, res as unknown as Response, next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(QuoteNotFoundError);
    });
  });

  // ── putLocations ────────────────────────────────────────────────────────────
  describe('putLocations', () => {
    const validInput = {
      indiceUbicacion: 1,
      codigoPostal: '06600',
      giroId: 'GIR-015',
      garantias: [{ tipoGarantia: 'INCENDIO', sumaAsegurada: 500000 }],
      version: 1,
    };

    it('returns 200 after successful bulk update', async () => {
      (ExternalCoreService.prototype.validatePostalCode as jest.Mock).mockResolvedValue({
        codigoPostal: '06600', municipio: 'Cuauhtémoc', estado: 'CDMX', pais: 'México',
      });
      (ExternalCoreService.prototype.getGiroInfo as jest.Mock).mockResolvedValue({
        id: 'GIR-015', nombre: 'Comercio', claveIncendio: 'INC-01',
      });

      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ ...QUOTE_ROW }] }) // findQuoteRow (outer)
        .mockResolvedValueOnce({ rows: [LOCATION_ROW] }) // findLocationRow (pre-validate)
        .mockResolvedValueOnce({ rows: [{ ...QUOTE_ROW, version: 2, fecha_ultima_actualizacion: NOW }] }); // findQuoteRow (final)

      const mockClient = buildMockClient([
        { rows: [] }, // BEGIN
        { rows: [LOCATION_ROW] }, // findLocationRow in loop (client.query is just pool.query alias here but we mock pool.query)
        { rows: [] }, // UPDATE location
        { rows: [{ estado_validacion: 'COMPLETA' }] }, // SELECT all states
        { rows: [] }, // UPDATE quotes
        { rows: [] }, // COMMIT
      ]);
      (pool.connect as jest.Mock).mockResolvedValue(mockClient);

      // After transaction: fetch updated locations + quote
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [COMPLETE_LOCATION_ROW] }) // SELECT after update
        .mockResolvedValueOnce({ rows: [{ ...QUOTE_ROW, version: 2, fecha_ultima_actualizacion: NOW }] }); // findQuoteRow after

      const req = buildReq({ body: { ubicaciones: [validInput], version: 1 } });
      const res = buildRes();

      await putLocations(req as unknown as Request<{ folio: string }>, res as unknown as Response, next);

      expect(res.status).toHaveBeenCalledWith(200);
      const body = res.json.mock.calls[0][0];
      expect(body.data.ubicaciones).toBeDefined();
    });

    it('calls next with VersionConflictError when quote version does not match', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [{ ...QUOTE_ROW }] }); // version=1

      const req = buildReq({ body: { ubicaciones: [{ ...validInput }], version: 99 } });
      const res = buildRes();

      await putLocations(req as unknown as Request<{ folio: string }>, res as unknown as Response, next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(VersionConflictError);
    });

    it('calls next with LocationNotFoundError when indiceUbicacion does not exist', async () => {
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ ...QUOTE_ROW }] }) // findQuoteRow
        .mockResolvedValueOnce({ rows: [] }); // findLocationRow → not found

      const req = buildReq({ body: { ubicaciones: [{ ...validInput, indiceUbicacion: 99 }], version: 1 } });
      const res = buildRes();

      await putLocations(req as unknown as Request<{ folio: string }>, res as unknown as Response, next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(LocationNotFoundError);
    });

    it('calls next with ValidationError when a garantia has sumaAsegurada = 0', async () => {
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ ...QUOTE_ROW }] }) // findQuoteRow
        .mockResolvedValueOnce({ rows: [LOCATION_ROW] }); // findLocationRow

      const req = buildReq({
        body: {
          ubicaciones: [{
            indiceUbicacion: 1,
            garantias: [{ tipoGarantia: 'INCENDIO', sumaAsegurada: 0 }],
            version: 1,
          }],
          version: 1,
        },
      });
      const res = buildRes();

      await putLocations(req as unknown as Request<{ folio: string }>, res as unknown as Response, next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(ValidationError);
    });

    it('calls next with ValidationError when giroId does not exist in catalog', async () => {
      (ExternalCoreService.prototype.validatePostalCode as jest.Mock).mockResolvedValue({
        codigoPostal: '06600', municipio: 'Cuauhtémoc', estado: 'CDMX', pais: 'México',
      });
      (ExternalCoreService.prototype.getGiroInfo as jest.Mock).mockResolvedValue(null);

      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ ...QUOTE_ROW }] }) // findQuoteRow
        .mockResolvedValueOnce({ rows: [LOCATION_ROW] }); // findLocationRow

      const req = buildReq({
        body: {
          ubicaciones: [{
            indiceUbicacion: 1,
            codigoPostal: '06600',
            giroId: 'GIR-999',
            garantias: [{ tipoGarantia: 'INCENDIO', sumaAsegurada: 500000 }],
            version: 1,
          }],
          version: 1,
        },
      });
      const res = buildRes();

      await putLocations(req as unknown as Request<{ folio: string }>, res as unknown as Response, next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(ValidationError);
      expect(err.message).toContain('GIR-999');
    });
  });

  // ── patchLocation ────────────────────────────────────────────────────────────
  describe('patchLocation', () => {
    it('returns 200 with updated UbicacionResumen', async () => {
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ ...QUOTE_ROW }] }) // findQuoteRow
        .mockResolvedValueOnce({ rows: [{ ...LOCATION_ROW }] }) // findLocationRow
        .mockResolvedValueOnce({ rows: [COMPLETE_LOCATION_ROW] }); // UPDATE RETURNING

      (ExternalCoreService.prototype.validatePostalCode as jest.Mock).mockResolvedValue({
        codigoPostal: '06600', municipio: 'Cuauhtémoc', estado: 'CDMX', pais: 'México',
      });
      (ExternalCoreService.prototype.getGiroInfo as jest.Mock).mockResolvedValue({
        id: 'GIR-015', nombre: 'Comercio', claveIncendio: 'INC-01',
      });

      const req = buildReq({
        params: { folio: FOLIO, index: '1' },
        body: {
          codigoPostal: '06600',
          giroId: 'GIR-015',
          garantias: [{ tipoGarantia: 'INCENDIO', sumaAsegurada: 500000 }],
          version: 1,
        },
      });
      const res = buildRes();

      await patchLocation(req as unknown as Request<{ folio: string; index: string }>, res as unknown as Response, next);

      expect(res.status).toHaveBeenCalledWith(200);
      const body = res.json.mock.calls[0][0];
      expect(body.data.estadoValidacion).toBe('COMPLETA');
    });

    it('calls next with VersionConflictError when location version does not match', async () => {
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ ...QUOTE_ROW }] }) // findQuoteRow
        .mockResolvedValueOnce({ rows: [{ ...LOCATION_ROW }] }); // findLocationRow → version=1

      const req = buildReq({
        params: { folio: FOLIO, index: '1' },
        body: { version: 99 },
      });
      const res = buildRes();

      await patchLocation(req as unknown as Request<{ folio: string; index: string }>, res as unknown as Response, next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(VersionConflictError);
    });

    it('calls next with ValidationError when garantia sumaAsegurada is 0', async () => {
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ ...QUOTE_ROW }] })
        .mockResolvedValueOnce({ rows: [{ ...LOCATION_ROW }] });

      const req = buildReq({
        params: { folio: FOLIO, index: '1' },
        body: {
          garantias: [{ tipoGarantia: 'INCENDIO', sumaAsegurada: 0 }],
          version: 1,
        },
      });
      const res = buildRes();

      await patchLocation(req as unknown as Request<{ folio: string; index: string }>, res as unknown as Response, next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(ValidationError);
    });

    it('calls next with LocationNotFoundError when index does not exist', async () => {
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ ...QUOTE_ROW }] })
        .mockResolvedValueOnce({ rows: [] }); // location not found

      const req = buildReq({
        params: { folio: FOLIO, index: '99' },
        body: { version: 1 },
      });
      const res = buildRes();

      await patchLocation(req as unknown as Request<{ folio: string; index: string }>, res as unknown as Response, next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(LocationNotFoundError);
    });

    it('calls next with QuoteNotFoundError when folio does not exist', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      const req = buildReq({
        params: { folio: FOLIO, index: '1' },
        body: { version: 1 },
      });
      const res = buildRes();

      await patchLocation(req as unknown as Request<{ folio: string; index: string }>, res as unknown as Response, next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(QuoteNotFoundError);
    });

    it('calls next with ValidationError when giroId does not exist in catalog', async () => {
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ ...QUOTE_ROW }] })
        .mockResolvedValueOnce({ rows: [{ ...LOCATION_ROW }] });

      (ExternalCoreService.prototype.getGiroInfo as jest.Mock).mockResolvedValue(null);

      const req = buildReq({
        params: { folio: FOLIO, index: '1' },
        body: { giroId: 'GIR-999', version: 1 },
      });
      const res = buildRes();

      await patchLocation(req as unknown as Request<{ folio: string; index: string }>, res as unknown as Response, next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(ValidationError);
      expect(err.message).toContain('GIR-999');
    });

    it('calls next with VersionConflictError when UPDATE returns no rows (race condition)', async () => {
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ ...QUOTE_ROW }] })   // findQuoteRow
        .mockResolvedValueOnce({ rows: [{ ...LOCATION_ROW }] }) // findLocationRow
        .mockResolvedValueOnce({ rows: [] });                   // UPDATE → race condition

      (ExternalCoreService.prototype.validatePostalCode as jest.Mock).mockResolvedValue({
        codigoPostal: '06600', municipio: 'Cuauhtémoc', estado: 'CDMX', pais: 'México',
      });
      (ExternalCoreService.prototype.getGiroInfo as jest.Mock).mockResolvedValue({
        id: 'GIR-015', nombre: 'Comercio', claveIncendio: 'INC-01',
      });

      const req = buildReq({
        params: { folio: FOLIO, index: '1' },
        body: {
          codigoPostal: '06600',
          giroId: 'GIR-015',
          garantias: [{ tipoGarantia: 'INCENDIO', sumaAsegurada: 500000 }],
          version: 1,
        },
      });
      const res = buildRes();

      await patchLocation(req as unknown as Request<{ folio: string; index: string }>, res as unknown as Response, next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(VersionConflictError);
    });
  });
});
