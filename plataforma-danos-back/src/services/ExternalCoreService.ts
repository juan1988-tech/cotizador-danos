import { pool } from '../config/database';
import { CatalogServiceUnavailableError, ExternalValidationError } from '../utils/errors';

// ─── Output types ─────────────────────────────────────────────────────────────

export interface AgentItem   { id: string; nombre: string; codigo: string; }
export interface SubscriberItem { id: string; nombre: string; codigo: string; }
export interface GiroItem    { id: string; nombre: string; claveIncendio: string | null; }

export interface PostalCodeResult {
  codigoPostal: string;
  municipio:    string;
  estado:       string;
  pais:         string;
}

export interface GiroResult {
  id:            string;
  nombre:        string;
  claveIncendio: string | null;
}

interface PagedResult<T> { data: T[]; total: number; }

// ─── ExternalCoreService ──────────────────────────────────────────────────────
/**
 * Encapsulates all catalog and folio lookups that logically belong to
 * Plataforma-core-ohs. In this implementation they are backed by the local
 * PostgreSQL catalogs. All queries are 100 % parameterized (LIN-DEV-003).
 */
export class ExternalCoreService {
  // Uses the module-level pool singleton — no constructor injection needed.

  async getAgents(q?: string): Promise<PagedResult<AgentItem>> {
    try {
      let sql = `SELECT clave AS id, nombre, clave AS codigo
                   FROM catalogos_agentes WHERE activo = true`;
      const params: unknown[] = [];
      if (q) {
        sql += ` AND (nombre ILIKE $1 OR clave ILIKE $1)`;
        params.push(`%${q}%`);
      }
      const { rows, rowCount } = await pool.query(sql, params);
      return { data: rows as AgentItem[], total: rowCount ?? rows.length };
    } catch {
      throw new CatalogServiceUnavailableError();
    }
  }

  async getSubscribers(q?: string): Promise<PagedResult<SubscriberItem>> {
    try {
      let sql = `SELECT codigo AS id, nombre, codigo
                   FROM catalogos_suscriptores WHERE activo = true`;
      const params: unknown[] = [];
      if (q) {
        sql += ` AND (nombre ILIKE $1 OR codigo ILIKE $1)`;
        params.push(`%${q}%`);
      }
      const { rows, rowCount } = await pool.query(sql, params);
      return { data: rows as SubscriberItem[], total: rowCount ?? rows.length };
    } catch {
      throw new CatalogServiceUnavailableError();
    }
  }

  async getGiros(q?: string): Promise<PagedResult<GiroItem>> {
    try {
      let sql = `SELECT clave_giro AS id, descripcion AS nombre,
                        clave_incendio AS "claveIncendio"
                   FROM catalogos_giros WHERE activo = true`;
      const params: unknown[] = [];
      if (q) {
        sql += ` AND descripcion ILIKE $1`;
        params.push(`%${q}%`);
      }
      const { rows, rowCount } = await pool.query(sql, params);
      return { data: rows as GiroItem[], total: rowCount ?? rows.length };
    } catch {
      throw new CatalogServiceUnavailableError();
    }
  }

  /**
   * Returns postal-code geographic data.
   * @throws {ExternalValidationError} when the code does not exist in the catalog.
   * @throws {CatalogServiceUnavailableError} on DB connectivity errors.
   */
  async validatePostalCode(codigoPostal: string): Promise<PostalCodeResult> {
    try {
      const { rows } = await pool.query(
        `SELECT codigo_postal AS "codigoPostal", municipio, estado,
                'México'::text AS pais
           FROM catalogo_cp_zonas
          WHERE codigo_postal = $1 AND activo = true`,
        [codigoPostal],
      );
      if (rows.length === 0) {
        throw new ExternalValidationError(
          `C\u00f3digo postal no encontrado: ${codigoPostal}`,
          { codigoPostal },
        );
      }
      return rows[0] as PostalCodeResult;
    } catch (err) {
      if (err instanceof ExternalValidationError) throw err;
      throw new CatalogServiceUnavailableError();
    }
  }

  /** Returns the full giro record, or null when not found (no throw). */
  async getGiroInfo(giroId: string): Promise<GiroResult | null> {
    const { rows } = await pool.query(
      `SELECT clave_giro AS id, descripcion AS nombre,
              clave_incendio AS "claveIncendio"
         FROM catalogos_giros
        WHERE clave_giro = $1 AND activo = true`,
      [giroId],
    );
    return rows.length > 0 ? (rows[0] as GiroResult) : null;
  }

  async agentExists(agenteId: string): Promise<boolean> {
    try {
      const { rows } = await pool.query(
        `SELECT 1 FROM catalogos_agentes WHERE clave = $1 AND activo = true`,
        [agenteId],
      );
      return rows.length > 0;
    } catch {
      throw new CatalogServiceUnavailableError();
    }
  }

  async subscriberExists(suscriptorId: string): Promise<boolean> {
    try {
      const { rows } = await pool.query(
        `SELECT 1 FROM catalogos_suscriptores WHERE codigo = $1 AND activo = true`,
        [suscriptorId],
      );
      return rows.length > 0;
    } catch {
      throw new CatalogServiceUnavailableError();
    }
  }

  async giroExists(giroId: string): Promise<boolean> {
    try {
      const { rows } = await pool.query(
        `SELECT 1 FROM catalogos_giros WHERE clave_giro = $1 AND activo = true`,
        [giroId],
      );
      return rows.length > 0;
    } catch {
      throw new CatalogServiceUnavailableError();
    }
  }

  async generateFolio(): Promise<string> {
    try {
      const { rows } = await pool.query(`SELECT nextval('seq_folios') AS seq`);
      const seq  = parseInt((rows[0] as Record<string, unknown>)['seq'] as string, 10);
      const year = new Date().getFullYear();
      return `COT-${year}-${seq.toString().padStart(6, '0')}`;
    } catch {
      throw new CatalogServiceUnavailableError();
    }
  }
}

