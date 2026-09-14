"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { domains, type ScienceDomain } from "@/src/lib/data/taxonomy";
import { definition, type ExamKind } from "@/src/lib/science/definition";
import { RequestError, scienceApi } from "@/src/lib/science/client";
import type { ExamState, PublicAttempt } from "@/src/lib/science/types";

const pendingSchema = z.object({ attemptId: z.string().uuid(), ordinal: z.number().int().min(0).max(99), token: z.string().uuid(), operationId: z.string().uuid(), selectedIndex: z.number().int().min(0).max(3) });
type Pending = z.infer<typeof pendingSchema>;
const storageKey = (id: string) => `science-pending:${id}`;

export function ExamClient({ initialAttempt, kind, initialDomain, refShare }: { initialAttempt?: string; kind: ExamKind; initialDomain?: ScienceDomain; refShare?: string }) {
  const router = useRouter();
  const [state, setState] = useState<ExamState | null>(null);
  const [domain, setDomain] = useState<ScienceDomain>(initialDomain ?? "数学");
  const [selected, setSelected] = useState<number | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<RequestError | null>(null);
  const [saveNote, setSaveNote] = useState("");
  const [pending, setPending] = useState<Pending | null>(null);
  const [explanation, setExplanation] = useState<ExamState["explanation"]>();
  const title = useRef<HTMLHeadingElement>(null);
  const desired = definition(kind, domain);
  const registrationPath = `/signup?next=${encodeURIComponent(`/exam?kind=${kind}${kind === "domain" ? `&domain=${domain}` : ""}`)}`;

  const adopt = useCallback((next: ExamState) => {
    setState(next); setSelected(null);
    if (next.attempt.state === "completed") router.replace(`/result?attempt=${next.attempt.id}`);
    try {
      const raw = localStorage.getItem(storageKey(next.attempt.id));
      const saved = raw ? pendingSchema.safeParse(JSON.parse(raw)) : null;
      if (saved?.success && saved.data.attemptId === next.attempt.id && saved.data.ordinal === next.attempt.ordinal) { setPending(saved.data); setSelected(saved.data.selectedIndex); }
      else { localStorage.removeItem(storageKey(next.attempt.id)); setPending(null); }
    } catch { setPending(null); }
    requestAnimationFrame(() => title.current?.focus());
  }, [router]);
  const refresh = useCallback(async (id: string) => {
    setBusy(true); setError(null);
    try { adopt(await scienceApi<ExamState>("state", { attemptId: id })); }
    catch (e) { setError(e as RequestError); }
    finally { setBusy(false); }
  }, [adopt]);
  useEffect(() => { if (initialAttempt) void refresh(initialAttempt); }, [initialAttempt, refresh]);

  async function start() {
    setBusy(true); setError(null);
    try {
      const next = await scienceApi<ExamState>("start", { kind, ...(kind === "domain" ? { domain } : {}), ...(refShare ? { refShare } : {}) });
      window.history.replaceState(null, "", `/exam?attempt=${next.attempt.id}`);
      adopt(next);
    } catch (e) { setError(e as RequestError); } finally { setBusy(false); }
  }
  async function answer() {
    if (!state?.question || selected === null) return;
    setBusy(true); setError(null); setSaveNote("送信中…");
    const input = pending ?? { attemptId: state.attempt.id, ordinal: state.question.ordinal, token: state.question.token, operationId: crypto.randomUUID(), selectedIndex: selected };
    setPending(input);
    try { localStorage.setItem(storageKey(input.attemptId), JSON.stringify(input)); } catch { /* The operation remains available in memory for retry. */ }
    try {
      const saved = await scienceApi<{ attempt: PublicAttempt; explanation?: ExamState["explanation"] }>("answer", input);
      setSaveNote("保存済み"); setPending(null);
      setState({ ...state, attempt: saved.attempt, question: null });
      try { localStorage.removeItem(storageKey(input.attemptId)); } catch { /* Server progress wins when the page is opened again. */ }
      if (saved.attempt.state === "completed") { router.replace(`/result?attempt=${saved.attempt.id}`); return; }
      if (saved.explanation) { setExplanation(saved.explanation); setState({ ...state, attempt: saved.attempt }); }
      else await refresh(saved.attempt.id);
    } catch (e) { setSaveNote("保存を確認できません。再送して確認できます。"); setError(e as RequestError); }
    finally { setBusy(false); }
  }

  const errorBox = error && <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-4" role="alert"><p>{error.message}</p>
    {error.code === "registration_required" && <AppButton href={registrationPath} className="mt-3">無料登録して続ける</AppButton>}
    {error.code === "active_attempt" && typeof error.details.attemptId === "string" && <div className="mt-3 flex flex-wrap gap-3"><AppButton onClick={() => void refresh(error.details.attemptId as string)}>中断した受験を再開</AppButton><AppButton variant="secondary" onClick={async () => { if (window.confirm("中断した受験を終了しますか？ 保存済みの回答は残ります。")) { try { await scienceApi("abandon", { attemptId: error.details.attemptId }); setError(null); } catch(e) { setError(e as RequestError); } } }}>中断した受験を終了</AppButton></div>}
  </div>;
  if (!state) return <main className="page-container max-w-3xl py-10"><AppCard>
    <p className="text-sm font-bold text-[var(--color-primary-700)]">全分野科学検定</p><h1 className="mt-3 text-3xl font-black">{initialAttempt ? "保存した受験を開く" : desired.label}</h1>
    {!initialAttempt && <><p className="mt-5 leading-8">{kind === "trial" ? "10の科学分野から2問ずつ。まずは20問で、今の自分の広がりを見てみましょう。" : kind === "full" ? "本試験は新たに50問。10分野を5問ずつ測ります。" : kind === "weekly" ? "毎週月曜更新。みんな同じ10問に挑戦し、正答数でランキング。" : kind === "lab" ? "投稿された問題だけを10問ずつ。解いて、つくって、科学の良問を育てよう。" : "選んだ分野を20問。もう少し詳しく知るための受験です。"}</p>
      {kind === "domain" && <label className="mt-6 block font-bold">受験する分野<select value={domain} onChange={(e) => setDomain(e.target.value as ScienceDomain)} className="mt-2 block min-h-12 w-full rounded-xl border p-3">{domains.map((d) => <option key={d}>{d}</option>)}</select></label>}
      <p className="mt-5 text-sm leading-7">時間制限はありません。途中の回答は自動保存され、同じ端末から再開できます。登録後は別の端末でも続けられます。{kind !== "lab" && "正解・解説は完了後に表示します。"}</p>
      <label className="mt-6 flex items-start gap-3 rounded-xl bg-[var(--color-page)] p-4"><input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 h-5 w-5" /><span>検索・AI・ほかの人の助けを使わず、自分で答えます。</span></label>
      <AppButton onClick={() => void start()} disabled={!agreed || busy} className="mt-6 w-full">{busy ? "受験を準備中…" : "受験を始める"}</AppButton></>}
    {errorBox}{initialAttempt && <AppButton onClick={() => void refresh(initialAttempt)} disabled={busy} className="mt-6">{busy ? "読み込み中…" : "再読み込み"}</AppButton>}
  </AppCard></main>;
  return <main className="page-container max-w-3xl py-8">
    <div className="mb-5"><p className="font-bold">{state.attempt.definition.label}</p><p className="my-2 text-sm">{state.attempt.ordinal} / {state.attempt.definition.count}問 保存済み</p><ProgressBar value={100*state.attempt.ordinal/state.attempt.definition.count} /></div>
    <AppCard>
      {state.question && !explanation && <><p className="text-sm text-[var(--color-muted)]">第{state.question.ordinal+1}問 · {state.question.domain} / {state.question.subdomain}</p>
        <h1 ref={title} tabIndex={-1} className="mt-4 whitespace-pre-wrap text-xl font-bold leading-9 outline-none">{state.question.question}</h1>
        <fieldset disabled={busy || !!pending} className="mt-6 grid gap-3"><legend className="sr-only">答えを一つ選んでください</legend>{state.question.choices.map((text,i) => <label key={i} className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 ${selected === i ? "border-[var(--color-primary-700)] bg-[var(--color-primary-50)]" : "border-[var(--color-border)]"}`}><input type="radio" name="answer" value={i} checked={selected===i} onChange={() => setSelected(i)} className="mt-1 h-5 w-5" /><span className="whitespace-pre-wrap leading-7">{text}</span></label>)}</fieldset>
        <AppButton disabled={busy || selected===null} onClick={() => void answer()} className="mt-6 w-full">{busy ? "保存中…" : pending ? "同じ回答を再送する" : "この回答を確定する"}</AppButton>
      </>}
      {explanation && <><h1 className="text-2xl font-black">{explanation.correctIndex === explanation.selectedIndex ? "正解！" : "解説を見てみよう"}</h1><p className="mt-4 whitespace-pre-wrap leading-8">{explanation.content.explanation}</p><AppButton className="mt-6" onClick={() => { setExplanation(undefined); void refresh(state.attempt.id); }}>次の問題へ</AppButton></>}
      <p role="status" className="mt-4 text-sm text-[var(--color-muted)]">{saveNote}</p>{errorBox}
      {!state.question && !explanation && state.attempt.state === "active" && <AppButton disabled={busy} className="mt-4" onClick={() => void refresh(state.attempt.id)}>{busy ? "次の問題を取得中…" : "次の問題を読み込む"}</AppButton>}
      {error?.code === "conflict" && <AppButton className="mt-4" onClick={() => void refresh(state.attempt.id)}>最新の進捗を読み込む</AppButton>}
    </AppCard><p className="mt-5 text-sm leading-7 text-[var(--color-muted)]">確定した回答は変更できません。このページを閉じても保存済みの回答は残ります。</p><AppButton href="/mypage" variant="ghost" className="mt-4">中断してマイページへ</AppButton>
  </main>;
}
