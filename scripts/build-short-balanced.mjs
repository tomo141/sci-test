import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { bFromDifficulty, difficultyAtProbability } from '../src/lib/science/measurement-scale.ts';
import { editorialHints } from '../src/lib/science/editorial-review.ts';

const definitions = [
  ['math','数学',[3,4]], ['physics','物理',[2,1]], ['chemistry','化学',[3,4]],
  ['biology','生物',[3,2]], ['earth','地学',[1,2]], ['engineering','工学',[2,3]],
  ['agriculture','農学',[3,3]], ['informatics','情報・計算機科学',[3,3]],
  ['medical','医歯薬学',[2,3]], ['humanities','人文社会科学',[1,3]]
];
// Author estimates within the adopted bands; never presented as calibrated population norms.
const initialDifficulty = [100,225,375,525,675,825,925];
const bank = [];
for (const file of (await readdir('content/science-bank-v2')).sort()) {
  for (const row of JSON.parse(await readFile(`content/science-bank-v2/${file}`,'utf8'))) bank.push({file,key:row.legacyId??row.familyKey,...row});
}
const pilot = JSON.parse(await readFile('content/science-short-pilot-20260917.json','utf8'));
const items = [], originalKeys = new Set();
for (const [slug,domain,pilotLevels] of definitions) {
  const previous = pilot.items.filter(q=>q.id.startsWith(`short-${slug}-`));
  const additions = JSON.parse(await readFile(`content/science-short-v1/${slug}.json`,'utf8'));
  if(previous.length!==2 || additions.length!==8) throw new Error(`Expected 2 + 8: ${domain}`);
  for (const [index,draft] of [...previous.map((q,i)=>({...q,level:pilotLevels[i]})),...additions].entries()) {
    const originals = bank.filter(q=>q.domain===domain && (draft.originalKey ? q.key===draft.originalKey : q.content.question.includes(draft.originalMatch)));
    if(originals.length!==1) throw new Error(`Ambiguous original ${domain}/${index+1}: ${draft.originalMatch??draft.originalKey} (${originals.length})`);
    const original=originals[0],level=draft.level;
    if(originalKeys.has(original.key)) throw new Error(`Duplicate replacement: ${original.key}`);
    originalKeys.add(original.key);
    const choices=draft.choices, correct=draft.correctIndex??0, reasons=draft.distractorRationales??draft.reasons;
    if(choices.length!==4||new Set(choices).size!==4||reasons.length!==4)throw new Error('Invalid choices');
    const rotation=items.length%4, order=Array.from({length:4},(_,i)=>(i+rotation)%4);
    const content={question:draft.question,choices:order.map(i=>choices[i]),correctIndex:order.indexOf(correct),
      explanation:draft.explanation,distractorRationales:order.map(i=>reasons[i]),sources:draft.sources??original.content.sources};
    const stemLength=[...content.question].length,maxChoice=Math.max(...choices.map(c=>[...c].length));
    if(stemLength>45||maxChoice>15)throw new Error(`Reading limit ${domain}/${index+1}: ${stemLength}/${maxChoice}`);
    if(!(level>=1&&level<=7))throw new Error('Invalid provisional level');
    const a=1,c=.25,b=bFromDifficulty(initialDifficulty[level-1],a,c);
    const hints=editorialHints(content);
    if(hints.some(h=>h.severity==='high'))throw new Error(`Editorial risk ${domain}/${index+1}: ${JSON.stringify(hints)}`);
    items.push({id:`short-${slug}-${String(index+1).padStart(2,'0')}`,domain,subdomain:draft.subdomain??original.subdomain,
      originalFile:original.file,originalKey:original.key,originalContentHash:createHash('sha256').update(JSON.stringify(original.content)).digest('hex'),
      lineage:draft.lineage??(index<2?'pilot-rewrite':'revised-concept'),
      provisionalLevel:level,parameters:{a,b,c,basis:'author-estimate-p70; not empirically calibrated'},
      difficulty70:difficultyAtProbability({a,b,c}),content,
      review:{status:'draft-for-adaptive-experience-review',sourceBasis:draft.sources?'specific-primary-reference':'previous-reviewed-source-reused',
        previousSourceReviewDate:original.review?.observedAt??null,previousSourceLocation:original.review?.sourceLocation??null,
        currentSourceLocation:draft.sourceLocation??null,
        uniqueAnswerReviewed:true,editorialHints:hints,livePublished:false}
    });
  }
}
const levelCounts=Array.from({length:7},(_,i)=>items.filter(q=>q.provisionalLevel===i+1).length);
if(items.length!==100||levelCounts.some(n=>n<14||n>15))throw new Error(`Unbalanced total: ${levelCounts}`);
const perDomain=definitions.map(([,domain])=>({domain,levels:Array.from({length:7},(_,i)=>items.filter(q=>q.domain===domain&&q.provisionalLevel===i+1).length)}));
if(perDomain.some(row=>row.levels.some(n=>n<1)||row.levels.reduce((a,b)=>a+b,0)!==10))throw new Error('Missing domain level');
const source={version:'short-balanced-v1-20260917',status:'adaptive-experience-review',published:false,
  calibration:'provisional author estimates, empirical recalibration pending',
  decisions:{ownerApprovedShortLength:true,allSevenLevelsBalanced:true,raiseSelectedDifficultyFromResponses:true,changeScoreDefinition:false},
  items};
const serialized=JSON.stringify(source,null,2)+'\n';
await writeFile('content/science-short-balanced-20260917.json',serialized);
await mkdir('implementation/short-questions/balanced',{recursive:true});
const mean=xs=>Math.round(xs.reduce((a,b)=>a+b,0)/xs.length*10)/10;
const audit={version:source.version,sourceSha256:createHash('sha256').update(serialized).digest('hex'),count:items.length,levelCounts,perDomain,
  meanStem:mean(items.map(q=>[...q.content.question].length)),maxStem:Math.max(...items.map(q=>[...q.content.question].length)),
  meanChoice:mean(items.flatMap(q=>q.content.choices.map(c=>[...c].length))),maxChoice:Math.max(...items.flatMap(q=>q.content.choices.map(c=>[...c].length))),
  editorialHints:items.flatMap(q=>q.review.editorialHints.map(h=>({id:q.id,...h}))),published:false,calibrated:false};
await writeFile('implementation/short-questions/balanced/audit.json',JSON.stringify(audit,null,2)+'\n');
let review='# 100問の短問・仮難度と改稿案\n\n2026-09-17。10分野各10問、レベル1〜7を各14〜15問。本人の「文量は維持」「作成全体を難しくせず、正解状況で出題難度を上げる」を反映。実回答で校正した難度ではありません。\n\n仮難度は各レベル内の100・225・375・525・675・825・925。a＝1、c＝0.25を共通の仮定とし、採択済み70％基準からbを逆算。本番の採点基準・7段階の境界は変更しません。旧問題のbや回答実績は移植しません。\n\n|分野|L1|L2|L3|L4|L5|L6|L7|\n|---|---:|---:|---:|---:|---:|---:|---:|\n';
for(const row of perDomain)review+=`|${row.domain}|${row.levels.join('|')}|\n`;
review+=`|合計|${levelCounts.join('|')}|\n\n公開前の原稿です。元問題のキー・本文ハッシュを保存し、単純修正と測定内容の変更を区別します。具体的な内容が変わる問題は新しい版・必要に応じて新しい問題群として審査し、既存受験の問題と採点を遡って書き換えません。\n\n`;
for(const q of items)review+=`## ${q.id}｜${q.domain}｜レベル${q.provisionalLevel}（仮）\n\n${q.content.question}\n\n${q.content.choices.map((c,i)=>`${i+1}. ${c}`).join('\n')}\n\n正解：${q.content.choices[q.content.correctIndex]}\n\n${q.content.explanation}\n\n${q.content.distractorRationales.map((r,i)=>`- ${q.content.choices[i]}：${r}`).join('\n')}\n\n仮難度70：${q.difficulty70.toFixed(0)}、b：${q.parameters.b.toFixed(4)}。\n\n出典：${q.content.sources.map(s=>`[${s.title}](${s.url})`).join('、')}\n\n置換元：${q.originalFile} / ${q.originalKey}。原稿関係：${q.lineage}。\n\n`;
await writeFile('implementation/short-questions/balanced/REVIEW.md',review.trimEnd()+'\n');
console.log(JSON.stringify(audit));
