/// <reference types="jest" />

import { QuoteRepository } from '../../src/repositories/QuoteRepository';
import type { QuoteSummary } from '../../src/repositories/IQuoteRepository';

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildDb(rows: Record<string, unknown>[] = []) {
  return { query: jest.fn().mockResolvedValue({ rows }) };
}

const NOW = new Date('2026-04-20T10:00:00.000Z');

const SUMMARY_ROW = {
  numero_folio: 'COT-2026-001000',
  estado_cotizacion: 'CALCULADA',
  nombre_asegurado: 'María López',
  prima_neta_total: '2500.50',
  fecha_creacion: NOW,
  fecha_ultima_actualizacion: NOW,
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('QuoteRepository.findAll', () => {
  it('given_findAll_when_db_returns_rows_then_maps_to_QuoteSummary_array', async () => {
    const db = buildDb([SUMMARY_ROW]);
    const repo = new QuoteRepository(db);

    const result: QuoteSummary[] = await repo.findAll();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      numeroFolio: 'COT-2026-001000',
      estadoCotizacion: 'CALCULADA',
      nombreAsegurado: 'María López',
      primaNetaTotal: 2500.5,
      fechaCreacion: NOW.toISOString(),
      fechaUltimaActualizacion: NOW.toISOString(),
    });
  });

  it('given_findAll_when_nombre_asegurado_is_null_then_nombreAsegurado_is_null', async () => {
    const db = buildDb([{ ...SUMMARY_ROW, nombre_asegurado: null }]);
    const repo = new QuoteRepository(db);

    const result = await repo.findAll();

    expect(result[0]?.nombreAsegurado).toBeNull();
  });

  it('given_findAll_when_prima_neta_total_is_null_then_primaNetaTotal_is_null', async () => {
    const db = buildDb([{ ...SUMMARY_ROW, prima_neta_total: null }]);
    const repo = new QuoteRepository(db);

    const result = await repo.findAll();

    expect(result[0]?.primaNetaTotal).toBeNull();
  });

  it('given_findAll_when_no_quotes_exist_then_returns_empty_array', async () => {
    const db = buildDb([]);
    const repo = new QuoteRepository(db);

    const result = await repo.findAll();

    expect(result).toEqual([]);
  });

  it('given_findAll_when_multiple_rows_then_returns_all_mapped', async () => {
    const row2 = {
      ...SUMMARY_ROW,
      numero_folio: 'COT-2026-001001',
      estado_cotizacion: 'EN_EDICION',
      prima_neta_total: null,
    };
    const db = buildDb([SUMMARY_ROW, row2]);
    const repo = new QuoteRepository(db);

    const result = await repo.findAll();

    expect(result).toHaveLength(2);
    expect(result[0]?.numeroFolio).toBe('COT-2026-001000');
    expect(result[1]?.numeroFolio).toBe('COT-2026-001001');
    expect(result[1]?.primaNetaTotal).toBeNull();
  });

  it('given_findAll_when_db_throws_then_rejects_with_same_error', async () => {
    const db = { query: jest.fn().mockRejectedValue(new Error('Connection lost')) };
    const repo = new QuoteRepository(db);

    await expect(repo.findAll()).rejects.toThrow('Connection lost');
  });
});
