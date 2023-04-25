import React, { useMemo } from 'react';
import { MAX_GUESSES } from '../../constants/settings';
import CompletedRow from './CompletedRow';
import CurrentRow from './CurrentRow';
import EmptyRow from './EmptyRow';
import { gridContainer } from './Styles';

export default function Grid({
  guesses,
  currentGuess,
  isRevealing,
  isWaving,
  currentRowClassName,
  maxWordLength,
  solution
}: {
  guesses: string[];
  currentGuess: string;
  isRevealing: boolean;
  isWaving: boolean;
  currentRowClassName: string;
  maxWordLength: number;
  solution: string;
}) {
  const empties = useMemo(() => {
    const guessLength = guesses?.length || 0;
    if (guessLength < MAX_GUESSES - 1) {
      return Array(MAX_GUESSES - 1 - guessLength).fill(null);
    }
    return [];
  }, [guesses?.length]);

  return (
    <div className={gridContainer}>
      {guesses.map((guess, i) => (
        <CompletedRow
          key={i}
          guess={guess}
          isRevealing={isRevealing && guesses.length - 1 === i}
          isWaving={isWaving && guesses.length - 1 === i}
          solution={solution}
        />
      ))}
      {guesses.length < MAX_GUESSES && (
        <CurrentRow
          guess={currentGuess}
          className={currentRowClassName}
          maxWordLength={maxWordLength}
        />
      )}
      {empties.map((_, i) => (
        <EmptyRow key={i} maxWordLength={maxWordLength} />
      ))}
    </div>
  );
}
