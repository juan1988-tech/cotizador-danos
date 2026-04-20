export class AppError extends Error {
  statusCode: number;
  errorCode: string;
  details?: unknown;

  constructor(message: string, statusCode: number, errorCode: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class QuoteNotFoundError extends AppError {
  constructor(folio: string) {
    super(`Quote '${folio}' not found`, 404, 'QuoteNotFound');
  }
}

export class LocationNotFoundError extends AppError {
  constructor(indice: number) {
    super(`Location at index ${indice} not found`, 404, 'LocationNotFound');
  }
}

export class VersionConflictError extends AppError {
  constructor(expectedVersion: number, currentVersion: number) {
    super(
      `Version conflict: expected ${expectedVersion}, current is ${currentVersion}`,
      409,
      'VersionConflict',
      { expectedVersion, currentVersion },
    );
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'ValidationError', details);
  }
}

export class MissingRequiredFieldError extends AppError {
  constructor(field: string) {
    super(`Missing required field: ${field}`, 400, 'MissingRequiredField', { field });
  }
}

export class ExternalValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 422, 'ExternalValidationError', details);
  }
}

export class NoValidLocationsError extends AppError {
  constructor(ubicacionesIncompletas: number[]) {
    super(
      'No valid locations available for calculation',
      422,
      'NoValidLocationsForCalculation',
      { ubicacionesIncompletas },
    );
  }
}

export class NoCoverageSelectedError extends AppError {
  constructor() {
    super('No coverage has been selected', 422, 'NoCoverageSelected');
  }
}

export class ObligatoryCoberturaCantBeDeselectedError extends AppError {
  constructor(codigoCobertura: string) {
    super(
      `Obligatory coverage '${codigoCobertura}' cannot be deselected`,
      422,
      'ObligatoryCoberturaCantBeDeselected',
      { codigoCobertura },
    );
  }
}

export class CatalogServiceUnavailableError extends AppError {
  constructor() {
    super('Catalog service is unavailable', 503, 'CatalogServiceUnavailable');
  }
}

export class InvalidQuoteStateTransitionError extends AppError {
  constructor(currentState: string, attemptedOperation: string) {
    super(
      `Cannot perform '${attemptedOperation}' from state '${currentState}'`,
      422,
      'InvalidQuoteStateTransition',
      { currentState, attemptedOperation },
    );
  }
}
