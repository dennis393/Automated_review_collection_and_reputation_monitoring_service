import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { createCompany, renameCompany, viewCompanies } from "../api/companies";
import type { CompanyResponse } from "../types";
import Alert from "../components/Alert";
import Modal from "../components/Modal";
import { extractErrorMessage } from "../api/client";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<CompanyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [editing, setEditing] = useState<CompanyResponse | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await viewCompanies();
      setCompanies(data);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createCompany({ company_name: name, company_description: description });
      setShowCreate(false);
      setName("");
      setDescription("");
      await load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  function openEdit(c: CompanyResponse) {
    setEditing(c);
    setEditName(c.company_name);
    setEditDescription(c.company_description);
  }

  async function handleEdit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSubmitting(true);
    setError(null);
    try {
      await renameCompany(editing.id, {
        company_name: editName,
        company_description: editDescription,
      });
      setEditing(null);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Компании</h1>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + Новая компания
        </button>
      </div>
      <Alert message={error} />
      {loading ? (
        <p>Загрузка...</p>
      ) : companies.length === 0 ? (
        <p className="empty-state">Компаний пока нет.</p>
      ) : (
        <div className="card-grid">
          {companies.map((c) => (
            <div className="card" key={c.id}>
              <div className="card-title">{c.company_name}</div>
              <div className="card-desc">{c.company_description}</div>
              <div className="card-meta">
                Создана: {new Date(c.created_at).toLocaleDateString()}
              </div>
              <button className="btn btn-secondary" onClick={() => openEdit(c)}>
                Редактировать
              </button>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <Modal title="Новая компания" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate}>
            <label>
              Название
              <input required value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label>
              Описание
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? "Создаём..." : "Создать"}
            </button>
          </form>
        </Modal>
      )}

      {editing && (
        <Modal title="Редактировать компанию" onClose={() => setEditing(null)}>
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
              Описание
              <textarea
                required
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
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
