import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { editorialHints } from '../src/lib/science/editorial-review.ts';

const path = 'content/science-short-pilot-20260917.json';
const input = await readFile(path, 'utf8'), source = JSON.parse(input);
const items = await Promise.all(source.items.map(async draft => {
  const bank = JSON.parse(await readFile(`content/science-bank-v2/${draft.originalFile}`, 'utf8'));
  const original = bank.find(row => (row.legacyId ?? row.familyKey) === draft.originalKey);
  if (!original) throw new Error(`Missing original: ${draft.id}`);
  const content = { question: draft.question, choices: draft.choices, correctIndex: draft.correctIndex,
    explanation: draft.explanation, distractorRationales: draft.distractorRationales, sources: draft.sources ?? original.content.sources };
  if (content.choices.length !== 4 || new Set(content.choices).size !== 4 || !Number.isInteger(content.correctIndex) || content.correctIndex < 0 || content.correctIndex > 3 || content.distractorRationales.length !== 4) throw new Error(`Invalid answer structure: ${draft.id}`);
  if ([...content.question].length > 45 || content.choices.some(c => [...c].length > 15)) throw new Error(`Pilot reading target exceeded: ${draft.id}`);
  for (const link of content.sources) if (new URL(link.url).protocol !== 'https:') throw new Error(`Invalid source: ${draft.id}`);
  return { ...draft, domain: original.domain, subdomain: original.subdomain, content, original: original.content,
    originalContentHash: createHash('sha256').update(JSON.stringify(original.content)).digest('hex') };
}));
const counts = Object.fromEntries([...new Set(items.map(q => q.domain))].map(d => [d, items.filter(q => q.domain === d).length]));
if (items.length !== 20 || Object.keys(counts).length !== 10 || Object.values(counts).some(n => n !== 2)) throw new Error('Expected exactly 2 questions in each of 10 domains');
const findings = items.map(q => ({ key: q.id, hints: editorialHints(q.content) })).filter(row => row.hints.length);
if (findings.some(row => row.hints.some(h => h.severity === 'high'))) throw new Error('High-risk editorial cues in pilot');
const bundle = { version: source.version, items };
const template = await readFile('scripts/templates/short-pilot.html', 'utf8');
const html = template.replace('/*__PILOT_DATA__*/', JSON.stringify(bundle).replaceAll('<', '\\u003c'));
const folder = 'implementation/short-questions';
await mkdir(folder, { recursive: true });
await writeFile(`${folder}/index.html`, html);
const len = s => [...s].length, mean = values => Math.round(values.reduce((a,b) => a+b,0) / values.length * 10) / 10;
const report = { version: source.version, sourceSha256: createHash('sha256').update(input).digest('hex'), counts,
  before: { meanStem: mean(items.map(q => len(q.original.question))), meanChoice: mean(items.flatMap(q => q.original.choices.map(len))) },
  after: { meanStem: mean(items.map(q => len(q.content.question))), maxStem: Math.max(...items.map(q => len(q.content.question))), meanChoice: mean(items.flatMap(q => q.content.choices.map(len))), maxChoice: Math.max(...items.flatMap(q => q.content.choices.map(len))) },
  editorialFindings: findings, productionPublished: false, ownerExperienceReviewed: true, calibrated: false };
await writeFile(`${folder}/audit.json`, JSON.stringify(report, null, 2) + '\n');
let markdown = '# 最初の短問20問・比較用原稿\n\n2026-09-17。各分野2問。本人の体験確認を2026-09-17に受領。文量・難しさ・テンポの評価を受け、全レベル100問と回答に応じた試用へ展開した。本番バンクへの投入・旧問題の置換はしていない。旧a/b/cは引き継がず、改稿版として審査・仮難度の設定・校正が必要。\n\n[試せる画面](index.html) · [機械点検](audit.json)\n\n';
for (const [i,q] of items.entries()) markdown += `## ${i+1}. ${q.domain} / ${q.subdomain}\n\n${q.content.question}\n\n${q.content.choices.map((c,i) => `${i+1}. ${c}`).join('\n')}\n\n正解：${q.content.choices[q.content.correctIndex]}\n\n${q.content.explanation}\n\n${q.content.distractorRationales.map((t,i) => `- ${q.content.choices[i]}：${t}`).join('\n')}\n\n旧：${q.original.question}\n\n旧選択肢：${q.original.choices.join(' ／ ')}\n\n変更理由：${q.change}\n\n確認箇所：${q.sourceLocation}\n\n出典：${q.content.sources.map(s => `[${s.title}](${s.url})`).join('、')}\n\n元問題：${q.originalFile} / ${q.originalKey}\n\n`;
await writeFile(`${folder}/REVIEW.md`, markdown.trimEnd()+'\n');
console.log(JSON.stringify(report));
