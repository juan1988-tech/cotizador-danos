import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import { apiClient } from '../../../shared/services/apiClient';
import { useApi } from '../../../shared/hooks/useApi';

describe('useApi', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(apiClient);
  });

  afterEach(() => {
    mock.restore();
    vi.clearAllMocks();
  });

  // ─── Happy Path ──────────────────────────────────────────────────────────

  it('starts with null data, no error, and loading=false', () => {
    mock.onGet('/quotes').reply(200, []);
    const { result } = renderHook(() => useApi({ url: '/quotes' }));

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('fetches data and sets it when execute() is called', async () => {
    mock.onGet('/quotes/1').reply(200, { id: 1, status: 'draft' });
    const { result } = renderHook(() => useApi<{ id: number; status: string }>({ url: '/quotes/1' }));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.data).toEqual({ id: 1, status: 'draft' });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('returns data from execute()', async () => {
    mock.onGet('/quotes/1').reply(200, { id: 1 });
    const { result } = renderHook(() => useApi<{ id: number }>({ url: '/quotes/1' }));

    let returned: { id: number } | null = null;
    await act(async () => {
      returned = await result.current.execute();
    });

    expect(returned).toEqual({ id: 1 });
  });

  it('sets loading to true while request is in flight', async () => {
    let resolveRequest!: (value: unknown) => void;
    mock.onGet('/quotes').reply(() => new Promise((resolve) => { resolveRequest = resolve; }));

    const { result } = renderHook(() => useApi({ url: '/quotes' }));

    act(() => {
      result.current.execute();
    });

    await waitFor(() => expect(result.current.loading).toBe(true));

    act(() => resolveRequest([200, []]));
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  // ─── immediate option ─────────────────────────────────────────────────────

  it('auto-fetches when immediate=true', async () => {
    mock.onGet('/quotes').reply(200, [{ id: 1 }]);
    const { result } = renderHook(() =>
      useApi<{ id: number }[]>({ url: '/quotes', immediate: true })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual([{ id: 1 }]);
  });

  // ─── Error Path ───────────────────────────────────────────────────────────

  it('sets error and returns null when request fails', async () => {
    mock.onGet('/quotes/999').reply(500, { message: 'Internal Error' });
    const { result } = renderHook(() => useApi({ url: '/quotes/999' }));

    let returned: unknown;
    await act(async () => {
      returned = await result.current.execute();
    });

    expect(returned).toBeNull();
    expect(result.current.error).not.toBeNull();
    expect(result.current.data).toBeNull();
  });

  // ─── Override on execute() ────────────────────────────────────────────────

  it('uses override url when passed to execute()', async () => {
    mock.onGet('/quotes/2').reply(200, { id: 2 });
    const { result } = renderHook(() => useApi<{ id: number }>({ url: '/quotes/1' }));

    await act(async () => {
      await result.current.execute({ url: '/quotes/2' });
    });

    expect(result.current.data).toEqual({ id: 2 });
  });

  it('uses override method when passed to execute()', async () => {
    mock.onPost('/quotes').reply(201, { id: 3 });
    const { result } = renderHook(() => useApi<{ id: number }>({ url: '/quotes', method: 'get' }));

    await act(async () => {
      await result.current.execute({ method: 'post' });
    });

    expect(result.current.data).toEqual({ id: 3 });
  });

  // ─── Default method ───────────────────────────────────────────────────────

  it('defaults to GET method when method is not specified', async () => {
    mock.onGet('/quotes').reply(200, []);
    const { result } = renderHook(() => useApi({ url: '/quotes' }));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.data).toEqual([]);
  });
});
