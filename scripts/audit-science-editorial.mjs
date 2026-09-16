import { readFile, readdir, writeFile } from 'node:fs/promises';
import { editorialHints } from '../src/lib/science/editorial-review.ts';
import { editorialRegressions } from './lib/science-editorial.mjs';
const directory='content/science-bank-v2';
const rows=(await Promise.all((await readdir(directory)).filter(p=>p.endsWith('.json')).sort().map(async file=>JSON.parse(await readFile(`${directory}/${file}`,'utf8')).map(q=>({...q,file:`${directory}/${file}`}))))).flat();
const baseline=JSON.parse(await readFile('content/science-editorial-existing-debt.json','utf8'));
const count=a=>a.length, percentile=(a,p)=>[...a].sort((a,b)=>a-b)[Math.min(a.length-1,Math.floor(a.length*p))];
const overview=list=>({count:count(list),questionMedian:percentile(list.map(q=>[...q.content.question].length),.5),questionP90:percentile(list.map(q=>[...q.content.question].length),.9),questionOver60:count(list.filter(q=>[...q.content.question].length>60)),shortStemAndChoices:count(list.filter(q=>[...q.content.question].length<=45&&q.content.choices.every(s=>[...s].length<=15))),absoluteCue:count(list.filter(q=>editorialHints(q.content).some(h=>h.code==='distractor_absolute_cue'))),highAbsoluteCue:count(list.filter(q=>editorialHints(q.content).some(h=>h.code==='distractor_absolute_cue'&&h.severity==='high')))});
const regressions=editorialRegressions(rows,baseline.existingHighRisk);
const report={observedAt:new Date().toISOString(),scope:'Current reviewed source of 1000 formal and 20 weekly items. Flags are review candidates, not scientific errors or resolved defects.',formal:overview(rows.filter(q=>(q.use??'formal')==='formal')),weekly:overview(rows.filter(q=>q.use==='weekly-reserve')),newHighRisk:regressions.map(q=>q.legacyId??q.familyKey),findings:rows.flatMap(q=>{const hints=editorialHints(q.content);return hints.length?[{key:q.legacyId??q.familyKey,file:q.file,hints}]:[]})};
const output=process.argv.find(arg=>arg.startsWith('--output='))?.slice(9);
if(output){if(!/^implementation\/checks\/[a-z0-9-]+\.json$/.test(output))throw Error('Use an implementation/checks JSON path');await writeFile(output,JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({formal:report.formal,weekly:report.weekly,newHighRisk:report.newHighRisk.length,existingDebt:baseline.existingHighRisk.length}));
if(regressions.length || (process.argv.includes('--strict') && rows.some(q=>editorialHints(q.content).some(h=>h.severity==='high'))))process.exitCode=1;
