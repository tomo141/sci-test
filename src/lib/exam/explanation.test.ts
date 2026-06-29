import { describe, expect, it } from "vitest";
import { buildAnswerFeedback, choiceLabel, formatMisconceptionDiagnosis } from "./explanation";
import type { Question } from "@/src/lib/data/questions";

const baseQuestion: Pick<
  Question,
  | "correctIndex"
  | "choices"
  | "shortExplanation"
  | "detailedExplanation"
  | "commonMisconception"
  | "distractorRationales"
  | "basicTerms"
> = {
  correctIndex: 3,
  choices: [
    "正逆両方向の反応速度がともに増える",
    "平衡に達するまでの時間が短くなることがある",
    "平衡定数 K は変わらない",
    "触媒を加えると平衡時の生成物のモル分率が増える"
  ],
  shortExplanation: "触媒は平衡位置を変えず、生成物の割合は変わりません。",
  detailedExplanation:
    "触媒は活性化エネルギーを下げて平衡到達を早めますが、平衡定数も平衡組成も変えません。生成物のモル分率が増えるわけではありません。",
  commonMisconception: "触媒＝生成物が増える、という誤解が最も一般的です。",
  distractorRationales: [
    "正しい説明です。",
    "正しい説明です。",
    "正しい説明です。",
    "正解（誤った説明）。触媒は平衡組成を変えません。"
  ],
  basicTerms: "平衡定数：一定温度での平衡時の濃度比。触媒：活性化エネルギーを下げる物質。"
};

describe("formatMisconceptionDiagnosis", () => {
  it("ends with かもしれません", () => {
    expect(formatMisconceptionDiagnosis("1も素数だと考える")).toContain("かもしれません");
    expect(formatMisconceptionDiagnosis("触媒＝生成物が増える、という誤解が最も一般的です。")).toContain(
      "かもしれません"
    );
  });
});

describe("buildAnswerFeedback", () => {
  it("builds incorrect feedback with near miss and selected choice", () => {
    const feedback = buildAnswerFeedback(baseQuestion, 1, false);
    expect(feedback.headline).toBe("不正解！");
    expect(feedback.nearMiss).toContain("かもしれません");
    expect(feedback.conclusion).toBe(baseQuestion.shortExplanation);
    expect(feedback.basicTerms).toBe(baseQuestion.basicTerms);
    expect(feedback.selectedChoice?.label).toBe(choiceLabel(1));
    expect(feedback.selectedChoice?.explanation).toContain("一見もっともらしい");
  });

  it("builds correct feedback without near miss or selected choice", () => {
    const feedback = buildAnswerFeedback(baseQuestion, 3, true);
    expect(feedback.headline).toBe("正解！");
    expect(feedback.nearMiss).toBeUndefined();
    expect(feedback.selectedChoice).toBeUndefined();
  });
});
