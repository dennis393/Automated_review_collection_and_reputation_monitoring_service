import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  createCredential,
  disconnectMarketplace,
  getCredentials,
  updateCredentialToken,
} from "@/api/credentials";
import { viewCompanies } from "@/api/companies";
import type { CompanyResponse, CredentialPlatform, CredentialResponse } from "@/types";
import Alert from "@/components/Alert";
import Modal from "@/components/Modal";
import { extractErrorMessage } from "@/api/client";

const PLATFORMS: { value: CredentialPlatform; label: string; icon: string }[] = [
  { value: "wildberries", label: "Wildberries", icon: "🟣" },
  { value: "ozon", label: "Ozon", icon: "🔵" },
  { value: "yandex_market", label: "Yandex Market", icon: "🟡" },
  { value: "uzum", label: "Uzum", icon: "🟢" },
];

function platformMeta(p: string) {
  return PLATFORMS.find((x) => x.value === p) ?? { label: p, icon: "🛍" };
}

export default function CredentialsPage() {
  const [credentials, setCredentials] = useState<CredentialResponse[]>([]);
  const [company, setCompany] = useState<CompanyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [connecting, setConnecting] = useState<CredentialPlatform | null>(null);
  const [token, setToken] = useState("");
  const [clientId, setClientId] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [shopId, setShopId] = useState("");

  const [editing, setEditing] = useState<CredentialResponse | null>(null);
  const [editToken, setEditToken] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [creds, companies] = await Promise.all([getCredentials(), viewCompanies()]);
      setCredentials(creds);
      setCompany(companies[0] ?? null);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function resetForm() {
    setToken("");
    setClientId("");
    setCampaignId("");
    setBusinessId("");
    setShopId("");
  }

  function openConnect(platform: CredentialPlatform) {
    resetForm();
    setConnecting(platform);
  }

  async function handleConnect(e: FormEvent) {
    e.preventDefault();
    if (!company || !connecting) return;
    setSubmitting(true);
    setError(null);
    try {
      await createCredential({
        company_id: company.id,
        platform: connecting,
        token,
        client_id: clientId || undefined,
        campaign_id: campaignId || undefined,
        business_id: businessId || undefined,
        shop_id: shopId || undefined,
      });
      setConnecting(null);
      resetForm();
      await load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  function openEdit(c: CredentialResponse) {
    setEditing(c);
    setEditToken("");
  }

  async function handleEdit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSubmitting(true);
    setError(null);
    try {
      await updateCredentialToken(editing.id, { token: editToken });
      setEditing(null);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDisconnect(c: CredentialResponse) {
    if (!confirm(`Отключить ${platformMeta(c.platform).label}?`)) return;
    setError(null);
    try {
      await disconnectMarketplace(c.id);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  const connectingMeta = connecting ? platformMeta(connecting) : null;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Маркетплейсы</h1>
      </div>
      <Alert message={error} />

      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <div className="list">
          {PLATFORMS.map((p) => {
            const cred = credentials.find((c) => c.platform === p.value);
            return (
              <div className="list-row" key={p.value}>
                <div className="list-row-top">
                  <div className="list-row-title">
                    <span style={{ marginRight: 8 }}>{p.icon}</span>
                    {p.label}
                  </div>
                  {cred && (
                    <span
                      className={`status-dot ${cred.is_active ? "on" : "off"}`}
                      title={cred.is_active ? "Подключён" : "Токен протух"}
                    />
                  )}
                </div>
                {cred ? (
                  <>
                    <div className="list-row-sub">
                      {cred.is_active ? "Подключён" : "Токен недействителен — обнови его"}
                    </div>
                    <div className="list-row-actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(cred)}>
                        Обновить токен
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDisconnect(cred)}>
                        Отключить
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="list-row-actions">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => openConnect(p.value)}
                      disabled={!company}
                    >
                      Подключить
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {connecting && connectingMeta && (
        <Modal title={`Подключить ${connectingMeta.label}`} onClose={() => setConnecting(null)}>
          <form onSubmit={handleConnect}>
            <label>
              Токен продавца
              <input required value={token} onChange={(e) => setToken(e.target.value)} />
            </label>
            {connecting === "ozon" && (
              <label>
                Client ID
                <input required value={clientId} onChange={(e) => setClientId(e.target.value)} />
              </label>
            )}
            {connecting === "yandex_market" && (
              <>
                <label>
                  Campaign ID
                  <input required value={campaignId} onChange={(e) => setCampaignId(e.target.value)} />
                </label>
                <label>
                  Business ID
                  <input value={businessId} onChange={(e) => setBusinessId(e.target.value)} />
                </label>
              </>
            )}
            {(connecting === "wildberries" || connecting === "uzum") && (
              <label>
                ID магазина (необязательно)
                <input value={shopId} onChange={(e) => setShopId(e.target.value)} />
              </label>
            )}
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? "Подключаем..." : "Подключить"}
            </button>
          </form>
        </Modal>
      )}

      {editing && (
        <Modal
          title={`Обновить токен: ${platformMeta(editing.platform).label}`}
          onClose={() => setEditing(null)}
        >
          <form onSubmit={handleEdit}>
            <label>
              Новый токен
              <input required value={editToken} onChange={(e) => setEditToken(e.target.value)} />
            </label>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? "Сохраняем..." : "Сохранить"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
