import { apiClient } from "./client";
import type { CreateSource, SourseResponse, UpdateSourse } from "../types";

export async function createSource(payload: CreateSource): Promise<SourseResponse> {
  const { data } = await apiClient.post<SourseResponse>("/sources", payload);
  return data;
}

export async function getSourses(filialId: number): Promise<SourseResponse[]> {
  const { data } = await apiClient.get<SourseResponse[]>(`/get_sourses/${filialId}`);
  return data;
}

export async function updateSourse(
  idSourse: number,
  payload: UpdateSourse
): Promise<SourseResponse> {
  const { data } = await apiClient.patch<SourseResponse>(
    `/update_url_or_active_filial/${idSourse}`,
    payload
  );
  return data;
}

export async function deleteSourse(idSourse: number): Promise<string> {
  const { data } = await apiClient.delete<string>(`/delete_sourse/${idSourse}`);
  return data;
}
