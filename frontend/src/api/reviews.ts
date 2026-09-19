import { apiClient } from "./client";
import type { ReviewResponse, UpdateAIDraft } from "../types";

export async function getReviewsWithDraft(): Promise<ReviewResponse[]> {
  const { data } = await apiClient.get<ReviewResponse[]>("/get_reviews_with_draft");
  return data;
}

// Note: the API defines both a path param {id_rev} and a query param `id_rew`
// (a typo present in the backend's own schema) — both are sent to satisfy it.
export async function getReviewById(idRev: number): Promise<ReviewResponse> {
  const { data } = await apiClient.get<ReviewResponse>(`/get_review_id/${idRev}`, {
    params: { id_rew: idRev },
  });
  return data;
}

export async function updateAiDraft(
  draftId: number,
  payload: UpdateAIDraft
) {
  const { data } = await apiClient.patch(`/update_ai_draft/${draftId}`, payload);
  return data;
}
