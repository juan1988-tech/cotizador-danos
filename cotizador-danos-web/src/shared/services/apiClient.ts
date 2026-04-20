import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { OptimisticLockError, NotFoundError } from '../utils/errors';
import { applyRetryInterceptor } from './queryClient';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// Interceptor para manejo de errores
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 409) {
      // Optimistic lock error
      throw new OptimisticLockError(error.response.data.error);
    }
    if (error.response?.status === 404) {
      throw new NotFoundError(error.response.data.error);
    }
    throw error;
  }
);

applyRetryInterceptor(apiClient);
