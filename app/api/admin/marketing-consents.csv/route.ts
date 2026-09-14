import { NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/src/lib/supabase/server";
import { csvDocument } from "@/src/lib/science/csv";

type ConsentRow={user_id:string;email:string;nickname:string;topic:string;version:string;updated_at:string};
const privateHeaders={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const failure=(error:string,status:number)=>NextResponse.json({error},{status,headers:privateHeaders});
export async function GET() {
  const auth=await createServerSupabaseClient();
  const user=await auth?.auth.getUser();
  const actor=user?.data.user;
  if(!actor?.email_confirmed_at)return failure("ログインが必要です。",401);
  const db=createServiceRoleClient();
  if(!db)return failure("保存先に接続できません。",503);
  const admin=await db.from("science_admins").select("user_id").eq("user_id",actor.id).maybeSingle();
  if(admin.error)return failure("権限を確認できません。",503);
  if(!admin.data)return failure("管理者権限が必要です。",403);
  const limit=await db.rpc("science_rate_limit",{p_key:`consent-export:${actor.id}`,p_seconds:60,p_limit:2});
  if(limit.error)return failure("処理を開始できません。",503);
  if(!limit.data)return failure("少し待ってから再試行してください。",429);
  const rows:ConsentRow[]=[];let cursor:ConsentRow|undefined;
  for(let page=0;page<100;page++){
    const result=await db.rpc("science_consent_export_page",{p_actor:actor.id,p_after_user:cursor?.user_id??null,p_after_topic:cursor?.topic??null});
    if(result.error||!Array.isArray(result.data))return failure("配信同意を取得できません。",503);
    const next=result.data as ConsentRow[];
    rows.push(...next);cursor=next.at(-1);
    if(next.length<1000)break;
    if(page===99)return failure("件数が多いため分割出力が必要です。運営へご連絡ください。",503);
  }
  const generatedAt=new Date().toISOString();
  const audit=await db.from("science_audit").insert({actor_id:actor.id,action:"mail_consents_exported",target:"science_consents",reason:"Administrator requested current mailing consent export",detail:{rows:rows.length,generatedAt,columns:["email","nickname","topic","version","updated_at"]}});
  if(audit.error)return failure("出力の記録に失敗しました。再試行してください。",503);
  const header=["メールアドレス","ニックネーム","配信テーマ","同意版","同意設定更新日時","出力日時"];
  return new NextResponse(csvDocument([header,...rows.map(r=>[r.email,r.nickname,r.topic,r.version,r.updated_at,generatedAt])]),{headers:{...privateHeaders,"Content-Type":"text/csv; charset=utf-8","Content-Disposition":'attachment; filename="marketing-consents.csv"'}});
}
