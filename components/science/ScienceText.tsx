import { Fragment } from "react";

// Mathematical accents are drawn independently of the device's font coverage.
// The original text stays in the bank, ledger and accessible name.
export function ScienceText({ children }: { children: string }) {
  return <>{children.split(/([\p{L}\p{N}][\u20d7\u0304\u0307])/gu).map((part, index) => {
    const match = /^([\p{L}\p{N}])([\u20d7\u0304\u0307])$/u.exec(part);
    if (!match) return <Fragment key={index}>{part}</Fragment>;
    const [, base, mark] = match;
    return <span key={index} className="science-accent" role="img" aria-label={part}><span aria-hidden="true">{base}</span>
      <svg aria-hidden="true" focusable="false" className="science-accent-mark" viewBox="0 0 24 8" preserveAspectRatio="none">
        {mark === "\u20d7" ? <path d="M1 4h21M17 1l5 3-5 3" /> : mark === "\u0304" ? <path d="M2 4h20" /> : <circle cx="12" cy="4" r="1.5" fill="currentColor" stroke="none" />}
      </svg>
    </span>;
  })}</>;
}
