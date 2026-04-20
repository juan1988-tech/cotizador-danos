import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { ExternalCoreService } from '../services/ExternalCoreService';
import { GarantiaResumen, UbicacionResumen, computeValidation } from '../models/Location';
import {
  LocationNotFoundError,
  QuoteNotFoundError,
  ValidationError,
  VersionConflictError,
} from '../utils/errors';
import { validateGarantias } from '../middlewares/validateRequest';

// ── Internal row shapes ───────────────────────────────────────────────────────

type QuoteRow = {
  numero_folio: string;
  estado_cotizacion: string;
  configuracion_layout: { tipoLayout: string; numeroUbicaciones: number } | null;
  version: number;
  fecha_ultima_actualizacion: Date;
};

type LocationRow = {
  indice_ubicacion: number;
  descripcion: string | null;
  codigo_postal: string | null;
  giro_id: string | null;
  estado_validacion: 'COMPLETA' | 'INCOMPLETA';
  alertas_bloqueantes: string[];
  garantias: GarantiaResumen[];
  version: number;
};

const LOC_COLS = `
  indice_ubicacion, descripcion, codigo_postal, giro_id,
  estado_validacion, alertas_bloqueantes, garantias, version
`;

// Module-level singleton — ExternalCoreService uses the pool singleton internally
const externalCore = new ExternalCoreService();

// ── Private helpers ───────────────────────────────────────────────────────────

async function findQuoteRow(folio: string): Promise<QuoteRow | null> {
  const { rows } = await pool.query(
    `SELECT numero_folio, estado_cotizacion, configuracion_layout,
            version, fecha_ultima_actualizacion
       FROM quotes WHERE numero_folio = $1`,
    [folio],
  );
  return rows.length > 0 ? (rows[0] as QuoteRow) : null;
}

async function findLocationRow(folio: string, indice: number): Promise<LocationRow | null> {
  const { rows } = await pool.query(
    `SELECT ${LOC_COLS} FROM locations
      WHERE numero_folio = $1 AND indice_ubicacion = $2`,
    [folio, indice],
  );
  return rows.length > 0 ? (rows[0] as LocationRow) : null;
}

function toUbicacionResumen(row: LocationRow): UbicacionResumen {
  return {
    indiceUbicacion:    row.indice_ubicacion,
    descripcion:        row.descripcion,
    codigoPostal:       row.codigo_postal,
    giroId:             row.giro_id,
    estadoValidacion:   row.estado_validacion,
    alertasBloqueantes: row.alertas_bloqueantes ?? [],
    garantias:          row.garantias ?? [],
    version:            row.version,
  };
}

function assertGarantias(garantias: GarantiaResumen[], next: NextFunction): boolean {
  const error = validateGarantias(garantias);
  if (error) {
    next(new ValidationError(error, { field: 'garantias' }));
    return false;
  }
  return true;
}

// ── POST /quotes/:folio/layout ────────────────────────────────────────────────

export async function postLayout(
  req: Request<{ folio: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { folio } = req.params;
    const { tipoLayout, numeroUbicaciones, version } = req.body as {
      tipoLayout: string;
      numeroUbicaciones: number;
      version: number;
    };

    // 1. Guard: quote exists
    const quote = await findQuoteRow(folio);
    if (!quote) { next(new QuoteNotFoundError(folio)); return; }

    // 2. Fail-fast optimistic lock check (pre-transaction)
    if (quote.version !== version) {
      next(new VersionConflictError(version, quote.version));
      return;
    }

    const currentCount = quote.configuracion_layout?.numeroUbicaciones ?? 0;
    const newLayoutJson = JSON.stringify({ tipoLayout, numeroUbicaciones });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 3. Adjust location slots
      if (numeroUbicaciones > currentCount) {
        for (let i = currentCount + 1; i <= numeroUbicaciones; i++) {
          await client.query(
            `INSERT INTO locations (numero_folio, indice_ubicacion)
             VALUES ($1, $2)
             ON CONFLICT (numero_folio, indice_ubicacion) DO NOTHING`,
            [folio, i],
          );
        }
      } else if (numeroUbicaciones < currentCount) {
        await client.query(
          `DELETE FROM locations
            WHERE numero_folio = $1 AND indice_ubicacion > $2`,
          [folio, numeroUbicaciones],
        );
      }

      // 4. Update quote with optimistic locking (version in WHERE)
      const updateResult = await client.query(
        `UPDATE quotes
            SET configuracion_layout = $3, version = version + 1
          WHERE numero_folio = $1 AND version = $2
          RETURNING version, fecha_ultima_actualizacion`,
        [folio, version, newLayoutJson],
      );

      // Race condition: another writer changed the version between our pre-check and here
      if (updateResult.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new VersionConflictError(version, quote.version);
      }

      await client.query('COMMIT');

      const updated = updateResult.rows[0] as {
        version: number;
        fecha_ultima_actualizacion: Date;
      };
      const ubicacionesInicializadas = numeroUbicaciones > currentCount
        ? numeroUbicaciones - currentCount
        : 0;

      res.status(200).json({
        data: {
          numeroFolio: folio,
          configuracionLayout: { tipoLayout, numeroUbicaciones },
          ubicacionesInicializadas,
          version: updated.version,
          fechaUltimaActualizacion: updated.fecha_ultima_actualizacion,
        },
      });
    } catch (err) {
      await client.query('ROLLBACK');
      next(err);
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
}

// ── GET /quotes/:folio/locations ──────────────────────────────────────────────

export async function getLocations(
  req: Request<{ folio: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { folio } = req.params;

    const quote = await findQuoteRow(folio);
    if (!quote) { next(new QuoteNotFoundError(folio)); return; }

    const { rows } = await pool.query(
      `SELECT ${LOC_COLS} FROM locations
        WHERE numero_folio = $1
        ORDER BY indice_ubicacion`,
      [folio],
    );

    const ubicaciones = (rows as LocationRow[]).map(toUbicacionResumen);
    const completas = ubicaciones.filter((u) => u.estadoValidacion === 'COMPLETA').length;

    res.status(200).json({
      data: {
        ubicaciones,
        resumen: {
          total:       ubicaciones.length,
          completas,
          incompletas: ubicaciones.length - completas,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── PUT /quotes/:folio/locations ──────────────────────────────────────────────

export async function putLocations(
  req: Request<{ folio: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { folio } = req.params;
    const { ubicaciones: inputs, version } = req.body as {
      ubicaciones: Array<{
        indiceUbicacion: number;
        descripcion?: string;
        codigoPostal?: string;
        giroId?: string;
        garantias?: GarantiaResumen[];
        version: number;
      }>;
      version: number;
    };

    // 1. Quote existence + version (pre-transaction fail-fast)
    const quote = await findQuoteRow(folio);
    if (!quote) { next(new QuoteNotFoundError(folio)); return; }

    if (quote.version !== version) {
      next(new VersionConflictError(version, quote.version));
      return;
    }

    // 2. Pre-validate each location exists and its garantias
    for (const input of inputs) {
      const existing = await findLocationRow(folio, input.indiceUbicacion);
      if (!existing) { next(new LocationNotFoundError(input.indiceUbicacion)); return; }
      if (input.garantias && !assertGarantias(input.garantias, next)) return;
    }

    // 3. Catalog validation + collect giroInfo for use inside the transaction
    const giroInfoCache = new Map<string, { id: string; nombre: string; claveIncendio: string | null }>();

    for (const input of inputs) {
      // validatePostalCode throws ExternalValidationError when CP is not found;
      // any thrown error bubbles up to the outer try/catch → next(err)
      if (input.codigoPostal) {
        await externalCore.validatePostalCode(input.codigoPostal);
      }
      if (input.giroId) {
        const giroInfo = await externalCore.getGiroInfo(input.giroId);
        if (!giroInfo) {
          next(new ValidationError(
            `Giro no encontrado: ${input.giroId}`,
            { field: 'giroId', value: input.giroId },
          ));
          return;
        }
        giroInfoCache.set(input.giroId, giroInfo);
      }
    }

    // 4. Transactional update of all locations
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const input of inputs) {
        // Re-read inside the transaction to merge current state
        const locResult = await client.query(
          `SELECT ${LOC_COLS} FROM locations
            WHERE numero_folio = $1 AND indice_ubicacion = $2`,
          [folio, input.indiceUbicacion],
        );
        if (locResult.rows.length === 0) {
          throw new LocationNotFoundError(input.indiceUbicacion);
        }
        const existing = locResult.rows[0] as LocationRow;

        // Merge patch with current values before computing validation
        const effectiveCp       = input.codigoPostal ?? existing.codigo_postal;
        const effectiveGiroId   = input.giroId       ?? existing.giro_id;
        const effectiveGarantias = input.garantias    ?? existing.garantias;
        const giroInfo = input.giroId ? giroInfoCache.get(input.giroId) : undefined;

        const validation = computeValidation({
          codigoPostal:     effectiveCp,
          giroId:           effectiveGiroId,
          garantias:        effectiveGarantias,
          hasClaveIncendio: giroInfo ? !!giroInfo.claveIncendio : undefined,
        });

        // Build dynamic SET clause (only update provided fields)
        const setClauses: string[] = ['version = version + 1'];
        const params: unknown[]    = [folio, input.indiceUbicacion];
        let idx = 3;

        if (input.descripcion  !== undefined) { setClauses.push(`descripcion  = $${idx++}`); params.push(input.descripcion); }
        if (input.codigoPostal !== undefined) { setClauses.push(`codigo_postal = $${idx++}`); params.push(input.codigoPostal); }
        if (input.giroId       !== undefined) { setClauses.push(`giro_id       = $${idx++}`); params.push(input.giroId); }
        if (input.garantias    !== undefined) { setClauses.push(`garantias     = $${idx++}`); params.push(JSON.stringify(input.garantias)); }

        setClauses.push(`estado_validacion   = $${idx++}`); params.push(validation.estadoValidacion);
        setClauses.push(`alertas_bloqueantes = $${idx++}`); params.push(JSON.stringify(validation.alertasBloqueantes));

        await client.query(
          `UPDATE locations SET ${setClauses.join(', ')}
            WHERE numero_folio = $1 AND indice_ubicacion = $2`,
          params,
        );
      }

      // Check whether all locations are now complete
      const stateResult = await client.query(
        `SELECT estado_validacion FROM locations WHERE numero_folio = $1`,
        [folio],
      );
      const allComplete = (stateResult.rows as Array<{ estado_validacion: string }>)
        .every((r) => r.estado_validacion === 'COMPLETA');

      // Bump quote version (and optionally advance estado if all complete)
      const extraSet = allComplete ? `, estado_cotizacion = 'UBICACIONES_CONFIGURADAS'` : '';
      await client.query(
        `UPDATE quotes SET version = version + 1${extraSet} WHERE numero_folio = $1`,
        [folio],
      );

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      next(err);
      return;
    } finally {
      client.release();
    }

    // 5. Read updated state for the response
    const { rows: updatedRows } = await pool.query(
      `SELECT ${LOC_COLS} FROM locations
        WHERE numero_folio = $1 ORDER BY indice_ubicacion`,
      [folio],
    );
    const updatedQuote = await findQuoteRow(folio);

    const ubicaciones = (updatedRows as LocationRow[]).map(toUbicacionResumen);
    const completas = ubicaciones.filter((u) => u.estadoValidacion === 'COMPLETA').length;

    res.status(200).json({
      data: {
        ubicaciones,
        resumen: { total: ubicaciones.length, completas, incompletas: ubicaciones.length - completas },
        version:                 updatedQuote?.version ?? version,
        fechaUltimaActualizacion: updatedQuote?.fecha_ultima_actualizacion,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /quotes/:folio/locations/:index ─────────────────────────────────────

export async function patchLocation(
  req: Request<{ folio: string; index: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { folio, index } = req.params;
    const indice = parseInt(index, 10);
    const body = req.body as {
      descripcion?: string;
      codigoPostal?: string;
      giroId?: string;
      garantias?: GarantiaResumen[];
      version: number;
    };

    // 1. Quote existence guard
    const quote = await findQuoteRow(folio);
    if (!quote) { next(new QuoteNotFoundError(folio)); return; }

    // 2. Location existence guard
    const location = await findLocationRow(folio, indice);
    if (!location) { next(new LocationNotFoundError(indice)); return; }

    // 3. Optimistic lock pre-check on the location row
    if (location.version !== body.version) {
      next(new VersionConflictError(body.version, location.version));
      return;
    }

    // 4. Validate garantias (if provided)
    if (body.garantias && !assertGarantias(body.garantias, next)) return;

    // 5. Validate codigoPostal — throws ExternalValidationError if not found
    if (body.codigoPostal) {
      await externalCore.validatePostalCode(body.codigoPostal);
    }

    // 6. Validate giroId against catalog
    let giroInfo: { id: string; nombre: string; claveIncendio: string | null } | null = null;
    if (body.giroId) {
      giroInfo = await externalCore.getGiroInfo(body.giroId);
      if (!giroInfo) {
        next(new ValidationError(
          `Giro no encontrado: ${body.giroId}`,
          { field: 'giroId', value: body.giroId },
        ));
        return;
      }
    }

    // 7. Compute new validation state using merged (patch + existing) values
    const effectiveCp        = body.codigoPostal ?? location.codigo_postal;
    const effectiveGiroId    = body.giroId       ?? location.giro_id;
    const effectiveGarantias = body.garantias    ?? location.garantias;

    const validation = computeValidation({
      codigoPostal:     effectiveCp,
      giroId:           effectiveGiroId,
      garantias:        effectiveGarantias,
      hasClaveIncendio: giroInfo ? !!giroInfo.claveIncendio : undefined,
    });

    // 8. Build dynamic UPDATE — only patch provided fields
    //    $1 = folio, $2 = indice, $3 = body.version (optimistic lock)
    const setClauses: string[] = ['version = version + 1'];
    const params: unknown[]    = [folio, indice, body.version];
    let idx = 4;

    if (body.descripcion  !== undefined) { setClauses.push(`descripcion   = $${idx++}`); params.push(body.descripcion); }
    if (body.codigoPostal !== undefined) { setClauses.push(`codigo_postal = $${idx++}`); params.push(body.codigoPostal); }
    if (body.giroId       !== undefined) { setClauses.push(`giro_id       = $${idx++}`); params.push(body.giroId); }
    if (body.garantias    !== undefined) { setClauses.push(`garantias     = $${idx++}`); params.push(JSON.stringify(body.garantias)); }

    setClauses.push(`estado_validacion   = $${idx++}`); params.push(validation.estadoValidacion);
    setClauses.push(`alertas_bloqueantes = $${idx++}`); params.push(JSON.stringify(validation.alertasBloqueantes));

    // WHERE includes version for race-condition safety (second check at DB level)
    const updateResult = await pool.query(
      `UPDATE locations
          SET ${setClauses.join(', ')}
        WHERE numero_folio = $1
          AND indice_ubicacion = $2
          AND version = $3
        RETURNING ${LOC_COLS}`,
      params,
    );

    // Race condition: the row was updated by another request between our read and this write
    if (updateResult.rows.length === 0) {
      next(new VersionConflictError(body.version, location.version));
      return;
    }

    res.status(200).json({
      data: toUbicacionResumen(updateResult.rows[0] as LocationRow),
    });
  } catch (err) {
    next(err);
  }
}
