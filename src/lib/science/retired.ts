import { NextResponse } from "next/server";
export function retiredEndpoint(){return NextResponse.json({error:"旧版の受験APIは終了しました。保存済みの結果はマイページから確認できます。",code:"legacy_api_retired",path:"/mypage"},{status:410,headers:{"Cache-Control":"no-store"}});}
