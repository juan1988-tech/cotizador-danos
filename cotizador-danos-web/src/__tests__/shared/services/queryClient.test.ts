import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { applyRetryInterceptor } from '../../../shared/services/queryClient';

describe('applyRetryInterceptor', () => {
  let client: ReturnType<typeof axios.create>;
  let mock: MockAdapter;

  beforeEach(() => {
    client = axios.create();
    mock = new MockAdapter(client);
    applyRetryInterceptor(client);
  });

  afterEach(() => {
    mock.restore();
  });

  // ─── Happy Path ────────────────────────────────────────────────────────

  it('passes through a successful GET response without modification', async () => {
    mock.onGet('/data').reply(200, { value: 42 });

    const response = await client.get('/data');

    expect(response.status).toBe(200);
    expect(response.data).toEqual({ value: 42 });
  });

  // ─── Retry on safe methods ─────────────────────────────────────────────

  it('retries a failed GET request once and resolves when second attempt succeeds', async () => {
    mock.onGet('/data').replyOnce(500).onGet('/data').reply(200, { value: 'ok' });

    const response = await client.get('/data');

    expect(response.status).toBe(200);
    expect(response.data).toEqual({ value: 'ok' });
  }, 5000);

  it('retries a failed HEAD request once and resolves when second attempt succeeds', async () => {
    mock.onHead('/health').replyOnce(503).onHead('/health').reply(200);

    const response = await client.head('/health');

    expect(response.status).toBe(200);
  }, 5000);

  it('retries a failed OPTIONS request once and resolves when second attempt succeeds', async () => {
    mock.onOptions('/resource').replyOnce(503).onOptions('/resource').reply(204);

    const response = await client.options('/resource');

    expect(response.status).toBe(204);
  }, 5000);

  // ─── Max retries exhausted ─────────────────────────────────────────────

  it('rejects after exhausting MAX_RETRIES (1) on a GET request', async () => {
    mock.onGet('/data').reply(500);

    await expect(client.get('/data')).rejects.toMatchObject({ isAxiosError: true });
  }, 5000);

  // ─── Unsafe methods — no retry ─────────────────────────────────────────

  it('does not retry a failed POST request', async () => {
    mock.onPost('/data').replyOnce(500).onPost('/data').reply(200, { created: true });

    await expect(client.post('/data', {})).rejects.toThrow();
  });

  it('does not retry a failed PUT request', async () => {
    mock.onPut('/data/1').replyOnce(500).onPut('/data/1').reply(200);

    await expect(client.put('/data/1', {})).rejects.toThrow();
  });

  it('does not retry a failed DELETE request', async () => {
    mock.onDelete('/data/1').replyOnce(500).onDelete('/data/1').reply(204);

    await expect(client.delete('/data/1')).rejects.toThrow();
  });

  // ─── Edge Cases ────────────────────────────────────────────────────────

  it('rejects immediately when the error has no config object', async () => {
    const interceptorFn = (client.interceptors.response as any).handlers.at(-1)?.rejected;
    const errorWithoutConfig = new Error('no config');

    if (interceptorFn) {
      await expect(interceptorFn(errorWithoutConfig)).rejects.toThrow('no config');
    }
  });
});
