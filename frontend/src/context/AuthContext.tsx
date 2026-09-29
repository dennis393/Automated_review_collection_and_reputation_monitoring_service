import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { authenticateWithTelegram, getCurrentUser } from "../api/auth";
import { clearToken, getToken, setToken } from "../api/client";
import { getInitData } from "../lib/telegram";
import type { ResponseUser } from "../types";

type AuthStatus = "loading" | "outside-telegram" | "needs-onboarding" | "ready" | "error";

interface AuthContextValue {
  user: ResponseUser | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ResponseUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const refreshUser = useCallback(async () => {
    const me = await getCurrentUser();
    setUser(me);
  }, []);

  // Второй параметр onboardingDone — чтобы после сабмита формы регистрации
  // сразу перевести юзера на главный экран, не дожидаясь нового цикла эффекта
  const completeOnboarding = useCallback(async () => {
    await refreshUser();
    setStatus("ready");
  }, [refreshUser]);

  useEffect(() => {
    async function boot() {
      const initData = getInitData();

      if (!initData) {
        // Открыли не из Telegram (например, напрямую по ссылке в браузере при отладке)
        setStatus("outside-telegram");
        return;
      }

      try {
        // Токен уже мог остаться валидным с прошлой сессии — но initData
        // Telegram выдаёт заново при каждом открытии Mini App, поэтому
        // проще и надёжнее всегда обменивать его на свежий JWT
        const auth = await authenticateWithTelegram(initData);
        setToken(auth.access_token);
        // Юзер к этому моменту уже существует в БД (создан на /auth/telegram-webapp,
        // даже "голый", без компании) — грузим профиль сразу, он пригодится
        // и на экране онбординга (поприветствовать по имени), и на главном
        await refreshUser();
        setStatus(auth.needs_onboarding ? "needs-onboarding" : "ready");
      } catch {
        clearToken();
        setStatus("error");
      }
    }

    boot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        isAuthenticated: status === "ready" && !!getToken(),
        refreshUser,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
