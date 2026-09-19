import { useEffect, useState } from "react";
import { getReviewsWithDraft, updateAiDraft } from "../api/reviews";
import type { ReviewResponse } from "../types";
import Alert from "../components/Alert";
import Modal from "../components/Modal";
import { extractErrorMessage } from "../api/client";

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

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [selected, setSelected] = useState<ReviewResponse | null>(null);
  const [editedText, setEditedText] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getReviewsWithDraft();
      setReviews(data);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openReview(r: ReviewResponse) {
    setSelected(r);
    setEditedText(r.draft?.edited_text ?? r.draft?.original_text ?? "");
  }

  async function handleSave(status?: "pending" | "approved" | "rejected") {
    if (!selected?.draft) return;
    setSubmitting(true);
    setError(null);
    try {
      await updateAiDraft(selected.draft.id, {
        edited_text: editedText,
        status: status ?? null,
      });
      setSelected(null);
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
        <h1>Отзывы и AI-черновики ответов</h1>
      </div>
      <Alert message={error} />
      {loading ? (
        <p>Загрузка...</p>
      ) : reviews.length === 0 ? (
        <p className="empty-state">Отзывов пока нет.</p>
      ) : (
        <div className="review-list">
          {reviews.map((r) => (
            <div className="review-card" key={r.id} onClick={() => openReview(r)}>
              <div className="review-card-header">
                <span className="review-rating">{"★".repeat(r.rating)}{"☆".repeat(Math.max(0, 5 - r.rating))}</span>
                <span className="review-author">{r.author_name ?? "Аноним"}</span>
                <span className="review-date">
                  {new Date(r.reviewed_at).toLocaleDateString()}
                </span>
              </div>
              {r.product_name && <div className="review-product">{r.product_name}</div>}
              <p className="review-text">{r.text_review ?? "—"}</p>
              {r.draft && (
                <div className={`draft-badge draft-${r.draft.status}`}>
                  Черновик: {statusLabel(r.draft.status)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selected && (
        <Modal title="Отзыв и черновик ответа" onClose={() => setSelected(null)}>
          <div className="review-detail">
            <div className="review-detail-meta">
              <strong>{selected.author_name ?? "Аноним"}</strong> ·{" "}
              {"★".repeat(selected.rating)} ·{" "}
              {new Date(selected.reviewed_at).toLocaleString()}
            </div>
            {selected.product_name && (
              <div className="review-product">{selected.product_name}</div>
            )}
            <p className="review-text">{selected.text_review ?? "—"}</p>
            {selected.url_review && (
              <a href={selected.url_review} target="_blank" rel="noreferrer">
                Открыть оригинал
              </a>
            )}
            <hr />
            {selected.draft ? (
              <>
                <label>
                  Ответ (можно редактировать)
                  <textarea
                    rows={6}
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                  />
                </label>
                <div className="draft-original">
                  <em>Оригинал AI-черновика:</em>
                  <p>{selected.draft.original_text}</p>
                </div>
                <div className="modal-actions">
                  <button
                    className="btn btn-secondary"
                    disabled={submitting}
                    onClick={() => handleSave()}
                  >
                    Сохранить черновик
                  </button>
                  <button
                    className="btn btn-success"
                    disabled={submitting}
                    onClick={() => handleSave("approved")}
                  >
                    Одобрить
                  </button>
                  <button
                    className="btn btn-danger"
                    disabled={submitting}
                    onClick={() => handleSave("rejected")}
                  >
                    Отклонить
                  </button>
                </div>
              </>
            ) : (
              <p className="empty-state">AI-черновик ещё не сформирован.</p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
