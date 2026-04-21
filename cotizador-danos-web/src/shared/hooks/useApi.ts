
import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '../services/apiClient';

type ApiMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

interface UseApiOptions<TReq = unknown> {
	method?: ApiMethod;
	url: string;
	immediate?: boolean;
	data?: TReq;
	params?: Record<string, string | number | boolean>;
	headers?: Record<string, string>;
}

interface UseApiResult<TRes, TReq> {
	data: TRes | null;
	error: unknown;
	loading: boolean;
	execute: (override?: Partial<UseApiOptions<TReq>>) => Promise<TRes | null>;
}

export function useApi<TRes, TReq = unknown>(
	options: UseApiOptions<TReq>
): UseApiResult<TRes, TReq> {
	const { method = 'get', url, immediate = false, data, params, headers } = options;
	const [response, setResponse] = useState<TRes | null>(null);
	const [error, setError] = useState<unknown>(null);
	const [loading, setLoading] = useState(false);

	const execute = useCallback(
		async (override?: Partial<UseApiOptions<TReq>>): Promise<TRes | null> => {
			setLoading(true);
			setError(null);
			try {
				const res = await apiClient.request<TRes>({
					method: override?.method ?? method,
					url: override?.url ?? url,
					data: override?.data ?? data,
					params: override?.params ?? params,
					headers: override?.headers ?? headers,
				});
				setResponse(res.data);
				return res.data;
			} catch (err) {
				setError(err);
				return null;
			} finally {
				setLoading(false);
			}
		},
		[method, url, data, params, headers]
	);

	useEffect(() => {
		if (immediate) {
			// eslint-disable-next-line react-hooks/set-state-in-effect
			execute();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return { data: response, error, loading, execute };
}
