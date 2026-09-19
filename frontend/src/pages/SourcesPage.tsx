import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { createSource, deleteSourse, getSourses, updateSourse } from "../api/sources";
import { getFilials } from "../api/filials";
import type { FilialResponse, SourcePlatform, SourseResponse } from "../types";
import Alert from "../components/Alert";
import Modal from "../components/Modal";
import { extractErrorMessage } from "../api/client";

const PLATFORMS: SourcePlatform[] = [
  "yandex",
  "2GIS",
  "google_maps",
  "wildberries",
  "ozon",
  "yandex_market",
  "uzum",
];

export default function SourcesPage() {
  const [filials, setFilials] = useState<FilialResponse[]>([]);
  const [filialId, setFilialId] = useState<number | "">("");
  const [sources, setSources] = useState<SourseResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [platform, setPlatform] = useState<SourcePlatform>("yandex");
  const [url, setUrl] = useState("");
  const [shopId, setShopId] = useState("");

  const [editing, setEditing] = useState<SourseResponse | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [editActive, setEditActive] = useState(true);

  useEffect(() => {
    getFilials()
      .then((f) => {
        setFilials(f);
        if (f.length > 0) setFilialId(f[0].id);
      })
      .catch((err) => setError(extractErrorMessage(err)));
  }, []);

  async function loadSources(id: number) {
    setLoading(true);
    setError(null);
    try {
      const data = await getSourses(id);
      setSources(data);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (filialId !== "") loadSources(Number(filialId));
  }, [filialId]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (filialId === "") return;
    setSubmitting(true);
    setError(null);
    try {
      const isMarketplace = ["wildberries", "ozon", "yandex_market", "uzum"].includes(
        platform
      );
      await createSource({
        filial_id: Number(filialId),
        platform,
        url: isMarketplace ? undefined : url || undefined,
        marketplace_shop_id_only: isMarketplace ? shopId || undefined : undefined,
      });
      setShowCreate(false);
      setUrl("");
      setShopId("");
      await loadSources(Number(filialId));
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  function openEdit(s: SourseResponse) {
    setEditing(s);
    setEditUrl(s.url ?? "");
    setEditActive(s.is_active);
  }

  async function handleEdit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSubmitting(true);
    setError(null);
    try {
      await updateSourse(editing.id, { url: editUrl || null, is_active: editActive });
      setEditing(null);
      if (filialId !== "") await loadSources(Number(filialId));
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(s: SourseResponse) {
    if (!confirm(`Удалить источник "${s.platform}"?`)) return;
    setError(null);
    try {
      await deleteSourse(s.id);
      if (filialId !== "") await loadSources(Number(filialId));
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  const isMarketplacePlatform = ["wildberries", "ozon", "yandex_market", "uzum"].includes(
    platform
  );

  return (
    <div className="page">
      <div className="page-header">
        <h1>Источники отзывов</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreate(true)}
          disabled={filialId === ""}
        >
          + Новый источник
        </button>
      </div>

      <div className="filter-row">
        <label>
          Филиал
          <select
            value={filialId}
            onChange={(e) => setFilialId(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="" disabled>
              Выберите филиал
            </option>
            {filials.map((f) => (
              <option key={f.id} value={f.id}>
                {f.filial_name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <Alert message={error} />

      {filials.length === 0 ? (
        <p className="empty-state">Сначала создайте филиал.</p>
      ) : loading ? (
        <p>Загрузка...</p>
      ) : sources.length === 0 ? (
        <p className="empty-state">Источников пока нет.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Платформа</th>
              <th>Тип</th>
              <th>URL / Shop ID</th>
              <th>Активен</th>
              <th>Последняя проверка</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sources.map((s) => (
              <tr key={s.id}>
                <td>{s.platform}</td>
                <td>{s.platform_type}</td>
                <td>{s.url ?? s.marketplace_shop_id_only ?? "—"}</td>
                <td>{s.is_active ? "Да" : "Нет"}</td>
                <td>
                  {s.last_checked_at
                    ? new Date(s.last_checked_at).toLocaleString()
                    : "—"}
                </td>
                <td className="actions-cell">
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)}>
                    Изменить
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s)}>
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showCreate && (
        <Modal title="Новый источник" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate}>
            <label>
              Платформа
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as SourcePlatform)}
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            {isMarketplacePlatform ? (
              <label>
                Shop ID
                <input value={shopId} onChange={(e) => setShopId(e.target.value)} />
              </label>
            ) : (
              <label>
                URL
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                />
              </label>
            )}
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? "Создаём..." : "Создать"}
            </button>
          </form>
        </Modal>
      )}

      {editing && (
        <Modal title="Редактировать источник" onClose={() => setEditing(null)}>
          <form onSubmit={handleEdit}>
            <label>
              URL
              <input
                type="url"
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
              />
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={editActive}
                onChange={(e) => setEditActive(e.target.checked)}
              />
              Активен
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
