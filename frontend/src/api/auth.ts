import { apiClient } from "./client";
import type { AuthResponse, ResponseUser, RegisterOnboarding, CompanyResponse } from "../types";

export async function authenticateWithTelegram(initData: string): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/auth/telegram-webapp", {
    init_data: initData,
  });
  return data;
}

export async function completeOnboarding(
  payload: RegisterOnboarding
): Promise<CompanyResponse> {
  const { data } = await apiClient.post<CompanyResponse>("/auth/onboarding", payload);
  return data;
}

export async function getCurrentUser(): Promise<ResponseUser> {
  const { data } = await apiClient.get<ResponseUser>("/users/me");
  return data;
}
