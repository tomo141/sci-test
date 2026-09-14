alter table public.exam_sessions
  drop constraint if exists exam_sessions_exam_mode_check;
alter table public.exam_sessions
  add constraint exam_sessions_exam_mode_check
    check (exam_mode in ('overall','domain','subdomain'));
alter table public.exam_sessions
  add column if not exists target_subdomain text;

alter table public.score_history
  drop constraint if exists score_history_score_kind_check;
alter table public.score_history
  add constraint score_history_score_kind_check
    check (score_kind in ('overall','domain','subdomain'));
alter table public.score_history
  add column if not exists subdomain text;

create index if not exists score_history_subdomain_score_idx
  on public.score_history (score_kind, domain, subdomain, score desc, answer_count desc);

create table if not exists public.subdomain_release_status (
  domain text not null,
  subdomain text not null,
  is_released boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (domain, subdomain)
);

alter table public.subdomain_release_status enable row level security;

create policy "public can read subdomain release status"
  on public.subdomain_release_status for select
  using (true);

create policy "admins manage subdomain release status"
  on public.subdomain_release_status for all
  using (public.is_admin())
  with check (public.is_admin());

insert into public.subdomain_release_status (domain, subdomain, is_released)
select domain, unnest(subdomains), false
from (
  values
    ('数学', array['数と代数','線形代数','解析・微分積分','幾何・位相','確率・統計','論理・集合論','離散数学・組合せ','数値解析・最適化','情報数理','関数・数学基礎']::text[]),
    ('物理', array['力学','電磁気学','波動・光学・音響','熱・統計力学','量子力学','相対論・宇宙論','素粒子・場の理論','物性・固体物理','計測・プラズマ・重力波','物理の基礎・法則']::text[]),
    ('化学', array['有機化学','無機化学','物理化学','分析化学・分光','酸塩基・酸化還元・電気化学','化学結合・結晶・固体','反応速度・触媒・光化学','元素・周期表・原子','物質・化学式・量','理論・材料・高分子化学']::text[]),
    ('生物', array['分子生物学','遺伝学・ゲノム','細胞生物学','生化学・代謝','生理学・人体','免疫学','神経科学・行動','進化・発生','生態・分類','微生物・ウイルス・バイオテク']::text[]),
    ('地学', array['天文・宇宙','気象・大気','地震・地球物理','海洋・水文','地質・堆積・年代','地球化学・炭素循環','鉱物・岩石・結晶','プレート・地球内部・地殻','古気候・気候科学','資源・環境・防災・リモセン']::text[]),
    ('工学', array['機械工学','電気・電子工学','土木・地盤・防災','材料工学','制御・システム','情報通信工学','熱・流体工学','構造・材料力学','製造・生産・計測','化学・バイオ・微細加工']::text[]),
    ('農学', array['育種・分子育種','栽培・作物学','土壌・植物栄養','畜産・飼料','病害虫・植物病理','水産','食品科学','林学・草地・生態','園芸','農業工学・経済・農村計画']::text[]),
    ('情報・計算機科学', array['アルゴリズム・データ構造','データベース','ネットワーク・分散システム','プログラミング・言語・コンパイラ','セキュリティ・暗号','OS・ハードウェア・並列','計算理論・形式手法','AI・機械学習','Web・HCI・可視化','情報理論・倫理・その他']::text[]),
    ('医歯薬学', array['薬学・薬理','解剖学','生理学','生化学・分子医学','免疫学','微生物・感染症','病理・腫瘍学','歯学','臨床各科・診断','公衆衛生・法医・倫理']::text[]),
    ('人文社会科学', array['哲学・倫理学','社会学','経済学','心理学・認知科学','政治学・国際関係','歴史学・考古学','法学','地理学・人口学','統計学・科学哲学','言語・文学・教育・文化']::text[])
) as taxonomy(domain, subdomains)
on conflict (domain, subdomain) do nothing;
