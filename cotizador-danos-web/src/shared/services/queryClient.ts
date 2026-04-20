import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 500;
const SAFE_METHODS = new Set(['get', 'head', 'options']);

interface RetryConfig extends InternalAxiosRequestConfig {
  _retryCount?: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function applyRetryInterceptor(client: AxiosInstance): void {
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const config = error.config as RetryConfig | undefined;

      if (!config) return Promise.reject(error);

      const method = (config.method ?? '').toLowerCase();
      const isRetryable = SAFE_METHODS.has(method);

      if (!isRetryable) return Promise.reject(error);

      config._retryCount = (config._retryCount ?? 0) + 1;

      if (config._retryCount > MAX_RETRIES) return Promise.reject(error);

      await sleep(RETRY_DELAY_MS * config._retryCount);

      return client(config);
    }
  );
}