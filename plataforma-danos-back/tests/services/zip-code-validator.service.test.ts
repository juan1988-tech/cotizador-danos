/// <reference types="jest" />

import { Pool } from 'pg';
import { ZipCodeValidator } from '../../src/services/ZipCodeValidator';

describe('ZipCodeValidator', () => {
  let queryMock: jest.Mock;
  let db: Pool;
  let service: ZipCodeValidator;

  beforeEach(() => {
    queryMock = jest.fn();
    db = { query: queryMock } as unknown as Pool;
    service = new ZipCodeValidator(db);
  });

  it('given_existing_active_postal_code_when_findByCodigoPostal_then_returns_zip_code_info', async () => {
    queryMock.mockResolvedValue({
      rows: [
        {
          codigo_postal: '06700',
          municipio: 'Cuauhtemoc',
          estado: 'CDMX',
          ciudad: 'Ciudad de Mexico',
        },
      ],
    });

    const result = await service.findByCodigoPostal('06700');

    expect(queryMock).toHaveBeenCalledTimes(1);
    expect(queryMock.mock.calls[0][0]).toContain('FROM catalogo_cp_zonas');
    expect(queryMock.mock.calls[0][1]).toEqual(['06700']);
    expect(result).toEqual({
      codigoPostal: '06700',
      municipio: 'Cuauhtemoc',
      estado: 'CDMX',
      ciudad: 'Ciudad de Mexico',
    });
  });

  it('given_non_existing_or_inactive_postal_code_when_findByCodigoPostal_then_returns_null', async () => {
    queryMock.mockResolvedValue({ rows: [] });

    const result = await service.findByCodigoPostal('99999');

    expect(result).toBeNull();
  });

  it('given_database_failure_when_findByCodigoPostal_then_propagates_error', async () => {
    queryMock.mockRejectedValue(new Error('database unavailable'));

    await expect(service.findByCodigoPostal('06700')).rejects.toThrow('database unavailable');
  });
});
