import { Pool, PoolClient, QueryResult } from 'pg';
import { IQuoteRepository, NewQuote, TransactionScope } from './IQuoteRepository';
import {
  Quote,
  QuoteState,
  DatosAsegurado,
  LayoutConfig,
  OpcionCobertura,
  LocationPremium,
} from '../models/Quote';
import { QuoteNotFoundError, VersionConflictError } from '../utils/errors';

// Structural type satisfied by both Pool and PoolClient
type PgExecutor = {
  query(text: string, values?: unknown[]): Promise<QueryResult>;
};

const QUOTE_COLUMNS = `
  numero_folio,
  estado_cotizacion,
  datos_asegurado,
  configuracion_layout,
  opciones_cobertura,
  primas_por_ubicacion,
  version,
  fecha_creacion,
  fecha_ultima_actualizacion
`;

export class QuoteRepository implements IQuoteRepository {
  constructor(private readonly db: PgExecutor) {}

  async findByFolio(folio: string): Promise<Quote | null> {
    const sql = `
      SELECT ${QUOTE_COLUMNS}
      FROM quotes
      WHERE numero_folio = $1
    `;
    const result = await this.db.query(sql, [folio]);
    if (result.rows.length === 0) return null;
    return this.toQuote(result.rows[0] as Record<string, unknown>);
  }

  async save(data: NewQuote): Promise<Quote> {
    const sql = `
      INSERT INTO quotes (numero_folio)
      VALUES ($1)
      RETURNING ${QUOTE_COLUMNS}
    `;
    const result = await this.db.query(sql, [data.numeroFolio]);
    return this.toQuote(result.rows[0] as Record<string, unknown>);
  }

  async update(
    folio: string,
    changes: Partial<Quote>,
    expectedVersion: number,
  ): Promise<Quote> {
    const setClauses: string[] = [];
    const params: unknown[] = [folio, expectedVersion];
    let paramIdx = 3;

    if ('estadoCotizacion' in changes) {
      setClauses.push(`estado_cotizacion = $${paramIdx++}`);
      params.push(changes.estadoCotizacion);
    }
    if ('datosAsegurado' in changes) {
      setClauses.push(`datos_asegurado = $${paramIdx++}`);
      params.push(changes.datosAsegurado != null ? JSON.stringify(changes.datosAsegurado) : null);
    }
    if ('configuracionLayout' in changes) {
      setClauses.push(`configuracion_layout = $${paramIdx++}`);
      params.push(
        changes.configuracionLayout != null ? JSON.stringify(changes.configuracionLayout) : null,
      );
    }
    if ('opcionesCobertura' in changes) {
      setClauses.push(`opciones_cobertura = $${paramIdx++}`);
      params.push(
        changes.opcionesCobertura != null ? JSON.stringify(changes.opcionesCobertura) : null,
      );
    }
    if ('primasPorUbicacion' in changes) {
      setClauses.push(`primas_por_ubicacion = $${paramIdx++}`);
      params.push(
        changes.primasPorUbicacion != null ? JSON.stringify(changes.primasPorUbicacion) : null,
      );
    }

    // Always increment version as part of the update
    setClauses.push('version = version + 1');

    const sql = `
      UPDATE quotes
      SET ${setClauses.join(', ')}
      WHERE numero_folio = $1 AND version = $2
      RETURNING ${QUOTE_COLUMNS}
    `;

    const result = await this.db.query(sql, params);

    if (result.rows.length === 0) {
      // Differentiate between not-found and version conflict
      const current = await this.findByFolio(folio);
      if (current === null) throw new QuoteNotFoundError(folio);
      throw new VersionConflictError(expectedVersion, current.version);
    }

    return this.toQuote(result.rows[0] as Record<string, unknown>);
  }

  async withTransaction<T>(fn: (scope: TransactionScope) => Promise<T>): Promise<T> {
    // Detect nested call: PoolClient has a `release` method, Pool does not
    if ('release' in this.db) {
      return fn(this.buildScope(this.db as PoolClient));
    }

    const client = await (this.db as Pool).connect();
    try {
      await client.query('BEGIN');
      const result = await fn(this.buildScope(client));
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private buildScope(client: PoolClient): TransactionScope {
    return {
      quotes: new QuoteRepository(client),
      rawQuery: async (sql: string, params?: unknown[]) => {
        const result = await client.query(sql, params ?? []);
        return { rows: result.rows as Record<string, unknown>[] };
      },
    };
  }

  private toQuote(row: Record<string, unknown>): Quote {
    return {
      numeroFolio: row['numero_folio'] as string,
      estadoCotizacion: row['estado_cotizacion'] as QuoteState,
      datosAsegurado: (row['datos_asegurado'] as DatosAsegurado) ?? null,
      configuracionLayout: (row['configuracion_layout'] as LayoutConfig) ?? null,
      opcionesCobertura: (row['opciones_cobertura'] as OpcionCobertura[]) ?? null,
      primasPorUbicacion: (row['primas_por_ubicacion'] as LocationPremium[]) ?? null,
      version: row['version'] as number,
      fechaCreacion: row['fecha_creacion'] as Date,
      fechaUltimaActualizacion: row['fecha_ultima_actualizacion'] as Date,
    };
  }
}
