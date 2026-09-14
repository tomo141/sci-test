import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { runDailyJobs } from "@/src/lib/science/jobs";
export const dynamic="force-dynamic";
export const maxDuration=60;
export async function GET(request:Request){
  const secret=process.env.CRON_SECRET;
  if(!secret||secret.length<32)return NextResponse.json({error:"job_not_configured"},{status:503});
  const expected=Buffer.from(`Bearer ${secret}`),given=Buffer.from(request.headers.get("authorization")??"");
  if(given.length!==expected.length||!timingSafeEqual(given,expected))return NextResponse.json({error:"unauthorized"},{status:401});
  try{return NextResponse.json(await runDailyJobs(),{headers:{"Cache-Control":"no-store"}});}catch{return NextResponse.json({error:"job_failed"},{status:503});}
}
