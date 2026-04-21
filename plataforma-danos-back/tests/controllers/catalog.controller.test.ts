/// <reference types="jest" />

import { Request, Response, NextFunction } from 'express';
import { getAgents, getSubscribers, getGiros } from '../../src/controllers/CatalogController';
import { ExternalCoreService } from '../../src/services/ExternalCoreService';
import { CatalogServiceUnavailableError } from '../../src/utils/errors';

jest.mock('../../src/services/ExternalCoreService');

function buildRequest(): Request {
  return {
    params: {},
    query: {},
    body: {},
  } as unknown as Request;
}

function buildResponse(): Response {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };

  return res as unknown as Response;
}

describe('CatalogController', () => {
  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    next = jest.fn();
  });

  it('given_getAgents_when_invoked_then_calls_next_with_not_implemented_error', async () => {
    const req = buildRequest();
    const res = buildResponse();

    await getAgents(req, res, next);

    const err = next.mock.calls[0][0] as unknown as Error;
    expect(next).toHaveBeenCalledTimes(1);
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('getAgents not yet implemented');
  });

  it('given_getSubscribers_when_invoked_then_calls_next_with_not_implemented_error', async () => {
    const req = buildRequest();
    const res = buildResponse();

    await getSubscribers(req, res, next);

    const err = next.mock.calls[0][0] as unknown as Error;
    expect(next).toHaveBeenCalledTimes(1);
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('getSubscribers not yet implemented');
  });

  it('given_getGiros_when_service_returns_data_then_responds_200_with_mapped_giros', async () => {
    (ExternalCoreService.prototype.getGiros as jest.Mock).mockResolvedValueOnce({
      data: [{ id: 'G001', nombre: 'Comercio general', claveIncendio: 'COM' }],
      total: 1,
    });

    const req = buildRequest();
    const res = buildResponse();

    await getGiros(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      data: [{ id: 'G001', descripcion: 'Comercio general', claveIncendio: 'COM' }],
      total: 1,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('given_catalog_unavailable_when_getGiros_then_calls_next_with_error', async () => {
    const error = new CatalogServiceUnavailableError();
    (ExternalCoreService.prototype.getGiros as jest.Mock).mockRejectedValueOnce(error);

    const req = buildRequest();
    const res = buildResponse();

    await getGiros(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
