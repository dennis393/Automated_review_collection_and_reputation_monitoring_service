import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { addFilial, deleteFilial, getFilials, updateFilial } from "@/api/filials";
import { createSource, deleteSourse, getSourses, updateSourse } from "@/api/sources";
import { viewCompanies } from "@/api/companies";
import type {
  CompanyResponse,
  FilialResponse,
  SourcePlatform,
  SourseResponse,
} from "@/types";
import Alert from "@/components/Alert";
import Modal from "@/components/Modal";
import { extractErrorMessage } from "@/api/client";

const PLATFORMS: { value: SourcePlatform; label: string }[] = [
  { value: "yandex", label: "Яндекс Карты" },
  { value: "2GIS", label: "2ГИС" },
  { value: "google_maps", label: "Google Maps" },
  { value: "wildberries", label: "Wildberries" },
  { value: "ozon", label: "Ozon" },
  { value: "yandex_market", label: "Yandex Market" },
  { value: "uzum", label: "Uzum" },
];

const MARKETPLACE_PLATFORMS: SourcePlatform[] = ["wildberries", "ozon", "yandex_market", "uzum"];

function platformLabel(p: string) {
  return PLATFORMS.find((x) => x.value === p)?.label ?? p;
}

export default function FilialsPage() {
  const [filials, setFilials] = useState<FilialResponse[]>([]);
  const [company, setCompany] = useState<CompanyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [expanded, setExpanded] = useState<number | null>(null);
  const [sourcesByFilial, setSourcesByFilial] = useState<Record<number, SourseResponse[]>>({});
  const [sourcesLoading, setSourcesLoading] = useState<number | null>(null);

  const [showCreateFilial, setShowCreateFilial] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  const [editingFilial, setEditingFilial] = useState<FilialResponse | null>(null);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");

  const [sourceFormFilialId, setSourceFormFilialId] = useState<number | null>(null);
  const [platform, setPlatform] = useState<SourcePlatform>("yandex");
  const [url, setUrl] = useState("");
  const [shopId, setShopId] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [f, companies] = await Promise.all([getFilials(), viewCompanies()]);
      setFilials(f);
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

  async function loadSources(filialId: number) {
    setSourcesLoading(filialId);
    try {
      const data = await getSourses(filialId);
      setSourcesByFilial((prev) => ({ ...prev, [filialId]: data }));
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSourcesLoading(null);
    }
  }

  function toggleExpand(filialId: number) {
    const next = expanded === filialId ? null : filialId;
    setExpanded(next);
    if (next !== null && !sourcesByFilial[next]) {
      loadSources(next);
    }
  }

  async function handleCreateFilial(e: FormEvent) {
    e.preventDefault();
    if (!company) return;
    setSubmitting(true);
    setError(null);
    try {
      await addFilial({
        company_id: company.id,
        filial_name: name,
        filial_address: address || undefined,
      });
      setShowCreateFilial(false);
      setName("");
      setAddress("");
      await load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  function openEditFilial(f: FilialResponse) {
    setEditingFilial(f);
    setEditName(f.filial_name);
    setEditAddress(f.filial_address ?? "");
  }

  async function handleEditFilial(e: FormEvent) {
    e.preventDefault();
    if (!editingFilial) return;
    setSubmitting(true);
    setError(null);
    try {
      await updateFilial(editingFilial.id, {
        filial_name: editName,
        filial_address: editAddress,
      });
      setEditingFilial(null);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteFilial(f: FilialResponse) {
    if (!confirm(`Удалить филиал «${f.filial_name}»? Источники и отзывы удалятся вместе с ним.`)) return;
    setError(null);
    try {
      await deleteFilial(f.id);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  const isMarketplacePlatform = MARKETPLACE_PLATFORMS.includes(platform);

  async function handleCreateSource(e: FormEvent) {
    e.preventDefault();
    if (sourceFormFilialId === null) return;
    setSubmitting(true);
    setError(null);
    try {
      await createSource({
        filial_id: sourceFormFilialId,
        platform,
        url: isMarketplacePlatform ? undefined : url || undefined,
        marketplace_shop_id_only: isMarketplacePlatform ? shopId || undefined : undefined,
      });
      const filialId = sourceFormFilialId;
      setSourceFormFilialId(null);
      setUrl("");
      setShopId("");
      await loadSources(filialId);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleSourceActive(filialId: number, source: SourseResponse) {
    setError(null);
    try {
      await updateSourse(source.id, { is_active: !source.is_active });
      await loadSources(filialId);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  async function handleDeleteSource(filialId: number, source: SourseResponse) {
    if (!confirm(`Удалить источник «${platformLabel(source.platform)}»?`)) return;
    setError(null);
    try {
      await deleteSourse(source.id);
      await loadSources(filialId);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Филиалы</h1>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setShowCreateFilial(true)}
          disabled={!company}
        >
          + Филиал
        </button>
      </div>

      <Alert message={error} />

      {loading ? (
        <p>Загрузка...</p>
      ) : filials.length === 0 ? (
        <p className="empty-state">Филиалов пока нет.</p>
      ) : (
        <div className="list">
          {filials.map((f) => (
            <div className="list-row" key={f.id}>
              <div className="list-row-top">
                <div>
                  <div className="list-row-title">{f.filial_name}</div>
                  <div className="list-row-sub">{f.filial_address ?? "Без адреса — только маркетплейсы"}</div>
                </div>
                <button className="expand-toggle" onClick={() => toggleExpand(f.id)}>
                  {expanded === f.id ? "Скрыть" : "Источники"}
                </button>
              </div>

              <div className="list-row-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => openEditFilial(f)}>
                  Изменить
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteFilial(f)}>
                  Удалить
                </button>
              </div>

              {expanded === f.id && (
                <div className="nested-list">
                  {sourcesLoading === f.id ? (
                    <p className="list-row-sub">Загрузка...</p>
                  ) : (sourcesByFilial[f.id] ?? []).length === 0 ? (
                    <p className="list-row-sub">Источников пока нет.</p>
                  ) : (
                    (sourcesByFilial[f.id] ?? []).map((s) => (
                      <div className="nested-row" key={s.id}>
                        <div>
                          <div style={{ fontWeight: 600 }}>
                            <span
                              className={`status-dot ${s.is_active ? "on" : "off"}`}
                              style={{ marginRight: 6 }}
                            />
                            {platformLabel(s.platform)}
                          </div>
                          <div className="list-row-sub">
                            {s.url ?? s.marketplace_shop_id_only ?? "—"}
                          </div>
                        </div>
                        <div className="list-row-actions" style={{ marginTop: 0 }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleToggleSourceActive(f.id, s)}
                          >
                            {s.is_active ? "Выключить" : "Включить"}
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteSource(f.id, s)}
                          >
                            Удалить
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setSourceFormFilialId(f.id)}
                  >
                    + Добавить источник
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreateFilial && (
        <Modal title="Новый филиал" onClose={() => setShowCreateFilial(false)}>
          <form onSubmit={handleCreateFilial}>
            <label>
              Название
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Например, «На Чиланзаре»"
              />
            </label>
            <label>
              Адрес (необязательно)
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Оставь пустым, если продаёшь только на маркетплейсах"
              />
            </label>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? "Создаём..." : "Создать"}
            </button>
          </form>
        </Modal>
      )}

      {editingFilial && (
        <Modal title="Редактировать филиал" onClose={() => setEditingFilial(null)}>
          <form onSubmit={handleEditFilial}>
            <label>
              Название
              <input required value={editName} onChange={(e) => setEditName(e.target.value)} />
            </label>
            <label>
              Адрес
              <input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
            </label>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? "Сохраняем..." : "Сохранить"}
            </button>
          </form>
        </Modal>
      )}

      {sourceFormFilialId !== null && (
        <Modal title="Новый источник" onClose={() => setSourceFormFilialId(null)}>
          <form onSubmit={handleCreateSource}>
            <label>
              Платформа
              <select value={platform} onChange={(e) => setPlatform(e.target.value as SourcePlatform)}>
                {PLATFORMS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            {isMarketplacePlatform ? (
              <label>
                ID магазина
                <input value={shopId} onChange={(e) => setShopId(e.target.value)} />
              </label>
            ) : (
              <label>
                Ссылка на страницу с отзывами
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                />
              </label>
            )}
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? "Добавляем..." : "Добавить"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
