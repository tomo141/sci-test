import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getSharedResult } from "@/src/lib/science/public";
import { domains } from "@/src/lib/data/taxonomy";
export const runtime="nodejs";
export const dynamic="force-dynamic";

export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
  const shared=await getSharedResult((await params).id);
  if(!shared)return new Response("Not found",{status:404,headers:{"Cache-Control":"no-store"}});
  const font=await readFile(join(process.cwd(),"public/fonts/ScienceSans-Bold.ttf"));
  const r=shared.result;
  const nickname=Array.from(shared.nickname).slice(0,16).join("")+(Array.from(shared.nickname).length>16?"…":"");
  return new ImageResponse(<div style={{display:"flex",flexDirection:"column",background:"#f3f7ff",color:"#11213f",width:"100%",height:"100%",padding:"42px 50px",fontFamily:"ScienceSans"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"2px solid #d3e1f3",paddingBottom:20}}><div style={{fontSize:40}}>全分野科学検定</div><div style={{fontSize:22,color:"#1558d6"}}>{r.definition.kind==="weekly"?"今週の10問":r.definition.kind==="lab"?"みんなの出題ラボ":"あなたの科学マップ"}</div></div>
    <div style={{display:"flex",gap:45,flex:1,paddingTop:28}}>
      <div style={{display:"flex",flexDirection:"column",width:460}}><div style={{fontSize:28}}>{nickname}さん</div><div style={{fontSize:21,marginTop:10,color:"#526580"}}>{r.definition.label}</div><div style={{fontSize:90,marginTop:28,color:"#1558d6"}}>{r.total!==null?r.total:`${r.correctCount}/${r.answerCount}`}</div><div style={{fontSize:22,marginTop:4}}>{r.total!==null?"/ 1,000点 · 参考スコア":"問 正解"}</div><div style={{fontSize:22,marginTop:24}}>科学の得意と、まだ知らない世界。</div></div>
      <div style={{display:"flex",flexDirection:"column",width:590,gap:10}}>{domains.map(d=><div key={d} style={{display:"flex",alignItems:"center",height:28,gap:12}}><div style={{width:230,fontSize:20}}>{d}</div><div style={{display:"flex",width:215,height:12,background:"#dbe5f5",borderRadius:6}}><div style={{height:12,width:`${r.domains[d].score??0}%`,background:"#2467e8",borderRadius:6}}/></div><div style={{fontSize:19,width:70,textAlign:"right"}}>{r.domains[d].score??"—"}</div></div>)}</div>
    </div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",borderTop:"2px solid #d3e1f3",paddingTop:18,fontSize:19}}><div>制作「理系とーく 川村智祥」</div><div>あなたも無料で20問に挑戦 →</div></div>
  </div>,{width:1200,height:630,fonts:[{name:"ScienceSans",data:font,weight:700,style:"normal"}],headers:{"Cache-Control":"no-store"}});
}
