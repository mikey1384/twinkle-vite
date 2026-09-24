import React from 'react';
import Cell from './Cell';
import { getGuessStatuses } from '../helpers/statuses';
import { unicodeSplit } from '../helpers/words';

export default function CompletedRow({
  guess,
  isRevealing,
  isWaving,
  solution,
  uiScale = 1
}: {
  guess: string;
  isRevealing: boolean;
  isWaving: boolean;
  solution: string;
  uiScale?: number;
}) {
  const statuses = getGuessStatuses({ guess, solution });
  const splitGuess = unicodeSplit(guess);

  // What the colours say, for screen readers and for Zero and Ciel.
  const label = `Guess: ${splitGuess
    .map((letter, i) => `${letter} ${STATUS_WORDS[statuses[i]] || ''}`.trim())
    .join(', ')}`;

  return (
    <div
      role="group"
      aria-label={label}
      style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: `${0.5 * uiScale}rem`
      }}
    >
      {splitGuess.map((letter, i) => (
        <Cell
          key={i}
          value={letter}
          status={statuses[i]}
          position={i}
          isWaving={isWaving}
          isRevealing={isRevealing}
          isCompleted
          uiScale={uiScale}
        />
      ))}
    </div>
  );
}

const STATUS_WORDS: Record<string, string> = {
  correct: 'correct',
  present: 'in the word but in the wrong spot',
  absent: 'not in the word'
};
