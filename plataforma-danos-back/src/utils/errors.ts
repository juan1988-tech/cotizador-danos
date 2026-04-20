export class AppError extends Error {
  readonly statusCode: number;
  readonly errorCode: string;
  readonly details?: Record<string, unknown>;

  constructor(
    statusCode: number,
    errorCode: string,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = errorCode;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
  }
}

export class QuoteNotFoundError extends AppError {
  constructor(folio: string) {
    super(404, 'QuoteNotFound', `La cotización con folio '${folio}' no existe.`);
  }
}

export class LocationNotFoundError extends AppError {
  constructor(index: number) {
    super(
      404,
      'LocationNotFound',
      `La ubicación con índice ${index} no existe en el layout configurado.`
    );
  }
}

export class VersionConflictError extends AppError {
  constructor(expectedVersion: number, currentVersion: number) {
    super(
      409,
      'VersionConflict',
      'La versión enviada no coincide con la versión actual del registro.',
      { expectedVersion, currentVersion }
    );
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(400, 'ValidationError', message, details);
  }
}

export class MissingRequiredFieldError extends AppError {
  constructor(field: string) {
    super(400, 'MissingRequiredField', `El campo '${field}' es obligatorio.`, { field });
  }
}

export class ExternalValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(422, 'ExternalValidationError', message, details);
  }
}

export class NoValidLocationsError extends AppError {
  constructor(incompleteIndices: number[]) {
    super(
      422,
      'NoValidLocationsForCalculation',
      'No existen ubicaciones válidas para calcular. Todas las ubicaciones están en estado INCOMPLETA.',
      { ubicacionesIncompletas: incompleteIndices }
    );
  }
}

export class NoCoverageSelectedError extends AppError {
  constructor() {
    super(
      422,
      'NoCoverageSelected',
      'Se debe seleccionar al menos una cobertura antes de calcular.'
    );
  }
}

export class ObligatoryCoberturaCantBeDeselectedError extends AppError {
  constructor(codigoCobertura: string) {
    super(
      422,
      'ObligatoryCoberturaCantBeDeselected',
      `La cobertura '${codigoCobertura}' es obligatoria y no puede ser deseleccionada.`,
      { codigoCobertura }
    );
  }
}

export class InvalidQuoteStateTransitionError extends AppError {
  constructor(currentState: string, attemptedOperation: string) {
    super(
      422,
      'InvalidQuoteStateTransition',
      `La operación '${attemptedOperation}' no es válida para el estado actual '${currentState}'.`,
      { currentState, attemptedOperation }
    );
  }
}

export class CatalogServiceUnavailableError extends AppError {
  constructor() {
    super(
      503,
      'CatalogServiceUnavailable',
      'El servicio de catálogos no está disponible temporalmente.'
    );
  }
}
