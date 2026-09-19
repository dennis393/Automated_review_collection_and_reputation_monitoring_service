import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { addFilial, deleteFilial, getFilials, updateFilial } from "../api/filials";
import { viewCompanies } from "../api/companies";
import type { CompanyResponse, FilialResponse } from "../types";
import Alert from "../components/Alert";
import Modal from "../components/Modal";
import { extractErrorMessage } from "../api/client";

export default function FilialsPage() {
  const [filials, setFilials] = useState<FilialResponse[]>([]);
  const [companies, setCompanies] = useState<CompanyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [companyId, setCompanyId] = useState<number | "">("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  const [editing, setEditing] = useState<FilialResponse | null>(null);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [f, c] = await Promise.all([getFilials(), viewCompanies()]);
      setFilials(f);
      setCompanies(c);
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

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (companyId === "") return;
    setSubmitting(true);
    setError(null);
    try {
      await addFilial({
        company_id: Number(companyId),
        filial_name: name,
        filial_address: address || undefined,
      });
      setShowCreate(false);
      setName("");
      setAddress("");
      setCompanyId("");
      await load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  function openEdit(f: FilialResponse) {
    setEditing(f);
    setEditName(f.filial_name);
    setEditAddress(f.filial_address ?? "");
  }

  async function handleEdit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSubmitting(true);
    setError(null);
    try {
      await updateFilial(editing.id, {
        filial_name: editName,
        filial_address: editAddress,
      });
      setEditing(null);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(f: FilialResponse) {
    if (!confirm(`Удалить филиал "${f.filial_name}"?`)) return;
    setError(null);
    try {
      await deleteFilial(f.id);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Филиалы</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreate(true)}
          disabled={companies.length === 0}
          title={companies.length === 0 ? "Сначала создайте компанию" : ""}
        >
          + Новый филиал
        </button>
      </div>
      <Alert message={error} />
      {loading ? (
        <p>Загрузка...</p>
      ) : filials.length === 0 ? (
        <p className="empty-state">Филиалов пока нет.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Название</th>
              <th>Адрес</th>
              <th>Компания</th>
              <th>Создан</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filials.map((f) => (
              <tr key={f.id}>
                <td>{f.filial_name}</td>
                <td>{f.filial_address ?? "—"}</td>
                <td>{companyName(f.company_id)}</td>
                <td>{new Date(f.created_at).toLocaleDateString()}</td>
                <td className="actions-cell">
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(f)}>
                    Изменить
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(f)}
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showCreate && (
        <Modal title="Новый филиал" onClose={() => setShowCreate(false)}>
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
              Название филиала
              <input required value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label>
              Адрес
              <input value={address} onChange={(e) => setAddress(e.target.value)} />
            </label>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? "Создаём..." : "Создать"}
            </button>
          </form>
        </Modal>
      )}

      {editing && (
        <Modal title="Редактировать филиал" onClose={() => setEditing(null)}>
          <form onSubmit={handleEdit}>
            <label>
              Название
              <input
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </label>
            <label>
              Адрес
              <input
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
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
