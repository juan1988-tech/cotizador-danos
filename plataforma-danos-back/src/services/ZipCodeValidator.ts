import { Pool } from 'pg';

// ─── Output type ──────────────────────────────────────────────────────────────
export interface ZipCodeInfo {
  codigoPostal: string;
  municipio: string;
  estado: string;
  ciudad: string | null;
}

// ─── ZipCodeValidator ─────────────────────────────────────────────────────────
/**
 * Queries the local catalog table `catalogo_cp_zonas` and returns
 * the complete geographic data for a given postal code.
 *
 * Returns null when the code is not found or is marked inactive.
 * All queries are fully parameterized to prevent SQL injection (LIN-DEV-003).
 */
export class ZipCodeValidator {
  constructor(private readonly db: Pool) {}

  async findByCodigoPostal(codigoPostal: string): Promise<ZipCodeInfo | null> {
    const { rows } = await this.db.query(
      `SELECT codigo_postal, municipio, estado, ciudad
         FROM catalogo_cp_zonas
        WHERE codigo_postal = $1
          AND activo = true`,
      [codigoPostal],
    );

    if (rows.length === 0) return null;

    const row = rows[0] as Record<string, unknown>;
    return {
      codigoPostal: row['codigo_postal'] as string,
      municipio:    row['municipio']    as string,
      estado:       row['estado']       as string,
      ciudad:       row['ciudad']       as string | null,
    };
  }
}
