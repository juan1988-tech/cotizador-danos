import { pool } from '../config/database';
import { CatalogServiceUnavailableError, ExternalValidationError } from '../utils/errors';

export interface Agente {
  id: string;
  nombre: string;
  codigo: string;
}

export interface Suscriptor {
  id: string;
  nombre: string;
  codigo: string;
}

export interface Giro {
  id: string;
  nombre: string;
  claveIncendio: string | null;
}

export interface PostalCodeInfo {
  codigoPostal: string;
  municipio: string;
  estado: string;
  pais: string;
}

export class ExternalCoreService {
  async getAgents(q?: string): Promise<{ data: Agente[]; total: number }> {
    try {
      const params: string[] = [];
      let where = 'WHERE activo = true';
      if (q) {
        params.push(`%${q}%`);
        where += ` AND (LOWER(nombre) LIKE LOWER($1) OR LOWER(clave) LIKE LOWER($1))`;
      }
      const result = await pool.query(
        `SELECT clave AS id, nombre, clave AS codigo FROM catalogos_agentes ${where}`,
        params
      );
      return { data: result.rows as Agente[], total: result.rowCount ?? 0 };
    } catch {
      throw new CatalogServiceUnavailableError();
    }
  }

  async getSubscribers(q?: string): Promise<{ data: Suscriptor[]; total: number }> {
    try {
      const params: string[] = [];
      let where = 'WHERE activo = true';
      if (q) {
        params.push(`%${q}%`);
        where += ` AND (LOWER(nombre) LIKE LOWER($1) OR LOWER(codigo) LIKE LOWER($1))`;
      }
      const result = await pool.query(
        `SELECT codigo AS id, nombre, codigo FROM catalogos_suscriptores ${where}`,
        params
      );
      return { data: result.rows as Suscriptor[], total: result.rowCount ?? 0 };
    } catch {
      throw new CatalogServiceUnavailableError();
    }
  }

  async getGiros(q?: string): Promise<{ data: Giro[]; total: number }> {
    try {
      const params: string[] = [];
      let where = 'WHERE activo = true';
      if (q) {
        params.push(`%${q}%`);
        where += ` AND (LOWER(descripcion) LIKE LOWER($1) OR LOWER(clave_giro) LIKE LOWER($1))`;
      }
      const result = await pool.query(
        `SELECT clave_giro AS id, descripcion AS nombre, clave_incendio AS "claveIncendio" FROM catalogos_giros ${where}`,
        params
      );
      return { data: result.rows as Giro[], total: result.rowCount ?? 0 };
    } catch {
      throw new CatalogServiceUnavailableError();
    }
  }

  async validatePostalCode(cp: string): Promise<PostalCodeInfo> {
    try {
      const result = await pool.query(
        `SELECT codigo_postal AS "codigoPostal", municipio, estado, 'México' AS pais
         FROM catalogo_cp_zonas
         WHERE codigo_postal = $1 AND activo = true`,
        [cp]
      );
      if (result.rows.length === 0) {
        throw new ExternalValidationError(`El código postal '${cp}' no existe en el catálogo.`, {
          codigoPostal: cp,
        });
      }
      return result.rows[0] as PostalCodeInfo;
    } catch (err) {
      if (err instanceof ExternalValidationError) throw err;
      throw new CatalogServiceUnavailableError();
    }
  }

  async agentExists(agenteId: string): Promise<boolean> {
    try {
      const result = await pool.query(
        `SELECT 1 FROM catalogos_agentes WHERE clave = $1 AND activo = true`,
        [agenteId]
      );
      return result.rows.length > 0;
    } catch {
      throw new CatalogServiceUnavailableError();
    }
  }

  async subscriberExists(suscriptorId: string): Promise<boolean> {
    try {
      const result = await pool.query(
        `SELECT 1 FROM catalogos_suscriptores WHERE codigo = $1 AND activo = true`,
        [suscriptorId]
      );
      return result.rows.length > 0;
    } catch {
      throw new CatalogServiceUnavailableError();
    }
  }

  async getGiroInfo(giroId: string): Promise<Giro | null> {
    try {
      const result = await pool.query(
        `SELECT clave_giro AS id, descripcion AS nombre, clave_incendio AS "claveIncendio"
         FROM catalogos_giros WHERE clave_giro = $1 AND activo = true`,
        [giroId]
      );
      return result.rows.length > 0 ? (result.rows[0] as Giro) : null;
    } catch {
      throw new CatalogServiceUnavailableError();
    }
  }

  async giroExists(giroId: string): Promise<boolean> {
    try {
      const result = await pool.query(
        `SELECT 1 FROM catalogos_giros WHERE clave_giro = $1 AND activo = true`,
        [giroId]
      );
      return result.rows.length > 0;
    } catch {
      throw new CatalogServiceUnavailableError();
    }
  }

  async generateFolio(): Promise<string> {
    try {
      const result = await pool.query(`SELECT nextval('seq_folios') AS seq`);
      const seq = result.rows[0].seq as number;
      const year = new Date().getFullYear();
      return `COT-${year}-${String(seq).padStart(6, '0')}`;
    } catch {
      throw new CatalogServiceUnavailableError();
    }
  }
}
