export const REVIEW_LIST_STORAGE_KEY = "sci-test-review-list";

export type ReviewListItem = {
  questionId: string;
  addedAt: string;
};

export function loadReviewList(): ReviewListItem[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(REVIEW_LIST_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as ReviewListItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveReviewList(items: ReviewListItem[]) {
  window.localStorage.setItem(REVIEW_LIST_STORAGE_KEY, JSON.stringify(items));
}

export function isInReviewList(questionId: string, items = loadReviewList()) {
  return items.some((item) => item.questionId === questionId);
}

export function addToReviewList(questionId: string) {
  const items = loadReviewList();
  if (items.some((item) => item.questionId === questionId)) return items;
  const next = [{ questionId, addedAt: new Date().toISOString() }, ...items];
  saveReviewList(next);
  return next;
}

export function removeFromReviewList(questionId: string) {
  const next = loadReviewList().filter((item) => item.questionId !== questionId);
  saveReviewList(next);
  return next;
}
