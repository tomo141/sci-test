export const COGNITIVE_TYPES = ["用語・定義", "原理・因果", "基本的な適用", "比較・分類", "誤解・境界"];
export const LEVEL_BUCKETS = ["L100-300", "L400-600", "L700-900"];
export const LEVELS = [100, 200, 300, 400, 500, 600, 700, 800, 900];

export function levelBucket(level) {
  const value = Number(level);
  if (value <= 300) return "L100-300";
  if (value <= 600) return "L400-600";
  return "L700-900";
}

export function emptyLevelDistribution() {
  return Object.fromEntries(LEVEL_BUCKETS.map((bucket) => [bucket, 0]));
}

export function emptyCognitiveDistribution() {
  return Object.fromEntries(COGNITIVE_TYPES.map((type) => [type, 0]));
}

export function slugPart(value) {
  return String(value)
    .normalize("NFKC")
    .replace(/[\\/:*?"<>|#%&{}$!'@+=`]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function q(question) {
  return {
    currentness_type: "evergreen",
    expires_at: null,
    status: "draft",
    tags: [question.domain, question.subdomain, question.cognitive_type].filter(Boolean),
    ...question,
    difficulty_continuous: question.difficulty_continuous ?? question.difficulty_initial
  };
}

export function balanceAll(items, key) {
  return items.reduce((acc, item) => {
    const value = item[key] ?? "未設定";
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}
