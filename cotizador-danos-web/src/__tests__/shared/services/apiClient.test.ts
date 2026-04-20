import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import { apiClient } from '../../../shared/services/apiClient';
import { OptimisticLockError, NotFoundError } from '../../../shared/utils/errors';

describe('apiClient — error interceptor', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(apiClient);
  });

  afterEach(() => {
    mock.restore();
  });

  // ─── Happy Path ────────────────────────────────────────────────────────

  it('returns response data when request succeeds', async () => {
    mock.onGet('/quotes/1').reply(200, { id: 1, status: 'draft' });

    const response = await apiClient.get('/quotes/1');

    expect(response.status).toBe(200);
    expect(response.data).toEqual({ id: 1, status: 'draft' });
  });

  // ─── Error Path: 409 Conflict ──────────────────────────────────────────

  it('throws OptimisticLockError when server responds with 409', async () => {
    mock.onPut('/quotes/1').reply(409, { error: 'Version conflict' });

    await expect(apiClient.put('/quotes/1', {})).rejects.toThrow(OptimisticLockError);
  });

  it('includes the server error message in OptimisticLockError', async () => {
    mock.onPut('/quotes/1').reply(409, { error: 'Version conflict' });

    await expect(apiClient.put('/quotes/1', {})).rejects.toThrow('Version conflict');
  });

  // ─── Error Path: 404 Not Found ─────────────────────────────────────────

  it('throws NotFoundError when server responds with 404', async () => {
    mock.onGet('/quotes/999').reply(404, { error: 'Quote not found' });

    await expect(apiClient.get('/quotes/999')).rejects.toThrow(NotFoundError);
  });

  it('includes the server error message in NotFoundError', async () => {
    mock.onGet('/quotes/999').reply(404, { error: 'Quote not found' });

    await expect(apiClient.get('/quotes/999')).rejects.toThrow('Quote not found');
  });

  // ─── Error Path: Other HTTP errors ────────────────────────────────────

  it('rethrows the original error for non-409 / non-404 status codes', async () => {
    mock.onPost('/quotes').reply(500, { error: 'Internal Server Error' });

    await expect(apiClient.post('/quotes', {})).rejects.toMatchObject({
      isAxiosError: true,
      response: { status: 500 },
    });
  });

  // ─── Edge Cases ────────────────────────────────────────────────────────

  it('throws OptimisticLockError with empty message when response body has no error field', async () => {
    mock.onPut('/quotes/1').reply(409, {});

    await expect(apiClient.put('/quotes/1', {})).rejects.toThrow(OptimisticLockError);
  });

  it('throws NotFoundError with empty message when response body has no error field', async () => {
    mock.onGet('/quotes/999').reply(404, {});

    await expect(apiClient.get('/quotes/999')).rejects.toThrow(NotFoundError);
  });
});
