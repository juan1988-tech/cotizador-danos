import { apiClient } from '../../../shared/services/apiClient';
import type {
  CreateQuoteResponse,
  GetQuoteResponse,
  ListQuotesResponse,
  PatchGeneralDataRequest,
  PatchGeneralDataResponse,
  Quote,
  QuoteSummary,
} from '../types/quote.types';

const BASE_PATH = '/api/v1/quotes';

/**
 * Crea una nueva cotización obteniendo un folio único
 */
export async function createQuote(): Promise<CreateQuoteResponse['data']> {
  const response = await apiClient.post<CreateQuoteResponse>(BASE_PATH);
  
  if(!response.data?.data?.numeroFolio) {
    console.log("Fallen")
  }




  return response.data.data;
}

/**
 * Obtiene una cotización por folio
 */
export async function getQuote(folio: string): Promise<Quote> {
  const response = await apiClient.get<GetQuoteResponse>(`${BASE_PATH}/${folio}`);
  return response.data.data;
}

/**
 * Actualiza los datos generales del asegurado (PATCH parcial)
 */
export async function patchGeneralData(
  folio: string,
  data: PatchGeneralDataRequest
): Promise<PatchGeneralDataResponse['data']> {
  const response = await apiClient.patch<PatchGeneralDataResponse>(
    `${BASE_PATH}/${folio}/general-data`,
    data
  );
  return response.data.data;
}

/**
 * Lista todas las cotizaciones como resumen (proyección ligera)
 */
export async function listQuotes(): Promise<QuoteSummary[]> {
  const response = await apiClient.get<ListQuotesResponse>(BASE_PATH);
  return response.data.data;
}
