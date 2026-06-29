export const domains = [
  "数学",
  "物理",
  "化学",
  "生物",
  "地学",
  "工学",
  "農学",
  "情報・計算機科学",
  "医歯薬学",
  "人文社会科学"
] as const;

export const abilityAxes = ["基礎力", "定量・方法力", "データ・研究力", "時事・歴史力", "分野融合・実装力"] as const;

export type ScienceDomain = (typeof domains)[number];
export type AbilityAxis = (typeof abilityAxes)[number];

export const domainIcons: Record<ScienceDomain, string> = {
  数学: "△",
  物理: "⚛",
  化学: "⚗",
  生物: "DNA",
  地学: "🌐",
  工学: "⚙",
  農学: "芽",
  "情報・計算機科学": "</>",
  医歯薬学: "＋",
  人文社会科学: "人"
};
