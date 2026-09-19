import { apiClient } from "./client";
import type { CompanyResponse, CreateCompany, RenameCompany } from "../types";

export async function createCompany(payload: CreateCompany): Promise<CompanyResponse> {
  const { data } = await apiClient.post<CompanyResponse>("/Create_company", payload);
  return data;
}

export async function viewCompanies(): Promise<CompanyResponse[]> {
  const { data } = await apiClient.get<CompanyResponse[]>("/View_company");
  return data;
}

export async function renameCompany(
  idCompany: number,
  payload: RenameCompany
): Promise<CompanyResponse> {
  const { data } = await apiClient.patch<CompanyResponse>(
    `/rename_company/${idCompany}`,
    payload
  );
  return data;
}
