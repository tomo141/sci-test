import type {AttemptResult} from "./types";
export function shareCopy(result:AttemptResult,nickname:string){
  const d=result.definition;
  if(d.kind==="weekly")return {metric:`${result.correctCount}/${result.answerCount}問 正解`,subtitle:"みんな同じ10問に挑戦",text:`${nickname}は「今週の10問」で${result.correctCount}/${result.answerCount}問正解。あなたも挑戦してみよう！`};
  if(d.kind==="lab")return {metric:`${result.correctCount}/${result.answerCount}問 正解`,subtitle:"みんなで解いて、良問を育てる",text:`「みんなの出題ラボ」で${result.correctCount}/${result.answerCount}問正解。解いて、気づいて、良問を育てよう！`};
  if(d.domain){const score=result.domains[d.domain].score;return {metric:score===null?`${d.domain}：測定対象の回答なし`:`${d.domain} ${score}/100点（参考スコア）`,subtitle:"気になる分野を、もう20問",text:`${nickname}が${d.domain}に挑戦。あなたの得意分野も測ってみよう！`};}
  return {metric:result.total===null?"総合：測定対象の回答が不足しています":`総合 ${result.total}/1,000点（参考スコア）`,subtitle:"10分野の科学マップ",text:`${nickname}の科学マップ。あなたの科学は、どこまで広い？`};
}
