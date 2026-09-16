export type ScienceToken = { kind: "text"; text: string } | { kind: "accent"; text: string; base: string; mark: string } | { kind: "script"; text: string; base: string; sub?: string; sup?: string };

// Only explicit scientific notation is interpreted. URLs, code and ordinary
// identifiers are retained verbatim; this is not an HTML or full TeX parser.
export function scienceTokens(text: string): ScienceToken[] {
  const pattern = /https?:\/\/[^\s]+|`[^`]*`|[\p{L}\p{N}][\u20d7\u0304\u0307]|(?<![A-Za-z0-9_])S[NE](?=[12](?![A-Za-z0-9]))|[A-Za-zΑ-ω0-9]+(?:_\{[^{}\n]{1,30}\}|_(?:[A-Z]+|[a-z]+|[Α-ω]|\d+)|\^\{[^{}\n]{1,30}\}|\^(?:[−-]?\d+|[A-Za-zΑ-ω]))/gu;
  const tokens: ScienceToken[] = [];
  let end = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > end) tokens.push({ kind: "text", text: text.slice(end, match.index) });
    const raw = match[0];
    const accent = /^([\p{L}\p{N}])([\u20d7\u0304\u0307])$/u.exec(raw);
    const script = /^([A-Za-zΑ-ω0-9]+)([_^])(?:\{([^{}]+)\}|(.+))$/u.exec(raw);
    if (accent) tokens.push({ kind: "accent", text: raw, base: accent[1], mark: accent[2] });
    else if (/^S[NE]$/.test(raw)) tokens.push({ kind: "script", text: raw, base: "S", sub: raw[1] });
    else if (script && /^(?:[A-Za-zΑ-ω]|\d+|\d+[A-Za-zΑ-ω]|[A-Z]{2,3}|pK|d[Α-ω]|log)$/u.test(script[1])) {
      tokens.push({ kind: "script", text: raw, base: script[1], [script[2] === "_" ? "sub" : "sup"]: script[3] ?? script[4] });
    } else tokens.push({ kind: "text", text: raw });
    end = match.index + raw.length;
  }
  if (end < text.length) tokens.push({ kind: "text", text: text.slice(end) });
  return tokens;
}
