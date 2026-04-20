import { IQuoteRepository, TransactionScope } from '../repositories/IQuoteRepository';
import { Quote, QuoteState, LayoutConfig } from '../models/Quote';
import {
  InvalidQuoteStateTransitionError,
  MissingRequiredFieldError,
  QuoteNotFoundError,
  ValidationError,
} from '../utils/errors';

// ─── Constants ────────────────────────────────────────────────────────────────
const VALID_LAYOUT_TYPES = ['UNIFORME', 'PERSONALIZADO'] as const;
type TipoLayout = (typeof VALID_LAYOUT_TYPES)[number];

const MIN_UBICACIONES = 1;
const MAX_UBICACIONES = 50;

// ─── I/O types ────────────────────────────────────────────────────────────────
export interface ManageLocationsLayoutInput {
  folio: string;
  tipoLayout: string;
  numeroUbicaciones: number;
  /** Current version of the quote record — required for optimistic locking. */
  version: number;
}

export interface ManageLocationsLayoutOutput {
  numeroFolio: string;
  estadoCotizacion: QuoteState;
  configuracionLayout: LayoutConfig;
  version: number;
  fechaUltimaActualizacion: Date;
}

// ─── Use case ────────────────────────────────────────────────────────────────
export class ManageLocationsLayoutUseCase {
  constructor(private readonly quoteRepository: IQuoteRepository) {}

  async execute(input: ManageLocationsLayoutInput): Promise<ManageLocationsLayoutOutput> {
    this.validateInput(input);

    // Read before the transaction so we can validate business state
    const quote = await this.quoteRepository.findByFolio(input.folio);
    if (quote === null) throw new QuoteNotFoundError(input.folio);

    // The layout step requires the quote to have completed the general-data step
    if (quote.estadoCotizacion === 'EN_EDICION') {
      throw new InvalidQuoteStateTransitionError(
        quote.estadoCotizacion,
        'configurar layout de ubicaciones',
      );
    }

    return this.quoteRepository.withTransaction(async (scope) => {
      const currentCount = await this.countLocations(scope, input.folio);

      const newLayout: LayoutConfig = {
        tipoLayout: input.tipoLayout,
        numeroUbicaciones: input.numeroUbicaciones,
      };

      const newEstado = this.resolveNewEstado(quote.estadoCotizacion);

      // Build partial changes; clear stale calculation when re-entering from CALCULADA
      const changes: Partial<Quote> = {
        configuracionLayout: newLayout,
        estadoCotizacion: newEstado,
        ...(quote.estadoCotizacion === 'CALCULADA' && { primasPorUbicacion: null }),
      };

      // Optimistic locking: VersionConflictError thrown here if version mismatches
      const updatedQuote = await scope.quotes.update(input.folio, changes, input.version);

      await this.adjustLocations(scope, input.folio, currentCount, input.numeroUbicaciones);

      return {
        numeroFolio: updatedQuote.numeroFolio,
        estadoCotizacion: updatedQuote.estadoCotizacion,
        configuracionLayout: updatedQuote.configuracionLayout as LayoutConfig,
        version: updatedQuote.version,
        fechaUltimaActualizacion: updatedQuote.fechaUltimaActualizacion,
      };
    });
  }

  // ─── Business rule: which state to transition to ───────────────────────────
  private resolveNewEstado(current: QuoteState): QuoteState {
    switch (current) {
      case 'DATOS_GENERALES_COMPLETOS':
        // First time configuring layout: advance to the next state
        return 'UBICACIONES_CONFIGURADAS';
      case 'CALCULADA':
        // Re-configuring layout invalidates a previous calculation
        return 'COBERTURAS_SELECCIONADAS';
      default:
        // UBICACIONES_CONFIGURADAS or COBERTURAS_SELECCIONADAS: retain current state
        return current;
    }
  }

  // ─── Input validation (no DB access) ──────────────────────────────────────
  private validateInput(input: ManageLocationsLayoutInput): void {
    if (input.version == null) {
      throw new MissingRequiredFieldError('version');
    }

    if (!VALID_LAYOUT_TYPES.includes(input.tipoLayout as TipoLayout)) {
      throw new ValidationError(
        `tipoLayout debe ser uno de: ${VALID_LAYOUT_TYPES.join(', ')}`,
        { field: 'tipoLayout', value: input.tipoLayout },
      );
    }

    if (
      !Number.isInteger(input.numeroUbicaciones) ||
      input.numeroUbicaciones < MIN_UBICACIONES ||
      input.numeroUbicaciones > MAX_UBICACIONES
    ) {
      throw new ValidationError(
        `numeroUbicaciones debe ser un entero entre ${MIN_UBICACIONES} y ${MAX_UBICACIONES}`,
        { field: 'numeroUbicaciones', value: input.numeroUbicaciones },
      );
    }
  }

  // ─── Location adjustment (runs inside the open transaction) ───────────────
  private async countLocations(scope: TransactionScope, folio: string): Promise<number> {
    const { rows } = await scope.rawQuery(
      'SELECT COUNT(*) AS total FROM locations WHERE numero_folio = $1',
      [folio],
    );
    const total = rows[0]?.['total'];
    return parseInt(total as string, 10) || 0;
  }

  private async adjustLocations(
    scope: TransactionScope,
    folio: string,
    currentCount: number,
    targetCount: number,
  ): Promise<void> {
    if (targetCount > currentCount) {
      // Add empty location slots at the end (indices are 1-based)
      for (let indice = currentCount + 1; indice <= targetCount; indice++) {
        await scope.rawQuery(
          `INSERT INTO locations (numero_folio, indice_ubicacion)
           VALUES ($1, $2)
           ON CONFLICT (numero_folio, indice_ubicacion) DO NOTHING`,
          [folio, indice],
        );
      }
    } else if (targetCount < currentCount) {
      // Remove location slots beyond the new count
      await scope.rawQuery(
        'DELETE FROM locations WHERE numero_folio = $1 AND indice_ubicacion > $2',
        [folio, targetCount],
      );
    }
    // targetCount === currentCount: no adjustment needed
  }
}
