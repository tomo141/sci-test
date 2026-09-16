import type { Content } from "./types";

export type EditorialHint = { code: string; severity: "high" | "review"; message: string; choices?: number[] };
// Terms such as absolute temperature/value are scientific names, not certainty cues.
const absolute = /必ず|常に|いつも|決して|全く|一切|すべて|全て|のみ|だけ|絶対(?!値|温度|零度|湿度|配置|誤差|音感|屈折率|座標|年代)/u;
export function editorialHints(content: Pick<Content,"question"|"choices"|"correctIndex">): EditorialHint[] {
  const hints: EditorialHint[] = [];
  const flags = content.choices.map(c => absolute.test(c));
  const wrong = flags.flatMap((flag, i) => flag && i !== content.correctIndex ? [i] : []);
  if (wrong.length && !flags[content.correctIndex]) hints.push({ code: "distractor_absolute_cue", severity: wrong.length >= 2 ? "high" : "review", choices: wrong,
    message: "不正解だけに「必ず・全く・だけ」などがあり、言い回しで正解を推測できる可能性があります。同分野の自然な誤概念へ書き換えてください。" });
  const lengths = content.choices.map(c => [...c].length);
  const right = lengths[content.correctIndex] ?? 0;
  const wrongMean = lengths.filter((_,i) => i !== content.correctIndex).reduce((sum,n) => sum+n,0) / 3;
  if (right >= 15 && right >= wrongMean * 2 && right - wrongMean >= 8) hints.push({code:"correct_choice_length_cue",severity:"review",message:"正解だけが長くなっています。4択の文体・長さ・具体性を揃えられるか確認してください。"});
  if ([...content.question].length > 60) hints.push({code:"long_stem",severity:"review",message:"問題文が60文字を超えています。一つの問いに絞り、解くために必要のない説明は回答後の解説へ移せるか確認してください。"});
  if (lengths.some(n => n > 20)) hints.push({code:"long_choices",severity:"review",message:"20文字を超える選択肢があります。共通部分を問題文へまとめ、選択肢を単語や短句にできるか確認してください。"});
  return hints;
}
