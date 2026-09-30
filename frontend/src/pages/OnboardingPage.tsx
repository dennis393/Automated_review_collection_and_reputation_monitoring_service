import { useState } from "react";
import { Input } from "@/components/ui/input";
import Alert from "@/components/Alert";
import BrandMark from "@/components/BrandMark";
import { completeOnboarding as submitOnboarding } from "@/api/auth";
import { extractErrorMessage } from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import { isInsideTelegram } from "@/lib/telegram";
import { useMainButton } from "@/lib/useMainButton";
import type { RegisterOnboarding } from "@/types";

const LANGUAGES: { code: RegisterOnboarding["language_code"]; label: string }[] = [
  { code: "ru", label: "Русский" },
  { code: "uz", label: "O'zbekcha" },
];

export default function OnboardingPage() {
  const { user, completeOnboarding } = useAuth();
  const [companyName, setCompanyName] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [languageCode, setLanguageCode] = useState<RegisterOnboarding["language_code"]>("ru");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = companyName.trim().length > 0 && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitOnboarding({
        company_name: companyName.trim(),
        company_description: companyDescription.trim(),
        language_code: languageCode,
      });
      await completeOnboarding();
    } catch (err) {
      setError(extractErrorMessage(err));
      setSubmitting(false);
    }
  }

  useMainButton({
    text: "Начать мониторинг",
    onClick: handleSubmit,
    enabled: canSubmit,
    loading: submitting,
  });

  const firstName = user?.full_name?.split(" ")[0];

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 pb-28 pt-10">
      <div className="mb-6">
        <BrandMark size={48} />
      </div>

      <h1 className="text-[22px] font-semibold leading-tight" style={{ color: "var(--color-text)" }}>
        {firstName ? `Привет, ${firstName}` : "Привет"}
      </h1>
      <p className="mt-1.5 text-[15px]" style={{ color: "var(--color-text-muted)" }}>
        Расскажи о компании — и мы начнём следить за отзывами на картах и маркетплейсах.
      </p>

      <div className="mt-8 flex flex-col gap-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium" style={{ color: "var(--color-text-muted)" }}>
            Название компании
          </span>
          <Input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Например, «Кофейня на Чиланзаре»"
            autoFocus
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium" style={{ color: "var(--color-text-muted)" }}>
            Чем занимается компания
          </span>
          <textarea
            value={companyDescription}
            onChange={(e) => setCompanyDescription(e.target.value)}
            placeholder="Пара предложений — это увидит ИИ при написании ответов клиентам"
            rows={3}
            className="w-full resize-none rounded-md border px-3 py-2 text-[15px] outline-none focus-visible:ring-[3px]"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-surface)",
              color: "var(--color-text)",
            }}
          />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium" style={{ color: "var(--color-text-muted)" }}>
            Язык интерфейса
          </span>
          <div className="flex gap-2">
            {LANGUAGES.map((lang) => {
              const active = lang.code === languageCode;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setLanguageCode(lang.code)}
                  className="flex-1 rounded-md border px-3 py-2 text-[14px] font-medium transition-colors"
                  style={{
                    borderColor: active ? "var(--color-primary)" : "var(--color-border)",
                    background: active
                      ? "color-mix(in srgb, var(--color-primary) 12%, transparent)"
                      : "var(--color-surface)",
                    color: active ? "var(--color-primary)" : "var(--color-text)",
                  }}
                >
                  {lang.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Alert message={error} />
      </div>

      {!isInsideTelegram() && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="btn btn-primary mt-4"
        >
          {submitting ? "Сохраняем…" : "Начать мониторинг"}
        </button>
      )}
    </div>
  );
}
