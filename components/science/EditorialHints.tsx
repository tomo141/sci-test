import { editorialHints } from "@/src/lib/science/editorial-review";
import type { Content } from "@/src/lib/science/types";

export function EditorialHints({content}:{content:Pick<Content,"question"|"choices"|"correctIndex">}) {
  const hints = editorialHints(content);
  if (!hints.length) return null;
  return <aside className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7" aria-label="問題の読みやすさ・選択肢の確認">
    <h3 className="font-bold">公開前に確認したい点</h3>
    <ul className="mt-2 list-disc space-y-2 pl-5">{hints.map(h=><li key={h.code}>{h.message}</li>)}</ul>
    <p className="mt-2 text-xs">自動検出による確認候補です。正解を一つに絞るために必要な条件は残してください。</p>
  </aside>;
}
