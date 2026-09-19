import { apiClient } from "./client";
import type { ResponseUser, Token, UserCreate } from "../types";

export async function registerUser(payload: UserCreate): Promise<ResponseUser> {
  const { data } = await apiClient.post<ResponseUser>("/register", payload);
  return data;
}

export async function login(username: string, password: string): Promise<Token> {
  const form = new URLSearchParams();
  form.set("grant_type", "password");
  form.set("username", username);
  form.set("password", password);
  form.set("scope", "");
  const { data } = await apiClient.post<Token>("/token", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return data;
}

export async function getCurrentUser(): Promise<ResponseUser> {
  const { data } = await apiClient.get<ResponseUser>("/users/me");
  return data;
}
