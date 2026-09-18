"use client";
import { useState } from "react";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { scienceApi } from "@/src/lib/science/client";
import { EXPERIENCE_SURVEY_VERSION, experienceQuestions, experienceLabel, type ExperienceRecord } from "@/src/lib/science/experience-survey";

export function ExperienceSurvey({ attemptId }: { attemptId: string }) {
  const [open, setOpen] = useState(false), [loading, setLoading] = useState(false), [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState<ExperienceRecord | null>(null), [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function load() {
    setOpen(true); setLoading(true); setError("");
    try { const data = await scienceApi<{ response: ExperienceRecord | null }>("experience_read", { attemptId }); setSaved(data.response); setLoaded(true); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }
  return <AppCard className="mt-6"><h2 className="text-2xl font-black">解いてみて、どうでしたか？</h2>
    <p className="mt-3 text-sm leading-7">難易度と回答テンポの2項目と、任意のひとこと。参加は自由です。感想は運営だけが確認し、スコアやランキングには影響しません。</p>
    {!open ? <AppButton className="mt-4" variant="secondary" onClick={() => void load()}>受験の感想を伝える</AppButton> : <>
      {loading && <p role="status" className="mt-4">回答状況を確認しています…</p>}
      {saved ? <div role="status" className="mt-4 rounded-xl bg-[var(--color-primary-50)] p-4"><p className="font-bold">回答を保存しました。ありがとうございます。</p>
        <ul className="mt-3 grid gap-2 text-sm">{experienceQuestions.map(q => <li key={q.key}>{q.label}：{experienceLabel(q.key, saved.response[q.key])}</li>)}</ul>
        {saved.response.comment && <p className="mt-3 whitespace-pre-wrap text-sm">{saved.response.comment}</p>}</div> : loaded && <form className="mt-5 grid gap-5" onSubmit={async e => {
          e.preventDefault(); if (busy) return;
          const form = new FormData(e.currentTarget); setBusy(true); setError("");
          try { const data = await scienceApi<{ response: ExperienceRecord }>("experience_save", { attemptId, response: {
            version: EXPERIENCE_SURVEY_VERSION, difficulty: form.get("difficulty"), tempo: form.get("tempo"), comment: form.get("comment")
          } }); setSaved(data.response); } catch (issue) { setError((issue as Error).message); } finally { setBusy(false); }
        }}>
          {experienceQuestions.map(q => <fieldset key={q.key} disabled={busy} className="grid gap-2"><legend className="mb-2 font-bold">{q.label}</legend>
            {q.choices.map(([value, label]) => <label key={value} className="flex min-h-11 items-center gap-3 rounded-lg border px-3 py-2 text-sm"><input type="radio" name={q.key} value={value} required />{label}</label>)}
          </fieldset>)}
          <label className="block font-bold">ひとこと（任意）<textarea name="comment" maxLength={2000} rows={3} disabled={busy} className="mt-2 block w-full rounded-xl border p-3 font-normal" placeholder="気になったこと、よかったことなど" /></label>
          <p className="text-xs leading-6">氏名・メールアドレスなどの個人情報は書かないでください。受験内容と合わせて改善に使います。</p>
          <AppButton type="submit" disabled={busy}>{busy ? "保存しています…" : "感想を送信する"}</AppButton>
        </form>}
      {error && <div className="mt-4"><p role="alert" className="text-sm text-red-700">{error}</p>{!loaded && <AppButton className="mt-3" variant="secondary" onClick={() => void load()}>回答状況を再確認</AppButton>}</div>}
    </>}
  </AppCard>;
}
