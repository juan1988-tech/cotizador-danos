import { apiClient } from '../../../shared/services/apiClient';
import type {
  GetLocationsResponse,
  PatchLocationRequest,
  PatchLocationResponse,
  PostLayoutRequest,
  PostLayoutResponse,
  PutLocationsRequest,
  UbicacionResumen,
} from '../types/location.types';

const getBasePath = (folio: string) => `/api/v1/quotes/${folio}`;

export async function postLayout(
  folio: string,
  data: PostLayoutRequest
): Promise<PostLayoutResponse['data']> {
  const response = await apiClient.post<PostLayoutResponse>(
    `${getBasePath(folio)}/layout`,
    data
  );
  return response.data.data;
}

export async function getLocations(folio: string): Promise<UbicacionResumen[]> {
  const response = await apiClient.get<GetLocationsResponse>(
    `${getBasePath(folio)}/locations`
  );
  return response.data.data.ubicaciones;
}

export async function putLocations(
  folio: string,
  data: PutLocationsRequest
): Promise<void> {
  await apiClient.put(`${getBasePath(folio)}/locations`, data);
}

export async function patchLocation(
  folio: string,
  index: number,
  data: PatchLocationRequest
): Promise<UbicacionResumen> {
  const response = await apiClient.patch<PatchLocationResponse>(
    `${getBasePath(folio)}/locations/${index}`,
    data
  );
  return response.data.data;
}
