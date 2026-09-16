import { describe, expect, it } from "vitest";
import { editorialHints } from "./editorial-review";
describe("choice clues and reading load",()=>{
  it("detects the reported three-distractor certainty pattern",()=>{
    expect(editorialHints({question:"S_N2反応の立体化学は？",choices:["必ず蓄積する","必ず同じ側","配置が反転する","必ず保持される"],correctIndex:2})).toContainEqual(expect.objectContaining({code:"distractor_absolute_cue",severity:"high",choices:[0,1,3]}));
  });
  it("does not confuse scientific terms with certainty",()=>{
    expect(editorialHints({question:"温度の単位は？",choices:["絶対温度","絶対値","絶対零度","絶対誤差"],correctIndex:0})).toEqual([]);
  });
  it("does not label equally qualified or ordinary short options as a high clue",()=>{
    expect(editorialHints({question:"比較する",choices:["必ず増加","必ず低下","必ず一定","必ず消失"],correctIndex:0}).some(h=>h.severity==="high")).toBe(false);
    expect(editorialHints({question:"典型的なS_N2反応後の立体配置は？",choices:["反転","保持","平面化","ラセミ化"],correctIndex:0})).toEqual([]);
  });
  it("flags reading burden and an unusually long correct option without declaring it wrong",()=>{
    const hints=editorialHints({question:"あ".repeat(61),choices:["い".repeat(30),"あ","う","え"],correctIndex:0});
    expect(hints.map(h=>h.code)).toEqual(["correct_choice_length_cue","long_stem","long_choices"]);
    expect(hints.every(h=>h.severity==="review")).toBe(true);
  });
});
