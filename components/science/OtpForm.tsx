"use client";
import { useState } from "react";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { TurnstileBox } from "@/components/ui/TurnstileBox";
import { safeAuthRedirect } from "@/src/lib/security/redirect";

export function OtpForm({ next, signup=false }:{next:string;signup?:boolean}){
  const [email,setEmail]=useState("");const [code,setCode]=useState("");const [sent,setSent]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [consent,setConsent]=useState(false);
  async function submit(form:HTMLFormElement){
    setBusy(true);setError("");
    try{
      const captcha=new FormData(form).get("cf-turnstile-response");
      const response=await fetch(`/api/science-auth/${sent?"verify":"request"}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,...(sent?{code,scienceConsent:consent}:{}),...(typeof captcha==="string"?{captcha}:{})})});
      const data=await response.json();if(!response.ok)throw new Error(data.error??"処理を完了できませんでした。");
      if(sent)window.location.assign(safeAuthRedirect(next,window.location.origin));else setSent(true);
    }catch(e){setError((e as Error).message||"通信できませんでした。再試行してください。");}finally{setBusy(false);}
  }
  return <main className="page-container max-w-xl py-10"><AppCard><p className="text-sm font-bold text-[var(--color-primary-700)]">全分野科学検定</p><h1 className="mt-3 text-3xl font-black">{signup?"無料登録して、続きを楽しもう":"確認コードでログイン"}</h1><p className="mt-4 leading-8">メールアドレスに届く確認コードで登録・ログインできます。受験履歴、中断再開、復習を同じアカウントに保存します。</p>
    <form className="mt-6 grid gap-5" onSubmit={(e)=>{e.preventDefault();void submit(e.currentTarget);}}>
      <label className="font-bold">メールアドレス<input type="email" name="email" value={email} onChange={(e)=>setEmail(e.target.value)} required autoComplete="email" maxLength={254} disabled={sent||busy} className="mt-2 block min-h-12 w-full rounded-xl border p-3 font-normal"/></label>
      {sent?<><p role="status" className="text-sm leading-7">送信を受け付けました。メールに記載された数字のコードを入力してください。</p><label className="font-bold">確認コード<input value={code} onChange={(e)=>setCode(e.target.value.replace(/\D/g,"").slice(0,10))} type="text" inputMode="numeric" autoComplete="one-time-code" required pattern="[0-9]{6,10}" className="mt-2 block min-h-12 w-full rounded-xl border p-3 text-2xl tracking-widest" autoFocus/></label></>:<TurnstileBox/>}
      {signup&&<label className="flex items-start gap-3 rounded-xl bg-[var(--color-page)] p-4"><input type="checkbox" checked={consent} onChange={(e)=>setConsent(e.target.checked)} className="mt-1 h-5 w-5 shrink-0"/><span className="text-sm leading-7">科学の案内メールを受け取る（任意）。初回の案内2通、週1回の「今週の10問」、希望分野の公開通知。科学の勉強会・専門家紹介・理系とーくバーの企画もご案内します。差出人は「ともよし｜全分野科学検定」。配信停止後も受験・保存は使えます。</span></label>}
      <p className="text-xs leading-6"><a href="/terms" className="underline">利用規約</a>・<a href="/privacy" className="underline">プライバシーポリシー</a>を確認して進んでください。</p>
      {error&&<p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm">{error}</p>}
      <AppButton type="submit" disabled={busy}>{busy?"確認中…":sent?"コードを確認して続ける":"確認コードを受け取る"}</AppButton>
      {sent&&<AppButton variant="ghost" disabled={busy} onClick={()=>{setSent(false);setCode("");setError("");}}>メールアドレスの修正・コードの再送</AppButton>}
    </form>
  </AppCard></main>;
}
