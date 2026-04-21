/**
 * Integration tests — Add / Update Location flow
 *
 * These tests exercise the full HTTP stack (routing → middleware → controller)
 * using Supertest. The PostgreSQL pool and ExternalCoreService are mocked so
 * the suite runs without a real database.
 *
 * To run against an actual test database, set DB_HOST / DB_NAME / etc. in the
 * environment and remove the jest.mock() calls below. The SQL statements are
 * 100 % parameterized, so swapping the mock for a real Pool is transparent.
 *
 * LIN-DEV-005: Each test cleans its own state; no cross-test dependencies.
 */

jest.mock('../../src/config/database', () => ({
  pool: {
    query:   jest.fn(),
    connect: jest.fn(),
  },
}));

jest.mock('../../src/services/ExternalCoreService');

import request from 'supertest';
import { pool } from '../../src/config/database';
import { ExternalCoreService } from '../../src/services/ExternalCoreService';
import app from '../../src/app';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const FOLIO = 'COT-2026-INT001';
const NOW   = new Date('2026-04-20T10:00:00.000Z');

const QUOTE_ROW = {
  numero_folio:              FOLIO,
  estado_cotizacion:         'DATOS_GENERALES_COMPLETOS',
  configuracion_layout:      null,
  version:                   2,
  fecha_ultima_actualizacion: NOW,
};

const LOCATION_ROW = {
  indice_ubicacion:    1,
  descripcion:         null,
  codigo_postal:       null,
  giro_id:             null,
  estado_validacion:   'INCOMPLETA',
  alertas_bloqueantes: [
    'Código postal no válido o no encontrado',
    'El giro seleccionado no tiene tarifa de incendio asociada',
    'La ubicación no tiene garantías tarifables para calcular',
  ],
  garantias: [],
  version:   1,
};

const COMPLETE_LOCATION_ROW = {
  ...LOCATION_ROW,
  codigo_postal:       '06600',
  giro_id:             'GIR-015',
  garantias:           [{ tipoGarantia: 'INCENDIO', sumaAsegurada: 500_000 }],
  estado_validacion:   'COMPLETA',
  alertas_bloqueantes: [],
  version:             2,
};

function buildMockClient(responses: Array<{ rows: unknown[] }>) {
  const queryMock = jest.fn();
  responses.forEach((r) => queryMock.mockResolvedValueOnce(r));
  return { query: queryMock, release: jest.fn() };
}

// ── POST /api/v1/quotes/:folio/layout ─────────────────────────────────────────

describe('POST /api/v1/quotes/:folio/layout — AddLocationUseCase (layout setup)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('given_valid_layout_when_POST_layout_then_returns_200_with_initialized_slots', async () => {
    // GIVEN — quote exists with no layout yet
    (pool.query as jest.Mock).mockResolvedValue({ rows: [{ ...QUOTE_ROW }] });

    const mockClient = buildMockClient([
      { rows: [] }, // BEGIN
      { rows: [] }, // INSERT slot 1
      { rows: [] }, // INSERT slot 2
      { rows: [{ version: 3, fecha_ultima_actualizacion: NOW }] }, // UPDATE quotes RETURNING
      { rows: [] }, // COMMIT
    ]);
    (pool.connect as jest.Mock).mockResolvedValue(mockClient);

    // WHEN
    const res = await request(app)
      .post(`/api/v1/quotes/${FOLIO}/layout`)
      .set('Content-Type', 'application/json')
      .send({ tipoLayout: 'UNIFORME', numeroUbicaciones: 2, version: 2 });

    // THEN
    expect(res.status).toBe(200);
    expect(res.body.data.configuracionLayout).toEqual({ tipoLayout: 'UNIFORME', numeroUbicaciones: 2 });
    expect(res.body.data.ubicacionesInicializadas).toBe(2);
    expect(res.body.data.version).toBe(3);
  });

  it('given_existing_layout_when_POST_layout_reducing_count_then_returns_200_ubicaciones_initialized_0', async () => {
    // GIVEN — quote already has 3 locations configured
    (pool.query as jest.Mock).mockResolvedValue({
      rows: [{
        ...QUOTE_ROW,
        configuracion_layout: { tipoLayout: 'UNIFORME', numeroUbicaciones: 3 },
      }],
    });

    const mockClient = buildMockClient([
      { rows: [] }, // BEGIN
      { rows: [] }, // DELETE excess slots
      { rows: [{ version: 3, fecha_ultima_actualizacion: NOW }] }, // UPDATE quotes RETURNING
      { rows: [] }, // COMMIT
    ]);
    (pool.connect as jest.Mock).mockResolvedValue(mockClient);

    // WHEN — reduce to 2
    const res = await request(app)
      .post(`/api/v1/quotes/${FOLIO}/layout`)
      .send({ tipoLayout: 'UNIFORME', numeroUbicaciones: 2, version: 2 });

    // THEN
    expect(res.status).toBe(200);
    expect(res.body.data.ubicacionesInicializadas).toBe(0);
    expect(res.body.data.configuracionLayout.numeroUbicaciones).toBe(2);
  });

  it('given_nonexistent_folio_when_POST_layout_then_returns_404_QuoteNotFound', async () => {
    // GIVEN
    (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

    // WHEN
    const res = await request(app)
      .post(`/api/v1/quotes/UNKNOWN-FOLIO/layout`)
      .send({ tipoLayout: 'UNIFORME', numeroUbicaciones: 2, version: 1 });

    // THEN
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('QuoteNotFound');
  });

  it('given_stale_version_when_POST_layout_then_returns_409_VersionConflict', async () => {
    // GIVEN — quote version is 2 but client sends 1
    (pool.query as jest.Mock).mockResolvedValue({ rows: [{ ...QUOTE_ROW, version: 2 }] });

    // WHEN
    const res = await request(app)
      .post(`/api/v1/quotes/${FOLIO}/layout`)
      .send({ tipoLayout: 'UNIFORME', numeroUbicaciones: 2, version: 1 });

    // THEN
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('VersionConflict');
  });

  it('given_invalid_tipoLayout_when_POST_layout_then_returns_400_ValidationError', async () => {
    // WHEN — validateLayout middleware rejects
    const res = await request(app)
      .post(`/api/v1/quotes/${FOLIO}/layout`)
      .send({ tipoLayout: 'INVALIDO', numeroUbicaciones: 2, version: 1 });

    // THEN
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('ValidationError');
  });

  it('given_missing_version_when_POST_layout_then_returns_400_MissingRequiredField', async () => {
    // WHEN — requireFields middleware rejects
    const res = await request(app)
      .post(`/api/v1/quotes/${FOLIO}/layout`)
      .send({ tipoLayout: 'UNIFORME', numeroUbicaciones: 2 });

    // THEN
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('MissingRequiredField');
  });

  it('given_race_condition_when_UPDATE_returns_no_rows_then_returns_409_VersionConflict', async () => {
    // GIVEN — UPDATE inside TX returns empty (concurrent writer)
    (pool.query as jest.Mock).mockResolvedValue({ rows: [{ ...QUOTE_ROW }] });

    const mockClient = buildMockClient([
      { rows: [] }, // BEGIN
      { rows: [] }, // INSERT slot 1
      { rows: [] }, // INSERT slot 2
      { rows: [] }, // UPDATE quotes → race condition
      { rows: [] }, // ROLLBACK (explicit)
      { rows: [] }, // ROLLBACK (catch block)
    ]);
    (pool.connect as jest.Mock).mockResolvedValue(mockClient);

    // WHEN
    const res = await request(app)
      .post(`/api/v1/quotes/${FOLIO}/layout`)
      .send({ tipoLayout: 'UNIFORME', numeroUbicaciones: 2, version: 2 });

    // THEN
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('VersionConflict');
  });
});

// ── PATCH /api/v1/quotes/:folio/locations/:index ──────────────────────────────

describe('PATCH /api/v1/quotes/:folio/locations/:index — AddLocationUseCase (location detail)', () => {
  beforeEach(() => jest.resetAllMocks());

  it('given_valid_patch_when_PATCH_location_then_returns_200_with_COMPLETA_state', async () => {
    // GIVEN
    (ExternalCoreService.prototype.validatePostalCode as jest.Mock).mockResolvedValue({
      codigoPostal: '06600', municipio: 'Cuauhtémoc', estado: 'Ciudad de México', pais: 'México',
    });
    (ExternalCoreService.prototype.getGiroInfo as jest.Mock).mockResolvedValue({
      id: 'GIR-015', nombre: 'Comercio al por menor de abarrotes', claveIncendio: 'INC-01',
    });

    (pool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ ...QUOTE_ROW }] })             // findQuoteRow
      .mockResolvedValueOnce({ rows: [{ ...LOCATION_ROW }] })          // findLocationRow
      .mockResolvedValueOnce({ rows: [{ ...COMPLETE_LOCATION_ROW }] }); // UPDATE RETURNING

    // WHEN
    const res = await request(app)
      .patch(`/api/v1/quotes/${FOLIO}/locations/1`)
      .send({
        codigoPostal: '06600',
        giroId: 'GIR-015',
        garantias: [{ tipoGarantia: 'INCENDIO', sumaAsegurada: 500_000 }],
        version: 1,
      });

    // THEN
    expect(res.status).toBe(200);
    expect(res.body.data.estadoValidacion).toBe('COMPLETA');
    expect(res.body.data.indiceUbicacion).toBe(1);
    expect(res.body.data.version).toBe(2);
  });

  it('given_partial_patch_only_descripcion_when_PATCH_location_then_returns_200', async () => {
    // GIVEN — only updating descripcion, no catalog lookups needed
    (pool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ ...QUOTE_ROW }] })
      .mockResolvedValueOnce({ rows: [{ ...LOCATION_ROW }] })
      .mockResolvedValueOnce({ rows: [{ ...LOCATION_ROW, descripcion: 'Bodega Norte', version: 2 }] });

    // WHEN
    const res = await request(app)
      .patch(`/api/v1/quotes/${FOLIO}/locations/1`)
      .send({ descripcion: 'Bodega Norte', version: 1 });

    // THEN
    expect(res.status).toBe(200);
    expect(res.body.data.descripcion).toBe('Bodega Norte');
  });

  it('given_nonexistent_folio_when_PATCH_location_then_returns_404_QuoteNotFound', async () => {
    // GIVEN
    (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

    // WHEN
    const res = await request(app)
      .patch(`/api/v1/quotes/UNKNOWN/locations/1`)
      .send({ version: 1 });

    // THEN
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('QuoteNotFound');
  });

  it('given_nonexistent_index_when_PATCH_location_then_returns_404_LocationNotFound', async () => {
    // GIVEN
    (pool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ ...QUOTE_ROW }] })
      .mockResolvedValueOnce({ rows: [] }); // location not found

    // WHEN
    const res = await request(app)
      .patch(`/api/v1/quotes/${FOLIO}/locations/99`)
      .send({ version: 1 });

    // THEN
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('LocationNotFound');
  });

  it('given_stale_version_when_PATCH_location_then_returns_409_VersionConflict', async () => {
    // GIVEN — location version=1, client sends version=5
    (pool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ ...QUOTE_ROW }] })
      .mockResolvedValueOnce({ rows: [{ ...LOCATION_ROW, version: 1 }] });

    // WHEN
    const res = await request(app)
      .patch(`/api/v1/quotes/${FOLIO}/locations/1`)
      .send({ version: 5 });

    // THEN
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('VersionConflict');
  });

  it('given_missing_version_when_PATCH_location_then_returns_400_MissingRequiredField', async () => {
    // WHEN — requireFields middleware rejects before any DB query
    const res = await request(app)
      .patch(`/api/v1/quotes/${FOLIO}/locations/1`)
      .send({ codigoPostal: '06600' }); // no version

    // THEN
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('MissingRequiredField');
  });

  it('given_sumaAsegurada_zero_when_PATCH_location_then_returns_400_ValidationError', async () => {
    // GIVEN
    (pool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ ...QUOTE_ROW }] })
      .mockResolvedValueOnce({ rows: [{ ...LOCATION_ROW }] });

    // WHEN
    const res = await request(app)
      .patch(`/api/v1/quotes/${FOLIO}/locations/1`)
      .send({ garantias: [{ tipoGarantia: 'INCENDIO', sumaAsegurada: 0 }], version: 1 });

    // THEN
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('ValidationError');
  });

  it('given_unknown_giroId_when_PATCH_location_then_returns_400_ValidationError', async () => {
    // GIVEN
    (ExternalCoreService.prototype.getGiroInfo as jest.Mock).mockResolvedValue(null);
    (pool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ ...QUOTE_ROW }] })
      .mockResolvedValueOnce({ rows: [{ ...LOCATION_ROW }] });

    // WHEN
    const res = await request(app)
      .patch(`/api/v1/quotes/${FOLIO}/locations/1`)
      .send({ giroId: 'GIR-UNKNOWN', version: 1 });

    // THEN
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('ValidationError');
    expect(res.body.message).toContain('GIR-UNKNOWN');
  });

  it('given_race_condition_when_UPDATE_returns_no_rows_then_returns_409_VersionConflict', async () => {
    // GIVEN — concurrent writer changed the row between read and write
    (ExternalCoreService.prototype.validatePostalCode as jest.Mock).mockResolvedValue({
      codigoPostal: '06600', municipio: 'Cuauhtémoc', estado: 'Ciudad de México', pais: 'México',
    });
    (ExternalCoreService.prototype.getGiroInfo as jest.Mock).mockResolvedValue({
      id: 'GIR-015', nombre: 'Comercio', claveIncendio: 'INC-01',
    });

    (pool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ ...QUOTE_ROW }] })
      .mockResolvedValueOnce({ rows: [{ ...LOCATION_ROW }] })
      .mockResolvedValueOnce({ rows: [] }); // UPDATE → race condition

    // WHEN
    const res = await request(app)
      .patch(`/api/v1/quotes/${FOLIO}/locations/1`)
      .send({
        codigoPostal: '06600',
        giroId: 'GIR-015',
        garantias: [{ tipoGarantia: 'INCENDIO', sumaAsegurada: 500_000 }],
        version: 1,
      });

    // THEN
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('VersionConflict');
  });

  it('given_empty_array_garantias_when_PATCH_location_then_estado_is_INCOMPLETA', async () => {
    // GIVEN — removing all garantias makes the location incomplete
    (pool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ ...QUOTE_ROW }] })
      .mockResolvedValueOnce({ rows: [{ ...COMPLETE_LOCATION_ROW }] }) // currently complete
      .mockResolvedValueOnce({
        rows: [{
          ...COMPLETE_LOCATION_ROW,
          garantias:           [],
          estado_validacion:   'INCOMPLETA',
          alertas_bloqueantes: ['La ubicación no tiene garantías tarifables para calcular'],
          version:             3,
        }],
      });

    // WHEN
    const res = await request(app)
      .patch(`/api/v1/quotes/${FOLIO}/locations/1`)
      .send({ garantias: [], version: 2 });

    // THEN
    expect(res.status).toBe(200);
    expect(res.body.data.estadoValidacion).toBe('INCOMPLETA');
    expect(res.body.data.garantias).toHaveLength(0);
  });
});
