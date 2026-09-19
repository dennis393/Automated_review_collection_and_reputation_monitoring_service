import { apiClient } from "./client";

export async function getTelegramToken(): Promise<any> {
  const { data } = await apiClient.get("/telegram/token");
  return data;
}
