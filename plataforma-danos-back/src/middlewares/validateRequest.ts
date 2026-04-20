import { Request, Response, NextFunction } from 'express';
import { MissingRequiredFieldError, ValidationError } from '../utils/errors';
import { isValidRFC, isValidISODate, isPastDate } from '../utils/helpers';

// ─── requireFields ────────────────────────────────────────────────────────────
export function requireFields(...fields: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    for (const field of fields) {
      if (req.body[field] === undefined || req.body[field] === null) {
        next(new MissingRequiredFieldError(field));
        return;
      }
    }
    next();
  };
}

// ─── validateGeneralData ──────────────────────────────────────────────────────
export function validateGeneralData(req: Request, _res: Response, next: NextFunction): void {
  const { nombreAsegurado, rfcAsegurado, vigenciaInicio, vigenciaFin } = req.body as Record<string, unknown>;

  if (typeof nombreAsegurado === 'string') {
    if (nombreAsegurado.trim().length < 2 || nombreAsegurado.length > 200) {
      next(new ValidationError('nombreAsegurado debe tener entre 2 y 200 caracteres', { field: 'nombreAsegurado' }));
      return;
    }
  }

  if (typeof rfcAsegurado === 'string') {
    if (!isValidRFC(rfcAsegurado)) {
      next(new ValidationError(`RFC inválido: ${rfcAsegurado}`, { field: 'rfcAsegurado' }));
      return;
    }
  }

  if (typeof vigenciaInicio === 'string') {
    if (!isValidISODate(vigenciaInicio)) {
      next(new ValidationError('vigenciaInicio debe tener formato YYYY-MM-DD', { field: 'vigenciaInicio' }));
      return;
    }
    if (isPastDate(vigenciaInicio)) {
      next(new ValidationError('vigenciaInicio no puede ser una fecha pasada', { field: 'vigenciaInicio' }));
      return;
    }
  }

  if (typeof vigenciaFin === 'string') {
    if (!isValidISODate(vigenciaFin)) {
      next(new ValidationError('vigenciaFin debe tener formato YYYY-MM-DD', { field: 'vigenciaFin' }));
      return;
    }
    if (typeof vigenciaInicio === 'string' && isValidISODate(vigenciaInicio)) {
      if (vigenciaFin <= vigenciaInicio) {
        next(new ValidationError('vigenciaFin debe ser posterior a vigenciaInicio', { field: 'vigenciaFin' }));
        return;
      }
    }
  }

  next();
}

// ─── validateLayout ───────────────────────────────────────────────────────────
export function validateLayout(req: Request, _res: Response, next: NextFunction): void {
  const { numeroUbicaciones, tipoLayout } = req.body as Record<string, unknown>;

  if (typeof numeroUbicaciones !== 'number' || !Number.isInteger(numeroUbicaciones)) {
    next(new ValidationError(
      'numeroUbicaciones debe ser un entero entre 1 y 50',
      { field: 'numeroUbicaciones' },
    ));
    return;
  }

  if (numeroUbicaciones < 1 || numeroUbicaciones > 50) {
    next(new ValidationError(
      'numeroUbicaciones debe ser entre 1 y 50',
      { field: 'numeroUbicaciones' },
    ));
    return;
  }

  const VALID_LAYOUTS = ['UNIFORME', 'PERSONALIZADO'];
  if (!VALID_LAYOUTS.includes(tipoLayout as string)) {
    next(new ValidationError(
      `tipoLayout debe ser uno de: ${VALID_LAYOUTS.join(', ')}`,
      { field: 'tipoLayout' },
    ));
    return;
  }

  next();
}

// ─── validateGarantias ────────────────────────────────────────────────────────
// Pure function — returns null if valid, or an error message string.
export function validateGarantias(value: unknown): string | null {
  if (!Array.isArray(value)) return null;

  for (const item of value) {
    if (item !== null && typeof item === 'object' && 'sumaAsegurada' in item) {
      const suma = (item as { sumaAsegurada: unknown }).sumaAsegurada;
      if (typeof suma === 'number' && suma <= 0) {
        return 'sumaAsegurada debe ser mayor a 0';
      }
    }
  }

  return null;
}

// ─── validateFolioParam ───────────────────────────────────────────────────────
export function validateFolioParam(req: Request, _res: Response, next: NextFunction): void {
  const folio = (req.params as Record<string, string>)['folio'];
  if (!folio || !/^[A-Za-z0-9-]{1,20}$/.test(folio)) {
    next(new ValidationError('folio debe ser alfanumérico con guiones, máximo 20 caracteres', { field: 'folio' }));
    return;
  }
  next();
}

// ─── validateIndexParam ───────────────────────────────────────────────────────
export function validateIndexParam(req: Request, _res: Response, next: NextFunction): void {
  const raw = (req.params as Record<string, string>)['index'];
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) {
    next(new ValidationError('index debe ser un entero mayor o igual a 1', { field: 'index' }));
    return;
  }
  next();
}

// ─── validateVersionBody ──────────────────────────────────────────────────────
export function validateVersionBody(req: Request, _res: Response, next: NextFunction): void {
  const { version } = req.body as Record<string, unknown>;
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    next(new ValidationError('version debe ser un entero mayor o igual a 1', { field: 'version' }));
    return;
  }
  next();
}

// ─── validatePutLocations ─────────────────────────────────────────────────────
export function validatePutLocations(req: Request, _res: Response, next: NextFunction): void {
  const { ubicaciones } = req.body as Record<string, unknown>;

  if (!Array.isArray(ubicaciones) || ubicaciones.length === 0) {
    next(new ValidationError('ubicaciones debe ser un arreglo no vacío', { field: 'ubicaciones' }));
    return;
  }

  for (const item of ubicaciones) {
    if (item === null || typeof item !== 'object') {
      next(new ValidationError('Cada elemento de ubicaciones debe ser un objeto', { field: 'ubicaciones' }));
      return;
    }
    const u = item as Record<string, unknown>;

    if (typeof u['indiceUbicacion'] !== 'number' || !Number.isInteger(u['indiceUbicacion']) || u['indiceUbicacion'] < 1) {
      next(new ValidationError('indiceUbicacion debe ser un entero positivo en cada ubicación', { field: 'indiceUbicacion' }));
      return;
    }

    if (typeof u['version'] !== 'number' || !Number.isInteger(u['version']) || u['version'] < 1) {
      next(new MissingRequiredFieldError('version (por ubicación)'));
      return;
    }

    if (typeof u['descripcion'] === 'string' && u['descripcion'].length > 200) {
      next(new ValidationError('descripcion no puede exceder 200 caracteres', { field: 'descripcion' }));
      return;
    }

    const garantiasError = validateGarantias(u['garantias']);
    if (garantiasError !== null) {
      next(new ValidationError(garantiasError, { field: 'garantias' }));
      return;
    }
  }

  next();
}

// ─── validatePatchLocation ────────────────────────────────────────────────────
export function validatePatchLocation(req: Request, _res: Response, next: NextFunction): void {
  const body = req.body as Record<string, unknown>;

  if (typeof body['descripcion'] === 'string' && body['descripcion'].length > 200) {
    next(new ValidationError('descripcion no puede exceder 200 caracteres', { field: 'descripcion' }));
    return;
  }

  const garantiasError = validateGarantias(body['garantias']);
  if (garantiasError !== null) {
    next(new ValidationError(garantiasError, { field: 'garantias' }));
    return;
  }

  next();
}

// ─── validatePutCoverageOptions ───────────────────────────────────────────────
export function validatePutCoverageOptions(req: Request, _res: Response, next: NextFunction): void {
  const { opcionesCobertura } = req.body as Record<string, unknown>;

  if (!Array.isArray(opcionesCobertura) || opcionesCobertura.length === 0) {
    next(new ValidationError('opcionesCobertura debe ser un arreglo no vacío', { field: 'opcionesCobertura' }));
    return;
  }

  for (const item of opcionesCobertura) {
    if (item === null || typeof item !== 'object') {
      next(new ValidationError('Cada opción de cobertura debe ser un objeto', { field: 'opcionesCobertura' }));
      return;
    }
    const c = item as Record<string, unknown>;

    if (typeof c['codigoCobertura'] !== 'string' || c['codigoCobertura'].trim() === '') {
      next(new ValidationError('codigoCobertura debe ser un string no vacío', { field: 'codigoCobertura' }));
      return;
    }

    if (typeof c['seleccionada'] !== 'boolean') {
      next(new ValidationError('seleccionada debe ser un valor booleano', { field: 'seleccionada' }));
      return;
    }
  }

  next();
}

// ─── validateCatalogQuery ─────────────────────────────────────────────────────
export function validateCatalogQuery(req: Request, _res: Response, next: NextFunction): void {
  const { q } = req.query as Record<string, unknown>;
  if (q !== undefined && (typeof q !== 'string' || q.length > 100)) {
    next(new ValidationError('q debe ser una cadena de máximo 100 caracteres', { field: 'q' }));
    return;
  }
  next();
}
