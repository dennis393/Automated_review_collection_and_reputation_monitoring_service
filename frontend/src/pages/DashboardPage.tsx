import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { viewCompanies, renameCompany } from "@/api/companies";
import { getFilials } from "@/api/filials";
import { getReviewsWithDraft } from "@/api/reviews";
import { getCredentials } from "@/api/credentials";
import type { CompanyResponse, FilialResponse, ReviewResponse, CredentialResponse } from "@/types";
import Alert from "@/components/Alert";
import Modal from "@/components/Modal";
import { extractErrorMessage } from "@/api/client";
import { useAuth } from "@/context/AuthContext";

function statusLabel(status: string) {
  switch (status) {
    case "approved":
      return "Одобрен";
    case "rejected":
      return "Отклонён";
    default:
      return "Ожидает";
  }
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [company, setCompany] = useState<CompanyResponse | null>(null);
  const [filials, setFilials] = useState<FilialResponse[]>([]);
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [credentials, setCredentials] = useState<CredentialResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingCompany, setEditingCompany] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [companies, filialsData, reviewsData, credsData] = await Promise.all([
        viewCompanies(),
        getFilials(),
        getReviewsWithDraft(),
        getCredentials(),
      ]);
      setCompany(companies[0] ?? null);
      setFilials(filialsData);
      setReviews(reviewsData);
      setCredentials(credsData);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openEditCompany() {
    if (!company) return;
    setEditName(company.company_name);
    setEditDescription(company.company_description);
    setEditingCompany(true);
  }

  async function handleSaveCompany(e: FormEvent) {
    e.preventDefault();
    if (!company) return;
    setSubmitting(true);
    setError(null);
    try {
      const updated = await renameCompany(company.id, {
        company_name: editName,
        company_description: editDescription,
      });
      setCompany(updated);
      setEditingCompany(false);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const pendingCount = reviews.filter((r) => (r.draft?.status ?? "pending") === "pending").length;
  const recentReviews = [...reviews]
    .sort((a, b) => new Date(b.reviewed_at).getTime() - new Date(a.reviewed_at).getTime())
    .slice(0, 3);
  const firstName = user?.full_name?.split(" ")[0];

  if (loading) return <p>Загрузка...</p>;

  return (
    <div className="page">
      <p className="text-[13px]" style={{ color: "var(--color-text-muted)" }}>
        {firstName ? `С возвращением, ${firstName}` : "С возвращением"}
      </p>

      {company && (
        <div className="list-row mt-2 mb-4">
          <div className="list-row-top">
            <div>
              <div className="list-row-title">{company.company_name}</div>
              {company.company_description && (
                <div className="list-row-sub">{company.company_description}</div>
              )}
            </div>
            <button className="btn btn-secondary btn-sm" onClick={openEditCompany}>
              Изменить
            </button>
          </div>
        </div>
      )}

      <Alert message={error} />

      <div className="stat-grid">
        <div className="stat-tile">
          <div className="stat-value">{pendingCount}</div>
          <div className="stat-label">Ждут ответа</div>
        </div>
        <div className="stat-tile">
          <div className="stat-value">{filials.length}</div>
          <div className="stat-label">Филиалов</div>
        </div>
        <div className="stat-tile">
          <div className="stat-value">{credentials.filter((c) => c.is_active).length}</div>
          <div className="stat-label">Маркетплейсов подключено</div>
        </div>
        <div className="stat-tile">
          <div className="stat-value">{reviews.length}</div>
          <div className="stat-label">Отзывов всего</div>
        </div>
      </div>

      <div className="page-header mt-6">
        <h1 style={{ fontSize: 17 }}>Последние отзывы</h1>
        <Link to="/reviews" className="expand-toggle">
          Все →
        </Link>
      </div>

      {recentReviews.length === 0 ? (
        <p className="empty-state">Отзывов пока нет — добавь источник во вкладке «Филиалы».</p>
      ) : (
        <div className="review-list">
          {recentReviews.map((r) => (
            <div className="review-card" key={r.id}>
              <div className="review-card-header">
                <span className="review-rating">
                  {"★".repeat(r.rating)}
                  {"☆".repeat(Math.max(0, 5 - r.rating))}
                </span>
                <span>{r.author_name ?? "Аноним"}</span>
              </div>
              <p className="review-text">{r.text_review ?? "—"}</p>
              {r.draft && (
                <div className={`draft-badge draft-${r.draft.status}`}>
                  {statusLabel(r.draft.status)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {editingCompany && (
        <Modal title="О компании" onClose={() => setEditingCompany(false)}>
          <form onSubmit={handleSaveCompany}>
            <label>
              Название
              <input required value={editName} onChange={(e) => setEditName(e.target.value)} />
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
