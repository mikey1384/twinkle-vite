import { VALID_GUESSES } from '../../constants/validGuesses';
import { default as GraphemeSplitter } from 'grapheme-splitter';

export const checkWordleAttemptStrictness = ({
  guesses,
  solution
}: {
  guesses: string[];
  solution: string;
}) => {
  if (guesses.length === 1) return { isPass: true };
  let index = 1;
  while (index < guesses.length) {
    const prevGuess = guesses[index - 1];
    const guess = guesses[index];
    const prevGuessChars = prevGuess.split('');
    const guessChars = guess.split('');
    const solutionChars = solution.split('');
    for (let i = 0; i < prevGuessChars.length; i++) {
      const numPosition = i + 1;
      const nthString = i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th';
      if (
        prevGuessChars[i] === solutionChars[i] &&
        guessChars[i] !== solutionChars[i]
      ) {
        return {
          isPass: false,
          message: `${numPosition}${nthString} letter must be ${solutionChars[i]}`
        };
      }
      if (
        solutionChars.includes(prevGuessChars[i]) &&
        !guessChars.includes(prevGuessChars[i])
      ) {
        return {
          isPass: false,
          message: `Guess must contain ${prevGuessChars[i]}`
        };
      }
    }
    index++;
  }
  return { isPass: true };
};

export const isWordInWordList = (word: string) => {
  return VALID_GUESSES.includes(word.toLowerCase());
};

export const unicodeSplit = (word: string) => {
  return new GraphemeSplitter().splitGraphemes(word);
};

export const unicodeLength = (word: string) => {
  return unicodeSplit(word).length;
};
