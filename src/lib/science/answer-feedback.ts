import type { RevisionUpdate } from "./corrections";
import type { AnswerExplanation, Issued } from "./types";
import { questionLevel } from "./question-level";

// Call only after an owned answer has been committed or read from the answer ledger.
export function answerExplanation(issued: Issued, selectedIndex: number, update?: RevisionUpdate): AnswerExplanation {
  const originalIndex = issued.choice_order[selectedIndex];
  const content = update?.content ?? issued.snapshot.content;
  return {
    ordinal: issued.ordinal, revisionId: issued.revision_id, content,
    correct: update?.excluded ? null : originalIndex === content.correctIndex,
    selectedAnswer: issued.snapshot.content.choices[originalIndex],
    correctAnswer: content.choices[content.correctIndex],
    display: { ordinal: issued.ordinal, domain: issued.snapshot.domain, subdomain: issued.snapshot.subdomain,
      question: issued.snapshot.content.question, choices: issued.choice_order.map(index => issued.snapshot.content.choices[index]),
      level: questionLevel(issued.snapshot), creditName: issued.snapshot.creditName, aiAssisted: issued.snapshot.aiAssisted,
      selectedIndex, correctIndex: update?.excluded ? null : issued.choice_order.indexOf(content.correctIndex) },
    ...(update ? { correctionNote: update.reason } : {})
  };
}

// Display an excerpt, never generate a different explanation or split a sentence mid-way.
export function briefExplanation(text: string) {
  const clean = text.trim();
  const paragraph = clean.split(/\n\s*\n/)[0];
  if (paragraph.length <= 180) return paragraph;
  const sentences = paragraph.match(/[^。！？!?\n]+[。！？!?]?/g) ?? [paragraph];
  let brief = "";
  for (const sentence of sentences) {
    if (brief && brief.length + sentence.length > 180) break;
    brief += sentence;
    if (brief.length >= 180) break;
  }
  return brief || paragraph;
}
