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

export const subdomainsByDomain = {
  数学: ["数と代数", "線形代数", "解析・微分積分", "幾何・位相", "確率・統計", "論理・集合論", "離散数学・組合せ", "数値解析・最適化", "情報数理", "関数・数学基礎"],
  物理: ["力学", "電磁気学", "波動・光学・音響", "熱・統計力学", "量子力学", "相対論・宇宙論", "素粒子・場の理論", "物性・固体物理", "計測・プラズマ・重力波", "物理の基礎・法則"],
  化学: ["有機化学", "無機化学", "物理化学", "分析化学・分光", "酸塩基・酸化還元・電気化学", "化学結合・結晶・固体", "反応速度・触媒・光化学", "元素・周期表・原子", "物質・化学式・量", "理論・材料・高分子化学"],
  生物: ["分子生物学", "遺伝学・ゲノム", "細胞生物学", "生化学・代謝", "生理学・人体", "免疫学", "神経科学・行動", "進化・発生", "生態・分類", "微生物・ウイルス・バイオテク"],
  地学: ["天文・宇宙", "気象・大気", "地震・地球物理", "海洋・水文", "地質・堆積・年代", "地球化学・炭素循環", "鉱物・岩石・結晶", "プレート・地球内部・地殻", "古気候・気候科学", "資源・環境・防災・リモセン"],
  工学: ["機械工学", "電気・電子工学", "土木・地盤・防災", "材料工学", "制御・システム", "情報通信工学", "熱・流体工学", "構造・材料力学", "製造・生産・計測", "化学・バイオ・微細加工"],
  農学: ["育種・分子育種", "栽培・作物学", "土壌・植物栄養", "畜産・飼料", "病害虫・植物病理", "水産", "食品科学", "林学・草地・生態", "園芸", "農業工学・経済・農村計画"],
  "情報・計算機科学": ["アルゴリズム・データ構造", "データベース", "ネットワーク・分散システム", "プログラミング・言語・コンパイラ", "セキュリティ・暗号", "OS・ハードウェア・並列", "計算理論・形式手法", "AI・機械学習", "Web・HCI・可視化", "情報理論・倫理・その他"],
  医歯薬学: ["薬学・薬理", "解剖学", "生理学", "生化学・分子医学", "免疫学", "微生物・感染症", "病理・腫瘍学", "歯学", "臨床各科・診断", "公衆衛生・法医・倫理"],
  人文社会科学: ["哲学・倫理学", "社会学", "経済学", "心理学・認知科学", "政治学・国際関係", "歴史学・考古学", "法学", "地理学・人口学", "統計学・科学哲学", "言語・文学・教育・文化"]
} as const satisfies Record<ScienceDomain, readonly string[]>;

export type ScienceSubdomain = (typeof subdomainsByDomain)[ScienceDomain][number];

export function isScienceDomain(value: unknown): value is ScienceDomain {
  return typeof value === "string" && (domains as readonly string[]).includes(value);
}

export function isScienceSubdomain(value: unknown): value is ScienceSubdomain {
  return (
    typeof value === "string" &&
    Object.values(subdomainsByDomain).some((subdomains) => (subdomains as readonly string[]).includes(value))
  );
}

export function isSubdomainOf(domain: ScienceDomain, subdomain: unknown): subdomain is ScienceSubdomain {
  return typeof subdomain === "string" && (subdomainsByDomain[domain] as readonly string[]).includes(subdomain);
}

export function subdomainKey(domain: ScienceDomain, subdomain: string) {
  return `${domain}/${subdomain}`;
}

export const domainIconLabels: Record<ScienceDomain, string> = {
  数学: "図形と数式",
  物理: "原子と力",
  化学: "フラスコ",
  生物: "DNA",
  地学: "地球",
  工学: "歯車",
  農学: "芽",
  "情報・計算機科学": "コード",
  医歯薬学: "医療",
  人文社会科学: "人と社会"
};
