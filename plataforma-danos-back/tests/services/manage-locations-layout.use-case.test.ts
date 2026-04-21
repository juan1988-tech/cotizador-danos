/// <reference types="jest" />

import {
  ManageLocationsLayoutUseCase,
  ManageLocationsLayoutInput,
} from '../../src/services/ManageLocationsLayoutUseCase';
import {
  IQuoteRepository,
  TransactionScope,
} from '../../src/repositories/IQuoteRepository';
import { Quote, QuoteState } from '../../src/models/Quote';
import {
  InvalidQuoteStateTransitionError,
  MissingRequiredFieldError,
  QuoteNotFoundError,
  ValidationError,
} from '../../src/utils/errors';

function buildQuote(overrides: Partial<Quote> = {}): Quote {
  return {
    numeroFolio: 'COT-2026-000001',
    estadoCotizacion: 'DATOS_GENERALES_COMPLETOS',
    datosAsegurado: null,
    configuracionLayout: null,
    opcionesCobertura: null,
    version: 3,
    fechaCreacion: new Date('2026-01-01T00:00:00.000Z'),
    fechaUltimaActualizacion: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function buildInput(overrides: Partial<ManageLocationsLayoutInput> = {}): ManageLocationsLayoutInput {
  return {
    folio: 'COT-2026-000001',
    tipoLayout: 'UNIFORME',
    numeroUbicaciones: 3,
    version: 3,
    ...overrides,
  };
}

describe('ManageLocationsLayoutUseCase', () => {
  let quoteRepository: jest.Mocked<IQuoteRepository>;
  let useCase: ManageLocationsLayoutUseCase;
  let txScope: TransactionScope;
  let rawQuery: jest.Mock;
  let update: jest.Mock;

  beforeEach(() => {
    rawQuery = jest.fn();
    update = jest.fn();

    txScope = {
      quotes: {
        findByFolio: jest.fn(),
        save: jest.fn(),
        update: update as unknown as IQuoteRepository['update'],
        withTransaction: jest.fn(),
      },
      rawQuery: rawQuery as TransactionScope['rawQuery'],
    };

    quoteRepository = {
      findByFolio: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      withTransaction: jest.fn(async (fn) => fn(txScope)),
    } as unknown as jest.Mocked<IQuoteRepository>;

    useCase = new ManageLocationsLayoutUseCase(quoteRepository);
  });

  it('given_valid_input_when_execute_then_updates_layout_and_adds_missing_slots', async () => {
    const input = buildInput({ numeroUbicaciones: 3 });
    const now = new Date('2026-04-20T00:00:00.000Z');

    quoteRepository.findByFolio.mockResolvedValue(buildQuote({ estadoCotizacion: 'DATOS_GENERALES_COMPLETOS' }));
    rawQuery
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    update.mockResolvedValue({
      ...buildQuote({
        estadoCotizacion: 'UBICACIONES_CONFIGURADAS' as QuoteState,
        configuracionLayout: { tipoLayout: 'UNIFORME', numeroUbicaciones: 3 },
        version: 4,
        fechaUltimaActualizacion: now,
      }),
    });

    const result = await useCase.execute(input);

    expect(quoteRepository.findByFolio).toHaveBeenCalledWith(input.folio);
    expect(update).toHaveBeenCalledWith(
      input.folio,
      {
        configuracionLayout: { tipoLayout: 'UNIFORME', numeroUbicaciones: 3 },
        estadoCotizacion: 'UBICACIONES_CONFIGURADAS',
      },
      input.version,
    );
    expect(rawQuery).toHaveBeenCalledTimes(3);
    expect(result.estadoCotizacion).toBe('UBICACIONES_CONFIGURADAS');
    expect(result.configuracionLayout.numeroUbicaciones).toBe(3);
  });

  it('given_quote_not_found_when_execute_then_throws_quote_not_found_error', async () => {
    quoteRepository.findByFolio.mockResolvedValue(null);

    await expect(useCase.execute(buildInput())).rejects.toBeInstanceOf(QuoteNotFoundError);
  });

  it('given_quote_in_en_edicion_when_execute_then_throws_invalid_state_error', async () => {
    quoteRepository.findByFolio.mockResolvedValue(buildQuote({ estadoCotizacion: 'EN_EDICION' }));

    await expect(useCase.execute(buildInput())).rejects.toBeInstanceOf(
      InvalidQuoteStateTransitionError,
    );
  });

  it('given_missing_version_when_execute_then_throws_missing_required_field_error', async () => {
    const input = buildInput({ version: undefined as unknown as number });

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(MissingRequiredFieldError);
  });

  it('given_invalid_layout_type_when_execute_then_throws_validation_error', async () => {
    const input = buildInput({ tipoLayout: 'MIXTO' });

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(ValidationError);
  });

  it('given_out_of_range_numero_ubicaciones_when_execute_then_throws_validation_error', async () => {
    const input = buildInput({ numeroUbicaciones: 0 });

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(ValidationError);
  });

  it('given_reconfiguration_from_calculada_when_execute_then_clears_previous_premium', async () => {
    const input = buildInput({ numeroUbicaciones: 1 });

    quoteRepository.findByFolio.mockResolvedValue(buildQuote({ estadoCotizacion: 'CALCULADA' }));
    rawQuery
      .mockResolvedValueOnce({ rows: [{ total: '2' }] })
      .mockResolvedValueOnce({ rows: [] });

    update.mockResolvedValue(
      buildQuote({
        estadoCotizacion: 'COBERTURAS_SELECCIONADAS',
        configuracionLayout: { tipoLayout: 'UNIFORME', numeroUbicaciones: 1 },
        primasPorUbicacion: null,
        version: 4,
      }),
    );

    await useCase.execute(input);

    const changes = update.mock.calls[0][1] as Partial<Quote>;
    expect(changes.estadoCotizacion).toBe('COBERTURAS_SELECCIONADAS');
    expect(changes.primasPorUbicacion).toBeNull();
  });
});
