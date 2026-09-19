import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  createCredential,
  disconnectMarketplace,
  getCredentials,
  updateCredentialToken,
} from "../api/credentials";
import { viewCompanies } from "../api/companies";
import type { CompanyResponse, CredentialPlatform, CredentialResponse } from "../types";
import Alert from "../components/Alert";
import Modal from "../components/Modal";
import { extractErrorMessage } from "../api/client";

const PLATFORMS: CredentialPlatform[] = ["wildberries", "ozon", "yandex_market", "uzum"];

export default function CredentialsPage() {
  const [credentials, setCredentials] = useState<CredentialResponse[]>([]);
  const [companies, setCompanies] = useState<CompanyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [companyId, setCompanyId] = useState<number | "">("");
  const [platform, setPlatform] = useState<CredentialPlatform>("wildberries");
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
      const [creds, comps] = await Promise.all([getCredentials(), viewCompanies()]);
      setCredentials(creds);
      setCompanies(comps);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function companyName(id: number) {
    return companies.find((c) => c.id === id)?.company_name ?? `#${id}`;
  }

  function resetCreateForm() {
    setToken("");
    setClientId("");
    setCampaignId("");
    setBusinessId("");
    setShopId("");
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (companyId === "") return;
    setSubmitting(true);
    setError(null);
    try {
      await createCredential({
        company_id: Number(companyId),
        platform,
        token,
        client_id: clientId || undefined,
        campaign_id: campaignId || undefined,
        business_id: businessId || undefined,
        shop_id: shopId || undefined,
      });
      setShowCreate(false);
      resetCreateForm();
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
    if (!confirm(`Отключить подключение "${c.platform}"?`)) return;
    setError(null);
    try {
      await disconnectMarketplace(c.id);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Подключения маркетплейсов</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreate(true)}
          disabled={companies.length === 0}
        >
          + Новое подключение
        </button>
      </div>
      <Alert message={error} />
      {loading ? (
        <p>Загрузка...</p>
      ) : credentials.length === 0 ? (
        <p className="empty-state">Подключений пока нет.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Платформа</th>
              <th>Компания</th>
              <th>Активен</th>
              <th>Создан</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {credentials.map((c) => (
              <tr key={c.id}>
                <td>{c.platform}</td>
                <td>{companyName(c.company_id)}</td>
                <td>{c.is_active ? "Да" : "Нет"}</td>
                <td>{new Date(c.created_at).toLocaleDateString()}</td>
                <td className="actions-cell">
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}>
                    Обновить токен
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDisconnect(c)}
                  >
                    Отключить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showCreate && (
        <Modal title="Новое подключение" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate}>
            <label>
              Компания
              <select
                required
                value={companyId}
                onChange={(e) => setCompanyId(Number(e.target.value))}
              >
                <option value="" disabled>
                  Выберите компанию
                </option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Платформа
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as CredentialPlatform)}
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Токен
              <input required value={token} onChange={(e) => setToken(e.target.value)} />
            </label>
            {platform === "ozon" && (
              <label>
                Client ID
                <input value={clientId} onChange={(e) => setClientId(e.target.value)} />
              </label>
            )}
            {platform === "yandex_market" && (
              <>
                <label>
                  Campaign ID
                  <input
                    value={campaignId}
                    onChange={(e) => setCampaignId(e.target.value)}
                  />
                </label>
                <label>
                  Business ID
                  <input
                    value={businessId}
                    onChange={(e) => setBusinessId(e.target.value)}
                  />
                </label>
              </>
            )}
            {(platform === "wildberries" || platform === "uzum") && (
              <label>
                Shop ID
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
        <Modal title={`Обновить токен: ${editing.platform}`} onClose={() => setEditing(null)}>
          <form onSubmit={handleEdit}>
            <label>
              Новый токен
              <input
                required
                value={editToken}
                onChange={(e) => setEditToken(e.target.value)}
              />
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
