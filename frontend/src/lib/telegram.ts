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
  setHeaderColor?(color: string): void;
  setBackgroundColor?(color: string): void;
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

// Сознательно НЕ подтягиваем цвета из Telegram.WebApp.themeParams — у бренда
// фиксированная бело-синяя палитра (App.css), она не должна зависеть от того,
// какая тема (тёмная/цветная) стоит в личных настройках Telegram у конкретного юзера.
// Дёргаем только то, что не про цвет: сообщаем Telegram фон шапки/фона под свой белый.
export function applyTelegramChrome() {
  const webApp = getWebApp();
  if (!webApp) return;
  webApp.setHeaderColor?.("#ffffff");
  webApp.setBackgroundColor?.("#ffffff");
}

export function initTelegramWebApp() {
  const webApp = getWebApp();
  if (!webApp) return;

  webApp.ready();
  webApp.expand();
  applyTelegramChrome();
}
