/// <reference types="jest" />

import { Request, Response, NextFunction } from 'express';
import { getAgents, getSubscribers, getGiros } from '../../src/controllers/CatalogController';

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

  it('given_getGiros_when_invoked_then_calls_next_with_not_implemented_error', async () => {
    const req = buildRequest();
    const res = buildResponse();

    await getGiros(req, res, next);

    const err = next.mock.calls[0][0] as unknown as Error;
    expect(next).toHaveBeenCalledTimes(1);
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('getGiros not yet implemented');
  });
});
