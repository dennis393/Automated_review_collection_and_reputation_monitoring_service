import { apiClient } from "./client";
import type { CreateCredential, CredentialResponse, UpdateCredential } from "../types";

export async function createCredential(
  payload: CreateCredential
): Promise<CredentialResponse> {
  const { data } = await apiClient.post<CredentialResponse>("/create_credential", payload);
  return data;
}

export async function getCredentials(): Promise<CredentialResponse[]> {
  const { data } = await apiClient.get<CredentialResponse[]>("/get_credential");
  return data;
}

export async function updateCredentialToken(
  idMarketplaces: number,
  payload: UpdateCredential
): Promise<string> {
  const { data } = await apiClient.patch<string>(
    `/update_token_marketpalces/${idMarketplaces}`,
    payload
  );
  return data;
}

export async function disconnectMarketplace(idMarketplace: number): Promise<string> {
  const { data } = await apiClient.delete<string>(
    `/disconnect_marketplace/${idMarketplace}`
  );
  return data;
}
