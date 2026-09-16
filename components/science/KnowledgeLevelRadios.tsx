import { knowledgeLevels, scopeLabel, type KnowledgeLevel, type KnowledgeScope } from "@/src/lib/science/knowledge-levels";

export function KnowledgeLevelRadios({ scope, name, value, onChange, purpose }: {
  scope: KnowledgeScope; name: string; value: KnowledgeLevel | null | undefined;
  onChange: (value: KnowledgeLevel | null) => void; purpose: "author" | "self";
}) {
  return <fieldset className="grid gap-3">
    <legend className="mb-3 font-bold">{scopeLabel(scope)}</legend>
    <p className="text-sm leading-7">{purpose === "author" ? "この問題を初めて見て、10人中7人くらいが正解できそうな人物像を1つ選んでください。検索・AIを使わない4択の回答を想定します。" : "あなたが10問中7問くらい解けそうな問題の段階に、最も近いものを1つ選んでください。学歴に関係なく、今の知識の感覚で選べます。"}</p>
    {knowledgeLevels(scope).map(level => <label key={level.key} className="flex cursor-pointer items-start gap-3 rounded-xl border p-4 has-[:checked]:border-[var(--color-primary-700)] has-[:checked]:bg-[var(--color-primary-50)]">
      <input type="radio" name={name} value={level.key} checked={value === level.key} onChange={() => onChange(level.key)} className="mt-1"/>
      <span><span className="block font-bold">{level.title}</span><span className="mt-1 block text-sm leading-6">{level.description}</span></span>
    </label>)}
    <label className="flex items-center gap-3 rounded-xl border p-4"><input type="radio" name={name} value="unknown" checked={value === null} onChange={() => onChange(null)}/>まだ判断できない</label>
    <p className="text-xs leading-6 text-[var(--color-muted)]">{purpose === "self" ? "各段階は、その人物像なら約7割正解できる問題を想定した作問の目安です。学位の取得状況を申告する質問ではなく、回答によって今回の得点が変わることもありません。" : "人物像の間隔や点数との対応は、回答データで確かめます。学位だけで難度を決めず、この分野の内容を想像してください。"}</p>
  </fieldset>;
}
