import { apiClient } from '../../../shared/services/apiClient';
import type {
  CalculateRequest,
  CalculateResponse,
  GetCoverageOptionsResponse,
  PutCoverageOptionsRequest,
  PutCoverageOptionsResponse,
} from '../types/calculation.types';

const getBasePath = (folio: string) => `/api/v1/quotes/${folio}`;

export async function getCoverageOptions(
  folio: string
): Promise<GetCoverageOptionsResponse['data']> {
  const response = await apiClient.get<GetCoverageOptionsResponse>(
    `${getBasePath(folio)}/coverage-options`
  );
  return response.data.data;
}

export async function putCoverageOptions(
  folio: string,
  data: PutCoverageOptionsRequest
): Promise<PutCoverageOptionsResponse['data']> {
  const response = await apiClient.put<PutCoverageOptionsResponse>(
    `${getBasePath(folio)}/coverage-options`,
    data
  );
  return response.data.data;
}

export async function calculatePremium(
  folio: string,
  data: CalculateRequest
): Promise<CalculateResponse['data']> {
  const response = await apiClient.post<CalculateResponse>(
    `${getBasePath(folio)}/calculate`,
    data
  );
  return response.data.data;
}
