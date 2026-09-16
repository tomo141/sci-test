"use client";
import { useRef, useState } from "react";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import type { ScienceDomain } from "@/src/lib/data/taxonomy";
import { scienceApi } from "@/src/lib/science/client";
import type { AssessmentData } from "@/src/lib/science/knowledge-assessments";
import { KNOWLEDGE_LEVEL_VERSION, scopeLabel, type KnowledgeLevel, type KnowledgeScope } from "@/src/lib/science/knowledge-levels";
import { KnowledgeLevelRadios } from "./KnowledgeLevelRadios";

export function KnowledgeAssessment({ attemptId, initialDomain }: { attemptId: string; initialDomain: ScienceDomain }) {
  const [data, setData] = useState<AssessmentData | null>(null), [open, setOpen] = useState(false), [busy, setBusy] = useState(false);
  const [scope, setScope] = useState<KnowledgeScope>({ domain: initialDomain, subdomain: null });
  const [level, setLevel] = useState<KnowledgeLevel | null | undefined>(undefined), [error, setError] = useState(""), [note, setNote] = useState("");
  const operation = useRef<string | null>(null);
  function chooseScope(next: KnowledgeScope, source = data) {
    setScope(next); setLevel(source?.answers.find(a => a.scope.domain === next.domain && a.scope.subdomain === next.subdomain)?.level);
    operation.current = null; setNote(""); setError("");
  }
  async function load() {
    setBusy(true); setError("");
    try {
      const next = await scienceApi<AssessmentData>("load", { attemptId }, "science-levels");
      setData(next); chooseScope({ domain: next.scopes.find(s => s.domain === initialDomain)?.domain ?? next.scopes[0]?.domain ?? initialDomain, subdomain: null }, next); setOpen(true);
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  async function save() {
    if (level === undefined) return;
    setBusy(true); setError(""); operation.current ??= crypto.randomUUID();
    try {
      const saved = await scienceApi<{ updatedAt: string }>("save", { attemptId, operationId: operation.current, scope, version: KNOWLEDGE_LEVEL_VERSION, level }, "science-levels");
      setData(previous => previous && ({ ...previous, answers: [...previous.answers.filter(a => a.scope.domain !== scope.domain || a.scope.subdomain !== scope.subdomain), { scope, level, updatedAt: saved.updatedAt }] }));
      operation.current = null; setOpen(false); setNote(`${scopeLabel(scope)}の回答を保存しました。ありがとうございます。`);
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  return <AppCard className="mt-6">
    <h2 className="text-xl font-black">あなたの感覚で、問題を育てる</h2>
    <p className="mt-3 text-sm leading-7">どの段階の問題なら解けそうですか？ 任意で1分野ずつ教えてください。回答は非公開で、問題の難度や段階の説明を確かめるために使います。</p>
    {note && <p role="status" className="mt-4 rounded-xl bg-green-50 p-4">{note}</p>}
    {!open && <AppButton className="mt-4" variant="secondary" disabled={busy} onClick={() => void load()}>{busy ? "読み込み中…" : note ? "別の分野を答える・回答を見直す" : "1分野だけ答える（任意）"}</AppButton>}
    {open && data && <fieldset disabled={busy} className="mt-5 grid gap-5">
      <fieldset><legend className="mb-2 font-bold">大分野を選ぶ</legend><div className="flex flex-wrap gap-2">{[...new Set(data.scopes.map(s => s.domain))].map(d => <label key={d} className="flex gap-2 rounded-xl border p-3 text-sm"><input type="radio" name="assessment-domain" checked={scope.domain === d} onChange={() => chooseScope({ domain: d, subdomain: null })}/>{d}</label>)}</div></fieldset>
      <fieldset><legend className="mb-2 font-bold">今回答える範囲</legend><div className="flex flex-wrap gap-2">{data.scopes.filter(s => s.domain === scope.domain).map(s => <label key={s.subdomain ?? "whole"} className="flex gap-2 rounded-xl border p-3 text-sm"><input type="radio" name="assessment-scope" checked={scope.subdomain === s.subdomain} onChange={() => chooseScope(s)}/>{s.subdomain ? `小分野：${s.subdomain}` : `大分野：${s.domain} 全体`}</label>)}</div><p className="mt-2 text-xs leading-6">大分野全体と小分野は別々に記録します。一方の回答を、もう一方へ自動で当てはめません。</p></fieldset>
      <KnowledgeLevelRadios scope={scope} name="assessment-level" value={level} onChange={next => { setLevel(next); operation.current = null; setNote(""); }} purpose="self"/>
      <div className="flex flex-wrap gap-3"><AppButton disabled={busy || level === undefined} onClick={() => void save()}>{busy ? "保存中…" : "この回答を保存"}</AppButton><AppButton variant="ghost" onClick={() => setOpen(false)}>今回は答えない</AppButton></div>
    </fieldset>}
    {error && <p role="alert" className="mt-4 rounded-xl bg-amber-50 p-4">{error}</p>}
  </AppCard>;
}
