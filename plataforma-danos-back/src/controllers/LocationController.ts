import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { EstadoCotizacion, ConfiguracionLayout } from '../models/Quote';
import { UbicacionResumen, Garantia, LocationInput, computeValidation } from '../models/Location';
import { ExternalCoreService, Giro } from '../services/ExternalCoreService';
import {
  QuoteNotFoundError,
  LocationNotFoundError,
  VersionConflictError,
  ValidationError,
} from '../utils/errors';
import { validateGarantias } from '../middlewares/validateRequest';
import { advanceEstado } from '../utils/helpers';

const coreService = new ExternalCoreService();

async function findQuoteRow(folio: string): Promise<Record<string, unknown>> {
  const result = await pool.query(
    `SELECT numero_folio, estado_cotizacion, configuracion_layout, version
     FROM quotes WHERE numero_folio = $1`,
    [folio]
  );
  if (result.rows.length === 0) throw new QuoteNotFoundError(folio);
  return result.rows[0] as Record<string, unknown>;
}

async function findLocationRow(folio: string, index: number): Promise<Record<string, unknown>> {
  const result = await pool.query(
    `SELECT id, numero_folio, indice_ubicacion, descripcion, codigo_postal, giro_id,
            garantias, estado_validacion, alertas_bloqueantes, version
     FROM locations WHERE numero_folio = $1 AND indice_ubicacion = $2`,
    [folio, index]
  );
  if (result.rows.length === 0) throw new LocationNotFoundError(index);
  return result.rows[0] as Record<string, unknown>;
}

function rowToUbicacionResumen(r: Record<string, unknown>): UbicacionResumen {
  return {
    indiceUbicacion: r.indice_ubicacion as number,
    descripcion: r.descripcion as string | null,
    codigoPostal: r.codigo_postal as string | null,
    giroId: r.giro_id as string | null,
    estadoValidacion: r.estado_validacion as 'COMPLETA' | 'INCOMPLETA',
    alertasBloqueantes: (r.alertas_bloqueantes as string[]) ?? [],
    garantias: (r.garantias as Garantia[]) ?? [],
    version: r.version as number,
  };
}

function buildResumen(rows: UbicacionResumen[]): {
  total: number;
  completas: number;
  incompletas: number;
} {
  const completas = rows.filter(r => r.estadoValidacion === 'COMPLETA').length;
  return { total: rows.length, completas, incompletas: rows.length - completas };
}

// ── POST /api/v1/quotes/:folio/layout ─────────────────────────────────────────

export async function postLayout(
  req: Request<{ folio: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const folio = req.params.folio;
    const { numeroUbicaciones, tipoLayout, version } = req.body as {
      numeroUbicaciones: number;
      tipoLayout: string;
      version: number;
    };

    const quoteRow = await findQuoteRow(folio);
    if ((quoteRow.version as number) !== version) {
      throw new VersionConflictError(version, quoteRow.version as number);
    }

    const previousLayout = quoteRow.configuracion_layout as ConfiguracionLayout | null;
    const previousCount = previousLayout?.numeroUbicaciones ?? 0;
    const newEstado: EstadoCotizacion = advanceEstado(
      quoteRow.estado_cotizacion as EstadoCotizacion,
      'UBICACIONES_CONFIGURADAS'
    );

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (numeroUbicaciones > previousCount) {
        // Add new empty locations at the end
        for (let i = previousCount + 1; i <= numeroUbicaciones; i++) {
          await client.query(
            `INSERT INTO locations
               (numero_folio, indice_ubicacion, descripcion, codigo_postal, giro_id,
                garantias, estado_validacion, alertas_bloqueantes, version)
             VALUES ($1, $2, NULL, NULL, NULL, '[]', 'INCOMPLETA',
                     $3, 1)
             ON CONFLICT (numero_folio, indice_ubicacion) DO NOTHING`,
            [
              folio,
              i,
              JSON.stringify([
                'C\u00f3digo postal no v\u00e1lido o no encontrado',
                'El giro seleccionado no tiene tarifa de incendio asociada',
                'La ubicaci\u00f3n no tiene garant\u00edas tarifables para calcular',
              ]),
            ]
          );
        }
      } else if (numeroUbicaciones < previousCount) {
        // Remove locations from the end
        await client.query(
          `DELETE FROM locations WHERE numero_folio = $1 AND indice_ubicacion > $2`,
          [folio, numeroUbicaciones]
        );
      }

      const newLayout: ConfiguracionLayout = {
        numeroUbicaciones,
        tipoLayout: tipoLayout as 'UNIFORME' | 'PERSONALIZADO',
      };

      const updateResult = await client.query(
        `UPDATE quotes
         SET configuracion_layout = $1,
             estado_cotizacion = $2,
             version = version + 1,
             fecha_ultima_actualizacion = NOW()
         WHERE numero_folio = $3 AND version = $4
         RETURNING version, fecha_ultima_actualizacion`,
        [JSON.stringify(newLayout), newEstado, folio, version]
      );

      if (updateResult.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new VersionConflictError(version, (quoteRow.version as number) + 1);
      }

      await client.query('COMMIT');

      const row = updateResult.rows[0] as Record<string, unknown>;
      res.status(200).json({
        data: {
          numeroFolio: folio,
          configuracionLayout: newLayout,
          ubicacionesInicializadas: Math.max(0, numeroUbicaciones - previousCount),
          version: row.version,
          fechaUltimaActualizacion: (row.fecha_ultima_actualizacion as Date).toISOString(),
        },
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
}

export async function getLocations(
  req: Request<{ folio: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { folio } = req.params as { folio: string };
    await findQuoteRow(folio); // ensures quote exists

    const result = await pool.query(
      `SELECT indice_ubicacion, descripcion, codigo_postal, giro_id,
              estado_validacion, alertas_bloqueantes, garantias, version
       FROM locations WHERE numero_folio = $1 ORDER BY indice_ubicacion`,
      [folio]
    );

    const ubicaciones = result.rows.map((r: Record<string, unknown>) =>
      rowToUbicacionResumen(r as Record<string, unknown>)
    );

    res.status(200).json({
      data: {
        ubicaciones,
        resumen: buildResumen(ubicaciones),
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── PUT /api/v1/quotes/:folio/locations ───────────────────────────────────────

export async function putLocations(
  req: Request<{ folio: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const folio = req.params.folio;
    const { ubicaciones: inputs, version } = req.body as {
      ubicaciones: LocationInput[];
      version: number;
    };

    const quoteRow = await findQuoteRow(folio);
    if ((quoteRow.version as number) !== version) {
      throw new VersionConflictError(version, quoteRow.version as number);
    }

    // Pre-validate all inputs before touching the DB
    const giroInfoMap = new Map<string, Giro | null>();
    for (const input of inputs) {
      const locationRow = await findLocationRow(folio, input.indiceUbicacion);
      if ((locationRow.version as number) !== input.version) {
        throw new VersionConflictError(input.version, locationRow.version as number);
      }
      if (input.garantias) {
        const err = validateGarantias(input.garantias);
        if (err) throw new ValidationError(err);
      }
      if (input.codigoPostal) {
        await coreService.validatePostalCode(input.codigoPostal);
      }
      if (input.giroId) {
        const giroInfo = await coreService.getGiroInfo(input.giroId);
        if (!giroInfo) {
          throw new ValidationError(`El giro '${input.giroId}' no existe.`, { field: 'giroId' });
        }
        giroInfoMap.set(input.giroId, giroInfo);
      }
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const input of inputs) {
        const existing = await findLocationRow(folio, input.indiceUbicacion);
        const merged = {
          descripcion:
            input.descripcion !== undefined
              ? input.descripcion
              : (existing.descripcion as string | null),
          codigoPostal:
            input.codigoPostal !== undefined
              ? input.codigoPostal
              : (existing.codigo_postal as string | null),
          giroId: input.giroId !== undefined ? input.giroId : (existing.giro_id as string | null),
          garantias:
            input.garantias !== undefined
              ? input.garantias
              : ((existing.garantias as Garantia[]) ?? []),
        };
        const giro = merged.giroId ? giroInfoMap.get(merged.giroId) : undefined;
        const hasClaveIncendio =
          giro !== undefined ? giro?.claveIncendio != null : undefined;
        const validation = computeValidation({ ...merged, hasClaveIncendio });

        await client.query(
          `UPDATE locations
           SET descripcion = $1, codigo_postal = $2, giro_id = $3,
               garantias = $4, estado_validacion = $5, alertas_bloqueantes = $6,
               version = version + 1, fecha_actualizacion = NOW()
           WHERE numero_folio = $7 AND indice_ubicacion = $8`,
          [
            merged.descripcion,
            merged.codigoPostal,
            merged.giroId,
            JSON.stringify(merged.garantias),
            validation.estadoValidacion,
            JSON.stringify(validation.alertasBloqueantes),
            folio,
            input.indiceUbicacion,
          ]
        );
      }

      // Determine new quote state and whether to invalidate a previous calculation
      const allLocations = await client.query(
        `SELECT estado_validacion FROM locations WHERE numero_folio = $1`,
        [folio]
      );
      const anyComplete = allLocations.rows.some(
        (r: Record<string, unknown>) => r.estado_validacion === 'COMPLETA'
      );
      const currentEstado = quoteRow.estado_cotizacion as EstadoCotizacion;
      const wasCalculada = currentEstado === 'CALCULADA';
      const newEstado: EstadoCotizacion = wasCalculada
        ? 'COBERTURAS_SELECCIONADAS'
        : anyComplete
        ? advanceEstado(currentEstado, 'UBICACIONES_CONFIGURADAS')
        : currentEstado;

      await client.query(
        `UPDATE quotes
         SET estado_cotizacion = $1,
             primas_por_ubicacion = CASE WHEN $2::boolean THEN NULL ELSE primas_por_ubicacion END,
             version = version + 1,
             fecha_ultima_actualizacion = NOW()
         WHERE numero_folio = $3 AND version = $4`,
        [newEstado, wasCalculada, folio, version]
      );

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    const afterResult = await pool.query(
      `SELECT indice_ubicacion, descripcion, codigo_postal, giro_id,
              estado_validacion, alertas_bloqueantes, garantias, version
       FROM locations WHERE numero_folio = $1 ORDER BY indice_ubicacion`,
      [folio]
    );
    const updatedUbicaciones = afterResult.rows.map((r: Record<string, unknown>) =>
      rowToUbicacionResumen(r as Record<string, unknown>)
    );
    const quoteAfter = await findQuoteRow(folio);

    res.status(200).json({
      data: {
        ubicaciones: updatedUbicaciones,
        resumen: buildResumen(updatedUbicaciones),
        version: quoteAfter.version,
        fechaUltimaActualizacion: (quoteAfter.fecha_ultima_actualizacion as Date).toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/v1/quotes/:folio/locations/:index ──────────────────────────────

export async function patchLocation(
  req: Request<{ folio: string; index: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const folio = req.params.folio;
    const index = parseInt(req.params.index, 10);
    const body = req.body as Partial<LocationInput> & { version: number };

    const quoteRow = await findQuoteRow(folio);
    const locationRow = await findLocationRow(folio, index);

    if ((locationRow.version as number) !== body.version) {
      throw new VersionConflictError(body.version, locationRow.version as number);
    }

    if (body.garantias) {
      const err = validateGarantias(body.garantias);
      if (err) throw new ValidationError(err);
    }
    if (body.codigoPostal) {
      await coreService.validatePostalCode(body.codigoPostal);
    }
    let hasClaveIncendio: boolean | undefined;
    if (body.giroId) {
      const giroInfo = await coreService.getGiroInfo(body.giroId);
      if (!giroInfo) {
        throw new ValidationError(`El giro '${body.giroId}' no existe.`, { field: 'giroId' });
      }
      hasClaveIncendio = giroInfo.claveIncendio != null;
    }

    const merged = {
      descripcion:
        body.descripcion !== undefined
          ? body.descripcion
          : (locationRow.descripcion as string | null),
      codigoPostal:
        body.codigoPostal !== undefined
          ? body.codigoPostal
          : (locationRow.codigo_postal as string | null),
      giroId: body.giroId !== undefined ? body.giroId : (locationRow.giro_id as string | null),
      garantias:
        body.garantias !== undefined
          ? body.garantias
          : ((locationRow.garantias as Garantia[]) ?? []),
    };
    const validation = computeValidation({ ...merged, hasClaveIncendio });

    const result = await pool.query(
      `UPDATE locations
       SET descripcion = $1, codigo_postal = $2, giro_id = $3,
           garantias = $4, estado_validacion = $5, alertas_bloqueantes = $6,
           version = version + 1, fecha_actualizacion = NOW()
       WHERE numero_folio = $7 AND indice_ubicacion = $8 AND version = $9
       RETURNING indice_ubicacion, descripcion, codigo_postal, giro_id,
                 estado_validacion, alertas_bloqueantes, garantias, version`,
      [
        merged.descripcion,
        merged.codigoPostal,
        merged.giroId,
        JSON.stringify(merged.garantias),
        validation.estadoValidacion,
        JSON.stringify(validation.alertasBloqueantes),
        folio,
        index,
        body.version,
      ]
    );

    if (result.rows.length === 0) {
      throw new VersionConflictError(body.version, (locationRow.version as number) + 1);
    }

    // Invalidate previous calculation if the quote was in CALCULADA state
    if ((quoteRow.estado_cotizacion as string) === 'CALCULADA') {
      await pool.query(
        `UPDATE quotes
         SET primas_por_ubicacion = NULL,
             estado_cotizacion = 'COBERTURAS_SELECCIONADAS',
             version = version + 1,
             fecha_ultima_actualizacion = NOW()
         WHERE numero_folio = $1`,
        [folio]
      );
    }

    const updated = rowToUbicacionResumen(result.rows[0] as Record<string, unknown>);
    res.status(200).json({ data: updated });
  } catch (err) {
    next(err);
  }
}
