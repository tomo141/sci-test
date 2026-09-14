import { randomUUID, createHash } from "node:crypto";
import { NextRequest } from "next/server";
import { z } from "zod";
import { verifyTurnstile } from "@/src/lib/security/turnstile";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";
import { checked, context, endpoint, rateLimit, ScienceError } from "@/src/lib/science/server";

export async function POST(request: NextRequest,{params}:{params:Promise<{action:string}>}) {
  return endpoint(request,async()=>{
    const action=z.enum(["request","verify"]).parse((await params).action);
    const raw=await request.text();
    if(raw.length>4096)throw new ScienceError("入力が長すぎます。",413);
    const input=z.object({email:z.string().trim().email().max(254),code:z.string().regex(/^\d{6,10}$/).optional(),captcha:z.string().max(2048).optional(),scienceConsent:z.boolean().optional()}).strict().parse(JSON.parse(raw));
    const ctx=await context(true);
    const email=input.email.toLowerCase();
    const target=createHash("sha256").update(email).digest("hex");
    const allowed=checked(await ctx.db.rpc("science_rate_limit",{p_key:`otp:${action}:${target}`,p_seconds:action==="request"?60:300,p_limit:action==="request"?1:10}));
    if(!allowed)throw new ScienceError("少し待ってからもう一度お試しください。",429,"rate_limited");
    await rateLimit(ctx,`otp-${action}`,action==="request"?3:10,300);
    const auth=await createServerSupabaseClient();
    if(!auth)throw new ScienceError("認証に接続できません。",503);
    if(action==="request"){
      if(!await verifyTurnstile(input.captcha??null))throw new ScienceError("セキュリティ確認を完了してください。",400,"captcha_required");
      const {error}=await auth.auth.signInWithOtp({email,options:{shouldCreateUser:true}});
      if(error)throw new ScienceError("確認コードの送信を受け付けられませんでした。しばらくして再試行してください。",503,"otp_unavailable");
      return {accepted:true};
    }
    if(!input.code)throw new ScienceError("メールの確認コードを入力してください。");
    const current=(await auth.auth.getUser()).data.user;
    if(!current?.email_confirmed_at || current.email?.toLowerCase()!==email){
      const verified=await auth.auth.verifyOtp({email,token:input.code,type:"email"});
      if(verified.error||!verified.data.user?.email_confirmed_at)throw new ScienceError("コードを確認してください。期限切れの場合は再送できます。",400,"invalid_code");
    }
    const linked=await context(true);
    if(!linked.userId)throw new ScienceError("ログインの確認を完了できませんでした。再試行してください。",503);
    if(input.scienceConsent){
      checked(await linked.db.rpc("science_update_consents",{p_user:linked.userId,p_preferences:{science:true,weekly:true,domain_opening:true},p_operation:randomUUID()}));
    }
    return {verified:true};
  });
}
