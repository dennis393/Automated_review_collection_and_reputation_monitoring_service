interface EntryStatusPageProps {
  kind: "loading" | "outside-telegram" | "error";
}

const COPY: Record<EntryStatusPageProps["kind"], { title: string; text: string }> = {
  loading: {
    title: "Открываем приложение",
    text: "Проверяем данные Telegram — это пара секунд.",
  },
  "outside-telegram": {
    title: "Открой через Telegram",
    text: "Это приложение работает только внутри Telegram. Найди бота и нажми «Открыть приложение».",
  },
  error: {
    title: "Не удалось войти",
    text: "Telegram не подтвердил данные входа. Закрой приложение и открой его заново из бота.",
  },
};

export default function EntryStatusPage({ kind }: EntryStatusPageProps) {
  const { title, text } = COPY[kind];
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-8 text-center">
      <div
        className="mb-5 flex h-14 w-14 items-center justify-center rounded-full text-[26px]"
        style={{ background: "color-mix(in srgb, var(--color-accent-gold) 18%, transparent)" }}
      >
        {kind === "loading" ? "⏳" : kind === "error" ? "⚠️" : "⭐"}
      </div>
      <h1 className="text-[19px] font-semibold" style={{ color: "var(--color-text)" }}>
        {title}
      </h1>
      <p className="mt-2 max-w-xs text-[15px] leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
        {text}
      </p>
    </div>
  );
}
