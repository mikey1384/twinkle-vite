import { unicodeSplit } from './words';

export function getStatuses({ guesses, solution }) {
  const charObj = {};
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

export function getGuessStatuses({ guess, solution }) {
  const splitSolution = unicodeSplit(solution);
  const splitGuess = unicodeSplit(guess);

  const statuses = Array.from(Array(guess.length));
  const indexesOnHold = [];
  const correctLetters = {};

  for (let i = 0; i < splitGuess.length; i++) {
    const letter = splitGuess[i];
    if (!splitSolution.includes(letter)) {
      statuses[i] = 'absent';
      continue;
    }
    if (letter !== splitSolution[i]) {
      if (correctLetters[letter]) {
        statuses[i] = 'absent';
        continue;
      }
      statuses[i] = 'present';
      indexesOnHold.push(i);
      continue;
    }
    statuses[i] = 'correct';
    correctLetters[letter] = true;
    for (let prevIndex of indexesOnHold) {
      if (splitGuess[prevIndex] === letter) {
        statuses[prevIndex] = 'absent';
      }
    }
    continue;
  }

  return statuses;
}
