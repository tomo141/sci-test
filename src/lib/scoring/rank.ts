import { scoringConfig } from "./config";

export function rankTitle(score: number) {
  if (score >= 990) return "伝説級スコア";
  if (score >= 900) return "博士基礎相当";
  if (score >= 800) return "修士基礎相当";
  if (score >= 650) return "大学基礎到達";
  return "高校基礎到達";
}

export function isDisplayScore(value: number) {
  return value >= scoringConfig.minScore && value <= scoringConfig.maxScore && value % scoringConfig.displayStep === 0;
}
