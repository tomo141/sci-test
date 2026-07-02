import type { Question } from "@/src/lib/data/questions";
import type { ShuffledChoices } from "@/src/lib/exam/shuffleChoices";

export type PublicQuestion = {
  id: string;
  title: string;
  question: string;
  choices: string[];
  domain: Question["domain"];
  subdomain: string;
  abilityAxis: Question["abilityAxis"];
  cognitiveType: Question["cognitiveType"];
  learningObjective: string;
  difficultyInitial: number;
  difficulty: number;
  discrimination: number;
  qualityScore: number;
  published: boolean;
  tags: string[];
};

export type QuestionCatalogEntry = {
  id: string;
  domain: Question["domain"];
  difficulty: number;
  published: boolean;
};

function createSeededRng(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return () => {
    hash = (hash * 1664525 + 1013904223) >>> 0;
    return hash / 0x100000000;
  };
}

export function seededShuffleChoices(
  questionId: string,
  sessionSeed: string,
  source: { choices: string[]; correctIndex: number }
): ShuffledChoices {
  const displayToOriginal = source.choices.map((_, index) => index);
  const rng = createSeededRng(`${sessionSeed}:${questionId}`);

  for (let index = displayToOriginal.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [displayToOriginal[index], displayToOriginal[swapIndex]] = [displayToOriginal[swapIndex], displayToOriginal[index]];
  }

  return {
    choices: displayToOriginal.map((originalIndex) => source.choices[originalIndex]),
    correctIndex: displayToOriginal.indexOf(source.correctIndex),
    displayToOriginal
  };
}

export function toPublicQuestion(question: Question, choices: string[]): PublicQuestion {
  return {
    id: question.id,
    title: question.title,
    question: question.question,
    choices,
    domain: question.domain,
    subdomain: question.subdomain,
    abilityAxis: question.abilityAxis,
    cognitiveType: question.cognitiveType,
    learningObjective: question.learningObjective,
    difficultyInitial: question.difficultyInitial,
    difficulty: question.difficulty,
    discrimination: question.discrimination,
    qualityScore: question.qualityScore,
    published: question.published,
    tags: question.tags
  };
}

export function toQuestionCatalogEntry(question: Question): QuestionCatalogEntry {
  return {
    id: question.id,
    domain: question.domain,
    difficulty: question.difficulty,
    published: question.published
  };
}
