/// <reference types="jest" />

jest.mock('../../src/config/database', () => ({
  pool: { query: jest.fn(), connect: jest.fn() },
}));

import { Request, Response, NextFunction } from 'express';
import { pool } from '../../src/config/database';
import {
  listQuotes,
  postQuote,
  getQuote,
  patchGeneralData,
  getCoverageOptions,
  putCoverageOptions,
  postCalculate,
} from '../../src/controllers/QuoteController';
import { QuoteNotFoundError, VersionConflictError } from '../../src/utils/errors';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const FOLIO = 'COT-2026-001000';
const NOW = new Date('2026-04-20T10:00:00.000Z');

const QUOTE_DB_ROW = {
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildRes(): { status: jest.Mock; json: jest.Mock } & Response {
  const res = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  return res as unknown as { status: jest.Mock; json: jest.Mock } & Response;
}

function buildReq(
  params: Record<string, string> = {},
  body: Record<string, unknown> = {},
): Request {
  return { params, body, query: {} } as unknown as Request;
}

describe('QuoteController', () => {
  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    next = jest.fn();
    jest.clearAllMocks();
  });

  // ── listQuotes ────────────────────────────────────────────────────────────

  describe('listQuotes', () => {
    const SUMMARY_ROW = {
      numero_folio: FOLIO,
      estado_cotizacion: 'EN_EDICION',
      nombre_asegurado: 'Juan Pérez',
      prima_neta_total: '1500.00',
      fecha_creacion: NOW,
      fecha_ultima_actualizacion: NOW,
    };

    it('given_listQuotes_when_db_returns_rows_then_responds_200_with_summary_array', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [SUMMARY_ROW] });

      const req = buildReq();
      const res = buildRes();

      await listQuotes(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      const body = (res.json as jest.Mock).mock.calls[0][0] as { data: unknown[] };
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data).toHaveLength(1);
      const item = body.data[0] as Record<string, unknown>;
      expect(item['numeroFolio']).toBe(FOLIO);
      expect(item['estadoCotizacion']).toBe('EN_EDICION');
      expect(item['nombreAsegurado']).toBe('Juan Pérez');
      expect(item['primaNetaTotal']).toBe(1500);
      expect(next).not.toHaveBeenCalled();
    });

    it('given_listQuotes_when_db_returns_empty_then_responds_200_with_empty_array', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const req = buildReq();
      const res = buildRes();

      await listQuotes(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      const body = (res.json as jest.Mock).mock.calls[0][0] as { data: unknown[] };
      expect(body.data).toHaveLength(0);
      expect(next).not.toHaveBeenCalled();
    });

    it('given_listQuotes_when_nombre_asegurado_is_null_then_field_is_null', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ ...SUMMARY_ROW, nombre_asegurado: null, prima_neta_total: null }],
      });

      const req = buildReq();
      const res = buildRes();

      await listQuotes(req, res, next);

      const body = (res.json as jest.Mock).mock.calls[0][0] as { data: Record<string, unknown>[] };
      expect(body.data[0]?.['nombreAsegurado']).toBeNull();
      expect(body.data[0]?.['primaNetaTotal']).toBeNull();
    });

    it('given_listQuotes_when_db_throws_then_calls_next_with_error', async () => {
      (pool.query as jest.Mock).mockRejectedValueOnce(new Error('DB down'));

      const req = buildReq();
      const res = buildRes();

      await listQuotes(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect((next.mock.calls[0][0] as unknown as Error).message).toBe('DB down');
    });
  });

  // ── postQuote ──────────────────────────────────────────────────────────────

  describe('postQuote', () => {
    it('given_postQuote_when_sequence_and_insert_succeed_then_returns_201_with_folio', async () => {
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ seq: 1000 }] })   // nextval
        .mockResolvedValueOnce({ rows: [{ ...QUOTE_DB_ROW }] }); // INSERT

      const req = buildReq();
      const res = buildRes();

      await postQuote(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      const body = (res.json as jest.Mock).mock.calls[0][0] as { data: Record<string, unknown> };
      expect(body.data.numeroFolio).toBe(FOLIO);
      expect(body.data.estadoCotizacion).toBe('EN_EDICION');
      expect(body.data.version).toBe(1);
      expect(next).not.toHaveBeenCalled();
    });

    it('given_postQuote_when_db_throws_then_calls_next_with_error', async () => {
      (pool.query as jest.Mock).mockRejectedValueOnce(new Error('DB down'));

      const req = buildReq();
      const res = buildRes();

      await postQuote(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect((next.mock.calls[0][0] as unknown as Error).message).toBe('DB down');
    });
  });

  // ── getQuote ──────────────────────────────────────────────────────────────

  describe('getQuote', () => {
    it('given_getQuote_when_folio_exists_then_returns_200_with_quote', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ ...QUOTE_DB_ROW }] });

      const req = buildReq({ folio: FOLIO }) as Request<{ folio: string }>;
      const res = buildRes();

      await getQuote(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      const body = (res.json as jest.Mock).mock.calls[0][0] as { data: Record<string, unknown> };
      expect(body.data.numeroFolio).toBe(FOLIO);
      expect(next).not.toHaveBeenCalled();
    });

    it('given_getQuote_when_folio_not_found_then_calls_next_with_QuoteNotFoundError', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const req = buildReq({ folio: 'COT-2026-XXXXX' }) as Request<{ folio: string }>;
      const res = buildRes();

      await getQuote(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(QuoteNotFoundError);
    });
  });

  // ── patchGeneralData ──────────────────────────────────────────────────────

  describe('patchGeneralData', () => {
    it('given_patchGeneralData_when_valid_partial_update_then_returns_200', async () => {
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ ...QUOTE_DB_ROW }] })  // findByFolio
        .mockResolvedValueOnce({ rows: [{ ...QUOTE_DB_ROW, datos_asegurado: { nombreAsegurado: 'Test' }, version: 2 }] }); // update

      const req = buildReq({ folio: FOLIO }, { version: 1, nombreAsegurado: 'Test' }) as Request<{ folio: string }>;
      const res = buildRes();

      await patchGeneralData(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(next).not.toHaveBeenCalled();
    });

    it('given_patchGeneralData_when_folio_not_found_then_calls_next_with_QuoteNotFoundError', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const req = buildReq({ folio: 'COT-XXXX' }, { version: 1 }) as Request<{ folio: string }>;
      const res = buildRes();

      await patchGeneralData(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(QuoteNotFoundError);
    });

    it('given_patchGeneralData_when_version_conflict_then_calls_next_with_VersionConflictError', async () => {
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ ...QUOTE_DB_ROW }] })  // findByFolio
        .mockResolvedValueOnce({ rows: [] })                      // update returns empty (conflict)
        .mockResolvedValueOnce({ rows: [{ ...QUOTE_DB_ROW }] }); // re-fetch for error details

      const req = buildReq({ folio: FOLIO }, { version: 99, nombreAsegurado: 'Test' }) as Request<{ folio: string }>;
      const res = buildRes();

      await patchGeneralData(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(VersionConflictError);
    });
  });

  // ── stubs still pending ───────────────────────────────────────────────────

  it('given_getCoverageOptions_when_folio_not_found_then_calls_next_with_QuoteNotFoundError', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

    const req = buildReq({ folio: FOLIO }) as Request<{ folio: string }>;
    const res = buildRes();

    await getCoverageOptions(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(QuoteNotFoundError);
  });

  it('given_putCoverageOptions_when_folio_not_found_then_calls_next_with_QuoteNotFoundError', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

    const req = buildReq({ folio: FOLIO }, { selecciones: [] }) as Request<{ folio: string }>;
    const res = buildRes();

    await putCoverageOptions(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(QuoteNotFoundError);
  });

  it('given_postCalculate_when_folio_not_found_then_calls_next_with_QuoteNotFoundError', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

    const req = buildReq({ folio: FOLIO }) as Request<{ folio: string }>;
    const res = buildRes();

    await postCalculate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(QuoteNotFoundError);
  });
});
