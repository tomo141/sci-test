import { scoreCeiling } from "./versions";
import React from "react";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { domains } from "@/src/lib/data/taxonomy";
import type { SharedResult } from "./public";

async function imageOptions() {
  const font = await readFile(join(process.cwd(), "public/fonts/ScienceSans-Bold.ttf"));
  return { width: 1200, height: 630, fonts: [{ name: "ScienceSans", data: font, weight: 700 as const, style: "normal" as const }], headers: { "Cache-Control": "no-store" } };
}

export async function sharedResultImage(shared: SharedResult) {
  const r = shared.result;
  const formal = r.definition.formal;
  const field = r.definition.domain ? r.domains[r.definition.domain] : null;
  const score = formal ? field?.score ?? r.total ?? "—" : r.correctCount;
  const scale = formal ? `/ ${scoreCeiling(r.version,!!field)}点 · 参考スコア` : `/ ${r.answerCount}問 正解`;
  const nickname = Array.from(shared.nickname).slice(0, 12).join("") + (Array.from(shared.nickname).length > 12 ? "…" : "");
  return new ImageResponse(<div style={{ display: "flex", flexDirection: "column", background: "#f3f7ff", color: "#11213f", width: "100%", height: "100%", padding: "42px 50px", fontFamily: "ScienceSans" }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "2px solid #d3e1f3", paddingBottom: 20 }}><div style={{ display: "flex", fontSize: 40 }}>全分野科学検定</div><div style={{ display: "flex", fontSize: 22, color: "#1558d6" }}>{r.definition.kind === "weekly" ? "今週の10問" : r.definition.kind === "lab" ? "みんなの出題ラボ" : "あなたの科学マップ"}</div></div>
    <div style={{ display: "flex", gap: 40, flex: 1, paddingTop: 28 }}>
      <div style={{ display: "flex", flexDirection: "column", width: 460 }}><div style={{ display: "flex", fontSize: 28 }}>{nickname}さん</div><div style={{ display: "flex", fontSize: 22, marginTop: 10, color: "#526580" }}>{r.definition.label}</div><div style={{ display: "flex", fontSize: 96, lineHeight: 1.2, marginTop: 24, color: "#1558d6" }}>{score}</div><div style={{ display: "flex", fontSize: 22, marginTop: 4 }}>{scale}</div><div style={{ display: "flex", fontSize: 20, marginTop: 24 }}>{formal ? "科学の得意と、まだ知らない世界。" : r.definition.kind === "weekly" ? shared.competitive ? "同じ10問で、あなたも腕試し。" : "参考参加の記録です。" : "解いて、気づいて、良問を育てよう。"}</div></div>
      {formal && !field ? <div style={{ display: "flex", flexDirection: "column", width: 590, gap: 10 }}>{domains.map(d => <div key={d} style={{ display: "flex", alignItems: "center", height: 28, gap: 12 }}><div style={{ width: 230, fontSize: 20 }}>{d}</div><div style={{ display: "flex", width: 215, height: 12, background: "#dbe5f5", borderRadius: 6 }}><div style={{ height: 12, width: `${r.domains[d].score ?? 0}%`, background: "#2467e8", borderRadius: 6 }} /></div><div style={{ display: "flex", fontSize: 19, width: 60, textAlign: "right" }}>{r.domains[d].score ?? "—"}</div></div>)}</div> : <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: 590, padding: "0 25px", borderLeft: "2px solid #d3e1f3" }}>
        <div style={{ display: "flex", fontSize: field ? 38 : 34, lineHeight: 1.6 }}>{field ? r.definition.domain : r.definition.kind === "weekly" ? "友だちも、専門家も。\nみんな同じ問題に挑む。" : "みんなの問いから、\n新しい科学に出会う。"}</div>
        {field ? <div style={{ display: "flex", flexDirection: "column" }}><div style={{ display: "flex", width: "100%", height: 22, background: "#dbe5f5", borderRadius: 11, marginTop: 30 }}><div style={{ height: 22, width: `${field.score ?? 0}%`, background: "#2467e8", borderRadius: 11 }} /></div><div style={{ display: "flex", fontSize: 23, marginTop: 24 }}>{field.score === null ? "測定対象の回答がありません" : `参考幅 ${field.low}–${field.high}点 · ${field.count}問で推定`}</div></div> : <div style={{ display: "flex", flexWrap: "wrap", gap: 12, width: 370, marginTop: 30 }}>{Array.from({ length: r.answerCount }, (_, i) => <div key={i} style={{ display: "flex", width: 56, height: 56, borderRadius: 28, background: i < r.correctCount ? "#2467e8" : "#dbe5f5" }} />)}</div>}
        <div style={{ display: "flex", fontSize: 20, color: "#526580", marginTop: 22 }}>{field ? "気になる分野を、もう20問。" : r.definition.kind==="weekly" ? "何問わかる？科学好きなあの人にも。" : "その気づきが、次の良問になる。"}</div>
      </div>}
    </div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "2px solid #d3e1f3", paddingTop: 18, fontSize: 19 }}><div>制作「理系とーく 川村智祥」</div><div>{r.definition.kind === "weekly" ? "あなたも今週の10問に挑戦 →" : r.definition.kind === "lab" ? "みんなの出題ラボへ →" : "あなたも無料で20問に挑戦 →"}</div></div>
  </div>, await imageOptions());
}

export async function coverImage() {
  return new ImageResponse(<div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", padding: "60px 70px", background: "#f3f7ff", color: "#11213f", fontFamily: "ScienceSans" }}>
    <div style={{ display: "flex", fontSize: 34, color: "#1558d6" }}>全分野科学検定</div><div style={{ display: "flex", flexDirection:"column",fontSize: 82, marginTop: 38, lineHeight: 1.3 }}><div>あなたの科学は、</div><div>どこまで広い？</div></div><div style={{ display: "flex", fontSize: 30, marginTop: 24 }}>10分野を旅する20問。あなたの科学マップを見つけよう。</div><div style={{ display: "flex", justifyContent: "space-between", marginTop: "auto", fontSize: 24 }}><div>無料・登録なしで腕試し</div><div>制作「理系とーく 川村智祥」</div></div>
  </div>, await imageOptions());
}
