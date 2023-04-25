import React from 'react';
import Cell from './Cell';
import { getGuessStatuses } from '../helpers/statuses';
import { unicodeSplit } from '../helpers/words';

export default function CompletedRow({
  guess,
  isRevealing,
  isWaving,
  solution
}: {
  guess: string;
  isRevealing: boolean;
  isWaving: boolean;
  solution: string;
}) {
  const statuses = getGuessStatuses({ guess, solution });
  const splitGuess = unicodeSplit(guess);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '0.5rem'
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
        />
      ))}
    </div>
  );
}
