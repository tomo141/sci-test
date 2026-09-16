import { describe, expect, it } from "vitest";
import { scienceTokens } from "./notation";

describe("scientific typography without changing stored content", () => {
  it.each(["S_N2", "S_{N}2", "SN2", "S_N1", "SN1"])("typesets the N of %s, retaining the reaction order on the baseline", input => {
    expect(scienceTokens(input)).toEqual([{kind:"script",text:input.slice(0,-1),base:"S",sub:"N"},{kind:"text",text:input.at(-1)}]);
  });
  it("formats explicit subscripts while preserving adjacent quantities", () => {
    expect(scienceTokens("Δ_rGとn_iμ、D_μψ、pK_a、V_max").filter(t=>t.kind==="script")).toMatchObject([
      {base:"Δ",sub:"r"},{base:"n",sub:"i"},{base:"D",sub:"μ"},{base:"pK",sub:"a"},{base:"V",sub:"max"}
    ]);
  });
  it("preserves chemistry letter case, superscripts and drawn accents", () => {
    expect(scienceTokens("K_m 10^−3 r⃗")).toMatchObject([
      {base:"K",sub:"m"},{text:" "},{base:"10",sup:"−3"},{text:" "},{base:"r",mark:"⃗"}
    ]);
  });
  it("does not interpret URLs, code, existing Unicode scripts or ordinary identifiers", () => {
    const input="https://example.invalid/S_N2 `x_i` user_id snake_case CH₄ H₂O CₙH₂ₙ₊₂";
    const tokens=scienceTokens(input);
    expect(tokens.every(t=>t.kind==="text")).toBe(true);
    expect(tokens.map(t=>t.text).join("")).toBe(input);
  });
});
