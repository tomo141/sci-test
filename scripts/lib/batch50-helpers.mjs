export const SOURCE = "全分野科学検定 バッチ50（レベル均等）";

export function q(fields) {
  const level = fields.difficulty_initial;
  return {
    currentness_type: "evergreen",
    expires_at: null,
    source_url: "",
    source_note: SOURCE,
    difficulty_continuous: level,
    tags: [fields.domain, fields.subdomain, "batch50", `L${level}`],
    ...fields
  };
}

export function balanceAnswerPosition(item, targetIndex) {
  const cur = item.correct_choice_index;
  if (cur === targetIndex) return item;
  const shift = (cur - targetIndex + 4) % 4;
  const rotate = (arr) => [...arr.slice(shift), ...arr.slice(0, shift)];
  return {
    ...item,
    choices: rotate(item.choices),
    distractor_rationales: rotate(item.distractor_rationales),
    correct_choice_index: targetIndex
  };
}

export function balanceAll(items) {
  return items.map((item, i) => balanceAnswerPosition(item, i % 4));
}
