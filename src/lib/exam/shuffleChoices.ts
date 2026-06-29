export type ShuffledChoices = {
  choices: string[];
  correctIndex: number;
  /** Maps display index to original choice index. */
  displayToOriginal: number[];
};

export function shuffleChoices(source: { choices: string[]; correctIndex: number }): ShuffledChoices {
  const displayToOriginal = source.choices.map((_, index) => index);

  for (let index = displayToOriginal.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [displayToOriginal[index], displayToOriginal[swapIndex]] = [displayToOriginal[swapIndex], displayToOriginal[index]];
  }

  return {
    choices: displayToOriginal.map((originalIndex) => source.choices[originalIndex]),
    correctIndex: displayToOriginal.indexOf(source.correctIndex),
    displayToOriginal
  };
}
