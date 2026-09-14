import { domains } from "@/src/lib/data/taxonomy";
import type { ScienceResult } from "@/src/lib/science/model";

const short = ["数学", "物理", "化学", "生物", "地学", "工学", "農学", "情報", "医歯薬", "人文社会"];
function point(i: number, radius: number) {
  const angle = i * Math.PI / 5 - Math.PI / 2;
  return { x: 220 + Math.cos(angle) * radius, y: 180 + Math.sin(angle) * radius };
}
export function ScienceMap({ result }: { result: ScienceResult }) {
  const complete = domains.every((d) => result.domains[d].score !== null);
  return <div>
    <svg viewBox="0 0 440 360" className="mx-auto w-full max-w-lg" role="img" aria-label="10分野の科学マップ。詳しい点数と参考幅は下の表に表示しています。">
      {[.25,.5,.75,1].map((r) => <polygon key={r} points={domains.map((_, i) => { const p = point(i, 125*r); return `${p.x},${p.y}`; }).join(" ")} fill="none" stroke="#d3e1f3" />)}
      {domains.map((domain, i) => { const p = point(i, 125), label = point(i, 156); return <g key={domain}><line x1="220" y1="180" x2={p.x} y2={p.y} stroke="#d3e1f3" /><text x={label.x} y={label.y} textAnchor="middle" dominantBaseline="middle" fontSize="13" fill="#11213f">{short[i]}</text></g>; })}
      {complete && <polygon points={domains.map((d,i) => { const p = point(i, 1.25 * result.domains[d].score!); return `${p.x},${p.y}`; }).join(" ")} fill="#2467e82e" stroke="#1558d6" strokeWidth="2" />}
      {domains.map((domain, i) => { const field = result.domains[domain]; if (field.score === null) return null; const p = point(i, field.score*1.25); return <circle key={domain} cx={p.x} cy={p.y} r="4" fill="#1558d6" />; })}
    </svg>
    <table className="w-full text-left text-sm"><caption className="sr-only">分野別の参考スコア（100点満点）</caption><thead><tr><th className="py-2">分野</th><th>点数</th><th>参考幅</th><th>適格回答</th></tr></thead><tbody>
      {domains.map((domain) => { const d = result.domains[domain]; return <tr key={domain} className="border-t border-[var(--color-border)]"><th className="py-2 font-medium">{domain}</th><td>{d.score ?? "未測定"}</td><td>{d.low === null ? "—" : `${d.low}–${d.high}`}</td><td>{d.count}問</td></tr>; })}
    </tbody></table>
  </div>;
}
