import { apiClient } from "./client";
import type { CreateFilial, FilialResponse, UpdateFilial } from "../types";

export async function addFilial(payload: CreateFilial): Promise<FilialResponse> {
  const { data } = await apiClient.post<FilialResponse>("/add_filial", payload);
  return data;
}

export async function getFilials(): Promise<FilialResponse[]> {
  const { data } = await apiClient.get<FilialResponse[]>("/get_filials");
  return data;
}

export async function updateFilial(
  idFilial: number,
  payload: UpdateFilial
): Promise<FilialResponse> {
  const { data } = await apiClient.patch<FilialResponse>(
    `/update_name_or_address/${idFilial}`,
    payload
  );
  return data;
}

export async function deleteFilial(idFilial: number): Promise<string> {
  const { data } = await apiClient.delete<string>(`/delete_filial/${idFilial}`);
  return data;
}
