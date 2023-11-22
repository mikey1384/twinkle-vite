import { unicodeSplit } from './words';

export function getStatuses({
  guesses,
  solution
}: {
  guesses: string[];
  solution: string;
}) {
  const charObj: Record<string, string> = {};
  const splitSolution = unicodeSplit(solution);

  guesses.forEach((word) => {
    unicodeSplit(word).forEach((letter, i) => {
      if (!splitSolution.includes(letter)) {
        return (charObj[letter] = 'absent');
      }

      if (letter === splitSolution[i]) {
        return (charObj[letter] = 'correct');
      }

      if (charObj[letter] !== 'correct') {
        return (charObj[letter] = 'present');
      }
    });
  });

  return charObj;
}

export function getGuessStatuses({
  guess,
  solution
}: {
  guess: string;
  solution: string;
}) {
  const splitSolution = unicodeSplit(solution);
  const splitGuess = unicodeSplit(guess);

  const statuses = Array.from(Array(guess.length));
  const correctLetters: Record<string, string | boolean> = {};
  for (const char of splitSolution) {
    correctLetters[char] = true;
  }

  for (let i = 0; i < splitGuess.length; i++) {
    const letter = splitGuess[i];
    if (!splitSolution.includes(letter)) {
      statuses[i] = 'absent';
      continue;
    }
    if (correctLetters[letter] && letter !== splitSolution[i]) {
      statuses[i] = 'present';
      continue;
    }
    statuses[i] = 'correct';
  }

  return statuses;
}
