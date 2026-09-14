import { type ScienceDomain } from "@/src/lib/data/taxonomy";
import { scoreResponses } from "./model";
import { checked, ScienceError, type Context } from "./server";
import { publicAttempt } from "./engine";
import { refreshCorrectedAttempt } from "./corrections";
import { currentEstimate } from "./current";
import type { Attempt, AttemptResult } from "./types";

export type ScienceProfile = { public_id: string; nickname: string; bio: string; interests: ScienceDomain[]; is_public: boolean; ranking_opt_in: boolean };
export type Preferences = { science: boolean; weekly: boolean; domain_opening: boolean };
export type AccountData = {
  signedIn: boolean; profile: ScienceProfile | null; preferences: Preferences;
  current: ReturnType<typeof scoreResponses>; history: ReturnType<typeof publicAttempt>[]; historyTotal: number; page: number; recalculationPending: number;
  bests: { id: string; kind: string; domain: string | null; total: number; result: AttemptResult }[];
  badges: { code: string; awarded_at: string }[];
  legacy: { id: string; score: number; answer_count: number; created_at: string }[]; legacyTotal: number;
};

export async function accountData(ctx: Context, page: number): Promise<AccountData> {
  const scoped = <T extends {eq:(key:string,value:string)=>T}>(query:T) => ctx.userId ? query.eq("user_id",ctx.userId) : query.eq("visitor_id",ctx.visitor.id);
  const historyQuery=ctx.db.from("science_attempts").select("*",{count:"exact"});
  const historyPromise=scoped(historyQuery).order("started_at",{ascending:false}).order("id").range(page*20,page*20+19);
  const bestQuery=ctx.db.from("science_personal_bests").select("id,kind,domain,total,result").eq("owner_key",ctx.userId?`user:${ctx.userId}`:`visitor:${ctx.visitor.id}`);
  const historyResponse=await historyPromise;
  const history:Attempt[]=[];
  for(const attempt of checked(historyResponse) as Attempt[])history.push(await refreshCorrectedAttempt(ctx.db,attempt));
  const pendingQuery=ctx.db.from("science_attempts").select("id",{count:"exact",head:true}).eq("state","completed").eq("needs_recalculation",true);
  const pendingPromise=ctx.userId?pendingQuery.eq("user_id",ctx.userId):pendingQuery.eq("visitor_id",ctx.visitor.id);
  const [bestResponse,current,pending]=await Promise.all([bestQuery,currentEstimate(ctx.db,ctx.userId?{userId:ctx.userId}:{visitorId:ctx.visitor.id}),pendingPromise]);
  if(pending.error)checked(pending);
  if(pending.count===null)throw new ScienceError("再計算中の履歴件数を取得できませんでした。",503);
  if(historyResponse.count===null)throw new ScienceError("履歴件数を取得できませんでした。",503);
  let profile:ScienceProfile|null=null,preferences:Preferences={science:false,weekly:false,domain_opening:false};
  let badges:AccountData["badges"]=[],legacy:AccountData["legacy"]=[],legacyTotal=0;
  if(ctx.userId){
    // Badges derive from committed facts and are safe to recompute after a missed background job.
    const awarded=await ctx.db.rpc("science_award_badges",{p_user:ctx.userId});
    if(awarded.error)checked(awarded);
    const [p,c,b,l]=await Promise.all([
      ctx.db.from("science_profiles").select("public_id,nickname,bio,interests,is_public,ranking_opt_in").eq("user_id",ctx.userId).single(),
      ctx.db.from("science_consents").select("topic,enabled").eq("user_id",ctx.userId),
      ctx.db.from("science_badges").select("code,awarded_at").eq("user_id",ctx.userId).order("awarded_at"),
      ctx.db.from("score_history").select("id,score,answer_count,created_at",{count:"exact"}).eq("user_id",ctx.userId).order("created_at",{ascending:false}).range(page*20,page*20+19)
    ]);
    profile=checked(p) as ScienceProfile;
    preferences={...preferences,...Object.fromEntries(checked(c).map((r)=>[r.topic,r.enabled]))};
    badges=checked(b);legacy=checked(l);
    if(l.count===null)throw new ScienceError("旧版の履歴件数を取得できませんでした。",503);
    legacyTotal=l.count;
  }
  return {signedIn:!!ctx.userId,profile,preferences,current,history:history.map(publicAttempt),historyTotal:historyResponse.count,page,recalculationPending:pending.count,bests:checked(bestResponse) as AccountData["bests"],badges,legacy,legacyTotal};
}
