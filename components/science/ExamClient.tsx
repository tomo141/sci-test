"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { AppButton } from "@/components/ui/AppButton";
import { AnswerActions } from "./AnswerActions";
import { AppCard } from "@/components/ui/AppCard";
import { CheckCircle2, XCircle } from "lucide-react";
import { ExamQuestionCard } from "./ExamQuestionCard";
import { ExamProgressCard } from "./ExamProgressCard";
import { ScienceText } from "./ScienceText";
import { domains, type ScienceDomain } from "@/src/lib/data/taxonomy";
import { definition, type ExamKind, type ExamDefinition } from "@/src/lib/science/definition";
import { RequestError, scienceApi } from "@/src/lib/science/client";
import type { ExamState, PublicAttempt } from "@/src/lib/science/types";
import { briefExplanation } from "@/src/lib/science/answer-feedback";

const pendingSchema = z.object({ attemptId: z.string().uuid(), ordinal: z.number().int().min(0).max(99), token: z.string().uuid(), operationId: z.string().uuid(), selectedIndex: z.number().int().min(0).max(3).nullable() });
type Pending = z.infer<typeof pendingSchema>;
const storageKey = (id: string) => `science-pending:${id}`;

export function ExamClient({ initialAttempt, initialFeedback, kind, initialDomain, refShare }: { initialAttempt?: string; initialFeedback?: number; kind: ExamKind; initialDomain?: ScienceDomain; refShare?: string }) {
  const router = useRouter();
  const [state, setState] = useState<ExamState | null>(null);
  const [plan,setPlan]=useState<{definition:ExamDefinition;registrationRequired:boolean;newAttempts:boolean}|null>(null);
  const [domain, setDomain] = useState<ScienceDomain>(initialDomain ?? "数学");
  const [selected, setSelected] = useState<number | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<RequestError | null>(null);
  const [saveNote, setSaveNote] = useState("");
  const [pending, setPending] = useState<Pending | null>(null);
  const [explanation, setExplanation] = useState<ExamState["explanation"]>();
  const [instantKeyboard, setInstantKeyboard] = useState(false);
  const answering = useRef(false);
  const title = useRef<HTMLHeadingElement>(null);
  const paused=error?.code==="item_unavailable";
  const desired = plan?.definition ?? definition(kind, domain);
  const registrationPath = `/signup?next=${encodeURIComponent(`/exam?kind=${kind}${kind === "domain" ? `&domain=${domain}` : ""}`)}`;

  const adopt = useCallback((next: ExamState) => {
    setState(next); setSelected(null); setExplanation(next.explanation);
    if (next.attempt.state === "completed" && !next.explanation) router.replace(`/result?attempt=${next.attempt.id}`);
    try {
      const raw = localStorage.getItem(storageKey(next.attempt.id));
      const saved = raw ? pendingSchema.safeParse(JSON.parse(raw)) : null;
      if (saved?.success && saved.data.attemptId === next.attempt.id && saved.data.ordinal === next.attempt.ordinal) { setPending(saved.data); setSelected(saved.data.selectedIndex); }
      else { localStorage.removeItem(storageKey(next.attempt.id)); setPending(null); }
    } catch { setPending(null); }
    requestAnimationFrame(() => title.current?.focus());
  }, [router]);
  const refresh = useCallback(async (id: string, feedbackOrdinal?: number) => {
    setBusy(true); setError(null);
    try { const next=await scienceApi<ExamState>("state", { attemptId: id, ...(feedbackOrdinal !== undefined ? { feedbackOrdinal } : {}) }); window.history.replaceState(null,"",`/exam?attempt=${next.attempt.id}${next.explanation ? `&feedback=${next.explanation.ordinal}` : ""}`); adopt(next); }
    catch (e) { setError(e as RequestError); }
    finally { setBusy(false); }
  }, [adopt]);
  useEffect(() => { if (initialAttempt) void refresh(initialAttempt, initialFeedback); }, [initialAttempt, initialFeedback, refresh]);
  useEffect(()=>{
    if(initialAttempt)return;
    let active=true;setPlan(null);
    scienceApi<{definition:ExamDefinition;registrationRequired:boolean;newAttempts:boolean}>("plan",{kind,...(kind==="domain"?{domain}:{}),...(refShare?{refShare}:{})}).then((value)=>{if(active){setPlan(value);setError(null);}}).catch((e)=>{if(active)setError(e as RequestError);});
    return ()=>{active=false;};
  },[initialAttempt,kind,domain,refShare]);

  async function start() {
    setBusy(true); setError(null);
    try {
      const next = await scienceApi<ExamState>("start", { kind, ...(kind === "domain" ? { domain } : {}), ...(refShare ? { refShare } : {}) });
      window.history.replaceState(null, "", `/exam?attempt=${next.attempt.id}`);
      adopt(next);
    } catch (e) { setError(e as RequestError); } finally { setBusy(false); }
  }
  const answer = useCallback(async (choice: number | null = selected) => {
    if (answering.current || busy || explanation || paused || !state?.question || (choice === null && !state.question.withdrawn && !pending)) return;
    answering.current = true;
    setBusy(true); setError(null); setSaveNote("送信中…");
    const input = pending ?? { attemptId: state.attempt.id, ordinal: state.question.ordinal, token: state.question.token, operationId: crypto.randomUUID(), selectedIndex: state.question.withdrawn ? null : choice };
    setPending(input);
    try { localStorage.setItem(storageKey(input.attemptId), JSON.stringify(input)); } catch { /* The operation remains available in memory for retry. */ }
    try {
      const saved = await scienceApi<{ attempt: PublicAttempt; explanation?: ExamState["explanation"]; progress?: ExamState["progress"] }>("answer", input);
      setSaveNote("保存済み"); setPending(null);
      setState({ ...state, attempt: saved.attempt, question: null, progress: saved.progress });
      try { localStorage.removeItem(storageKey(input.attemptId)); } catch { /* Server progress wins when the page is opened again. */ }
      if (saved.explanation) {
        setExplanation(saved.explanation);
        window.history.replaceState(null, "", `/exam?attempt=${saved.attempt.id}&feedback=${saved.explanation.ordinal}`);
        requestAnimationFrame(() => title.current?.focus());
      }
      else if (saved.attempt.state === "completed") router.replace(`/result?attempt=${saved.attempt.id}`);
      else await refresh(saved.attempt.id);
    } catch (e) { setSaveNote("保存を確認できません。再送して確認できます。"); setError(e as RequestError); }
    finally { answering.current = false; setBusy(false); }
  }, [busy, explanation, paused, pending, refresh, router, selected, state]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || event.isComposing || event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || target.closest('textarea, select, input:not([type="radio"]):not([type="checkbox"]):not([type="button"]):not([type="submit"]), [role="dialog"]'))) return;
      if (event.key === " " && explanation && !busy && !answering.current) {
        if (target instanceof HTMLElement && target.closest('button, a, input, summary')) return;
        event.preventDefault();
        if (state) void refresh(state.attempt.id);
        return;
      }
      if (
          !/^[1-4]$/.test(event.key) || !state?.question || state.attempt.state !== "active" || state.question.withdrawn || explanation || busy || pending || paused || answering.current) return;
      const choice = Number(event.key) - 1;
      if (choice >= state.question.choices.length) return;
      event.preventDefault();
      setSelected(choice);
      if (instantKeyboard) void answer(choice);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [answer, busy, explanation, instantKeyboard, paused, pending, refresh, state]);

  const errorBox = error && <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-4" role="alert"><p>{error.message}</p>
    {paused&&<div className="mt-3 flex flex-wrap gap-3"><AppButton href="/mypage" variant="secondary">保存した進捗をマイページで見る</AppButton>{!state&&typeof error.details.attemptId==="string"&&<AppButton onClick={()=>void refresh(error.details.attemptId as string)} disabled={busy}>この受験の再開を確認</AppButton>}</div>}
    {error.code === "registration_required" && <AppButton href={registrationPath} className="mt-3">無料登録して続ける</AppButton>}
    {error.code === "active_attempt" && typeof error.details.attemptId === "string" && <div className="mt-3 flex flex-wrap gap-3"><AppButton onClick={() => void refresh(error.details.attemptId as string)}>中断した受験を再開</AppButton><AppButton variant="secondary" onClick={async () => { if (window.confirm("中断した受験を終了しますか？ 保存済みの回答は残ります。")) { try { await scienceApi("abandon", { attemptId: error.details.attemptId }); setError(null); } catch(e) { setError(e as RequestError); } } }}>中断した受験を終了</AppButton></div>}
  </div>;
  if (!state) return <main className="page-container max-w-3xl py-10"><AppCard>
    <p className="text-sm font-bold text-[var(--color-primary-700)]">全分野科学検定</p><h1 className="mt-3 text-3xl font-black">{initialAttempt ? "保存した受験を開く" : desired.label}</h1>
    {!initialAttempt && <><p className="mt-5 leading-8">{kind === "trial" ? "10の科学分野から2問ずつ。まずは20問で、今の自分の広がりを見てみましょう。" : kind === "full" ? `本試験は新たに${desired.count}問。10分野を${desired.count/10}問ずつ測ります。` : kind === "weekly" ? "毎週月曜更新。みんな同じ10問に挑戦し、正答数でランキング。" : kind === "lab" ? "投稿された問題だけを10問ずつ。解いて、つくって、科学の良問を育てよう。" : "選んだ分野を20問。もう少し詳しく知るための受験です。"}</p>
      {kind === "domain" && <label className="mt-6 block font-bold">受験する分野<select value={domain} onChange={(e) => setDomain(e.target.value as ScienceDomain)} className="mt-2 block min-h-12 w-full rounded-xl border p-3">{domains.map((d) => <option key={d}>{d}</option>)}</select></label>}
      <p className="mt-5 text-sm leading-7">時間制限はありません。途中の回答は自動保存され、同じ端末から再開できます。登録後は別の端末でも続けられます。回答の直後に正誤・正解・短い解説を表示します。詳しい解説と出典は、読みたいときに開けます。</p>
      {plan?.newAttempts&&plan.registrationRequired?<div className="mt-6"><p className="leading-7">この受験は無料登録後に楽しめます。メールの確認コードで、ここから続きを始めましょう。</p><AppButton href={registrationPath} className="mt-4 w-full">無料登録して、この受験へ</AppButton></div>:<><label className="mt-6 flex items-start gap-3 rounded-xl bg-[var(--color-page)] p-4"><input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 h-5 w-5" /><span>検索・AI・ほかの人の助けを使わず、自分で答えます。</span></label>
      <AppButton onClick={() => void start()} disabled={!agreed || busy || !plan?.newAttempts} className="mt-6 w-full">{busy ? "受験を準備中…" : !plan ? "受験条件を確認中…" : !plan.newAttempts ? "公開準備中" : "受験を始める"}</AppButton></>}</>}
    {errorBox}{error&&!initialAttempt&&!plan&&<AppButton onClick={()=>window.location.reload()} className="mt-4">受験条件を再読み込み</AppButton>}{initialAttempt && <AppButton onClick={() => void refresh(initialAttempt)} disabled={busy} className="mt-6">{busy ? "読み込み中…" : "再読み込み"}</AppButton>}
  </AppCard></main>;
  const displayed = explanation?.display ?? state.question;
  return <main className="page-container py-8">
    <div className="mb-6"><h1 className="text-3xl font-black md:text-4xl">{state.attempt.definition.kind === "trial" ? "腕試し受験ページ" : state.attempt.definition.label}</h1>
      <p className="mt-2 font-bold text-[var(--color-ink-soft)]">{state.attempt.definition.kind === "domain" ? state.attempt.definition.domain : "科学の知識"}をチェックしよう！</p>
    </div>
    {state.attempt.definition.kind==="weekly"&&!state.attempt.competitive&&<p className="mb-4 rounded-xl bg-amber-50 p-4 text-sm leading-7">今回は参考参加です。締切後の再開、再挑戦、作問・事前閲覧などの記録があるため、競争順位には入りません。</p>}
    <ExamProgressCard state={state} />
    {state.attempt.state === "abandoned" && <AppCard><h2 className="text-2xl font-black">終了した受験です</h2><p className="mt-4 leading-8">保存済みの回答は残っています。新しい受験はマイページから始められます。</p><AppButton className="mt-5" href="/mypage">マイページへ</AppButton></AppCard>}
    {displayed && !paused && state.attempt.state !== "abandoned" && <ExamQuestionCard question={displayed}
      selected={explanation?.display.selectedIndex ?? selected} answered={!!explanation} correctIndex={explanation?.display.correctIndex ?? null}
      disabled={busy || !!pending} titleRef={title} lab={state.attempt.definition.kind === "lab"}
      onChoice={index => { setSelected(index); void answer(index); }}>
      {!explanation && <>
        {!displayed.withdrawn && <div className="mt-5 text-sm leading-7"><label className="flex items-start gap-3"><input type="checkbox" checked={instantKeyboard} disabled={busy || !!pending} onChange={e => setInstantKeyboard(e.target.checked)} className="mt-1 h-5 w-5"/><span>キーボードの1,2,3,4で即回答</span></label>
          <p className="mt-2 text-[var(--color-muted)]">{instantKeyboard ? "クリック・タップも数字キーも、すぐに回答を確定します。" : "クリック・タップは即回答。数字キーは選択だけで、下のボタンで確定します。"}</p>
        </div>}
        <AppButton disabled={busy || (selected===null && !displayed.withdrawn && !pending)} onClick={() => void answer()} className="mt-6 w-full">{busy ? "保存中…" : pending ? "同じ操作を再送する" : displayed.withdrawn ? "未回答でスキップして次へ" : "この回答を確定する"}</AppButton>
      </>}
      {explanation && <div key={explanation.ordinal} className="mt-6">
        <p className="sr-only">第{explanation.ordinal+1}問の答え</p>
        <div className={`flex items-center gap-4 rounded-2xl border p-4 ${explanation.correct === null ? "border-amber-300 bg-amber-50" : explanation.correct ? "border-[var(--color-success-700)] bg-[var(--color-success-100)]" : "border-[var(--color-danger-700)] bg-[var(--color-danger-100)]"}`}>
          {explanation.correct !== null && (explanation.correct ? <CheckCircle2 aria-hidden="true" size={34} className="shrink-0 text-[var(--color-success-700)]" /> : <XCircle aria-hidden="true" size={34} className="shrink-0 text-[var(--color-danger-700)]" />)}
          <h2 className="text-xl font-black">{explanation.correct === null ? "この問題は採点対象外です" : explanation.correct ? "正解！" : "不正解"}</h2>
        </div>
        {explanation.correct === false && <p className="mt-4 whitespace-pre-wrap text-sm">あなたの回答：<ScienceText>{explanation.selectedAnswer}</ScienceText></p>}
        <p className="mt-4 whitespace-pre-wrap text-lg font-bold">正解：<ScienceText>{explanation.correctAnswer}</ScienceText></p>
        {explanation.correctionNote && <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm whitespace-pre-wrap">訂正がありました。<ScienceText>{explanation.correctionNote}</ScienceText></p>}
        <p className="mt-4 whitespace-pre-wrap break-words leading-8"><ScienceText>{briefExplanation(explanation.content.explanation)}</ScienceText></p>
        <details className="mt-5 rounded-xl border p-4"><summary className="cursor-pointer font-bold">詳しい解説・出典を見る</summary>
          {briefExplanation(explanation.content.explanation) !== explanation.content.explanation.trim() && <p className="mt-4 whitespace-pre-wrap break-words leading-8"><ScienceText>{explanation.content.explanation}</ScienceText></p>}
          {!!explanation.content.distractorRationales?.some(Boolean) && <div className="mt-4"><h3 className="font-bold">選択肢ごとの理由</h3><dl className="mt-3 grid gap-4 md:grid-cols-2">{explanation.content.choices.map((choice, i) => explanation.content.distractorRationales[i] && <div key={i}><dt className="whitespace-pre-wrap break-words font-medium"><ScienceText>{choice}</ScienceText>{i === explanation.content.correctIndex && "（正解）"}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm leading-7"><ScienceText>{explanation.content.distractorRationales[i]}</ScienceText></dd></div>)}</dl></div>}
          <div className="mt-4 text-sm leading-7"><h3 className="font-bold">出典</h3>{explanation.content.sources?.map((source,i) => <p key={i}>{source.url && /^https?:\/\//.test(source.url) ? <a href={source.url} target="_blank" rel="noreferrer" className="break-words underline">{source.title}</a> : source.title}</p>)}</div>
        </details>
        <AnswerActions key={explanation.ordinal} attemptId={state.attempt.id} explanation={explanation} signedIn={state.signedIn} />
      </div>}
      <p role="status" className="mt-4 text-sm text-[var(--color-muted)]">{saveNote}</p>
    </ExamQuestionCard>}
    {explanation && <><AppButton disabled={busy} className="mt-6 w-full" onClick={() => void refresh(state.attempt.id)}>{busy ? "読み込み中…" : state.attempt.state === "completed" ? "結果を見る" : "次の問題へ"}</AppButton><p className="mt-3 text-center text-xs font-bold text-[var(--color-muted)]">スペースキーでも{state.attempt.state === "completed" ? "結果へ" : "次の問題へ"}進めます</p></>}
    {errorBox}
    {(!state.question||paused) && !explanation && state.attempt.state === "active" && <AppButton disabled={busy} className="mt-4" onClick={() => void refresh(state.attempt.id)}>{busy ? "次の問題を取得中…" : paused?"運営の確認後、再開する":"次の問題を読み込む"}</AppButton>}
    {error?.code === "conflict" && <AppButton className="mt-4" onClick={() => void refresh(state.attempt.id)}>最新の進捗を読み込む</AppButton>}
    <p className="mt-5 text-sm leading-7 text-[var(--color-muted)]">確定した回答は変更できません。このページを閉じても保存済みの回答は残ります。</p><AppButton href="/mypage" variant="ghost" className="mt-4">中断してマイページへ</AppButton>
  </main>;
}
