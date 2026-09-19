import { useEffect, useState } from "react";
import { getTelegramToken } from "../api/telegram";
import Alert from "../components/Alert";
import { extractErrorMessage } from "../api/client";

export default function TelegramPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await getTelegramToken();
      setData(res);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const tokenValue =
    typeof data === "string"
      ? data
      : data?.token ?? data?.telegram_token ?? data?.access_token ?? null;

  function copy() {
    if (!tokenValue) return;
    navigator.clipboard.writeText(tokenValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Telegram</h1>
      </div>
      <Alert message={error} />
      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <div className="card telegram-card">
          <p>Токен для подключения Telegram-бота:</p>
          {tokenValue ? (
            <>
              <code className="token-box">{tokenValue}</code>
              <button className="btn btn-secondary" onClick={copy}>
                {copied ? "Скопировано!" : "Скопировать"}
              </button>
            </>
          ) : (
            <pre className="token-box">{JSON.stringify(data, null, 2)}</pre>
          )}
        </div>
      )}
    </div>
  );
}
