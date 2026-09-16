import { Fragment } from "react";
import { scienceTokens } from "@/src/lib/science/notation";

// Mathematical accents are drawn independently of the device's font coverage.
// The original text stays in the bank, ledger and accessible name.
export function ScienceText({ children }: { children: string }) {
  return <>{scienceTokens(children).map((token, index) => {
    if (token.kind === "text") return <Fragment key={index}>{token.text}</Fragment>;
    if (token.kind === "script") return <span key={index} className="whitespace-nowrap">{token.base}{token.sub !== undefined && <sub>{token.sub}</sub>}{token.sup !== undefined && <sup>{token.sup}</sup>}</span>;
    const { base, mark } = token;
    return <span key={index} className="science-accent" role="img" aria-label={token.text}><span aria-hidden="true">{base}</span>
      <svg aria-hidden="true" focusable="false" className="science-accent-mark" viewBox="0 0 24 8" preserveAspectRatio="none">
        {mark === "\u20d7" ? <path d="M1 4h21M17 1l5 3-5 3" /> : mark === "\u0304" ? <path d="M2 4h20" /> : <circle cx="12" cy="4" r="1.5" fill="currentColor" stroke="none" />}
      </svg>
    </span>;
  })}</>;
}
