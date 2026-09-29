// Тонкая обёртка над window.Telegram.WebApp — без этого SDK Mini App не отличить от обычного сайта

interface TelegramThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
  section_bg_color?: string;
  destructive_text_color?: string;
}

interface TelegramMainButton {
  text: string;
  isVisible: boolean;
  isActive: boolean;
  setText(text: string): void;
  onClick(cb: () => void): void;
  offClick(cb: () => void): void;
  show(): void;
  hide(): void;
  enable(): void;
  disable(): void;
  showProgress(leaveActive?: boolean): void;
  hideProgress(): void;
}

interface TelegramBackButton {
  isVisible: boolean;
  onClick(cb: () => void): void;
  offClick(cb: () => void): void;
  show(): void;
  hide(): void;
}

interface TelegramWebApp {
  initData: string;
  themeParams: TelegramThemeParams;
  colorScheme: "light" | "dark";
  MainButton: TelegramMainButton;
  BackButton: TelegramBackButton;
  ready(): void;
  expand(): void;
  onEvent(event: string, cb: () => void): void;
  offEvent(event: string, cb: () => void): void;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

export function getWebApp(): TelegramWebApp | null {
  return window.Telegram?.WebApp ?? null;
}

export function getInitData(): string | null {
  const raw = getWebApp()?.initData;
  return raw && raw.length > 0 ? raw : null;
}

// Внутри Telegram initData есть всегда; вне Telegram (например открыли ссылку в обычном
// браузере для отладки) — его нет, и Mini App-логика входа неприменима.
export function isInsideTelegram(): boolean {
  return getInitData() !== null;
}

const THEME_VAR_MAP: Record<keyof TelegramThemeParams, string[]> = {
  bg_color: ["--color-bg", "--background"],
  text_color: ["--color-text", "--foreground"],
  hint_color: ["--color-text-muted", "--muted-foreground"],
  link_color: ["--ring"],
  button_color: ["--color-primary", "--primary"],
  button_text_color: ["--primary-foreground"],
  secondary_bg_color: ["--color-surface", "--card", "--input"],
  section_bg_color: ["--color-surface", "--card"],
  destructive_text_color: ["--color-danger", "--destructive"],
};

// Пробрасываем цвета текущей темы Telegram (light/dark, у каждого юзера свои) в те же
// CSS-переменные, которые уже использует остальной интерфейс — остальные страницы
// перекрашиваются "бесплатно", без переписывания каждой из них.
export function applyTelegramTheme() {
  const webApp = getWebApp();
  if (!webApp) return;

  const root = document.documentElement;
  for (const [key, cssVars] of Object.entries(THEME_VAR_MAP) as [
    keyof TelegramThemeParams,
    string[],
  ][]) {
    const value = webApp.themeParams[key];
    if (!value) continue;
    for (const cssVar of cssVars) {
      root.style.setProperty(cssVar, value);
    }
  }

  root.dataset.theme = webApp.colorScheme;
}

export function initTelegramWebApp() {
  const webApp = getWebApp();
  if (!webApp) return;

  webApp.ready();
  webApp.expand();
  applyTelegramTheme();
  webApp.onEvent("themeChanged", applyTelegramTheme);
}
