import type { BankQuestion } from "./questions";
import chemistryReactionPhotochemistry from "../../../scripts/batches/化学/反応速度・触媒・光化学.json";

export const knowledgeQuestionsPipeline: BankQuestion[] = [
  ...(chemistryReactionPhotochemistry as BankQuestion[])
];
