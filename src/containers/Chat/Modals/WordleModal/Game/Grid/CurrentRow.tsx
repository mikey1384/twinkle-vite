import React, { useMemo } from 'react';
import Cell from './Cell';
import { unicodeSplit } from '../helpers/words';

export default function CurrentRow({
  guess,
  className,
  maxWordLength
}: {
  guess: string;
  className: string;
  maxWordLength: number;
}) {
  const splitGuess = unicodeSplit(guess);
  const emptyCells = useMemo(
    () =>
      Array.from(Array(Math.max(maxWordLength - (splitGuess?.length || 0), 0))),
    [maxWordLength, splitGuess?.length]
  );

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '0.5rem'
      }}
    >
      {splitGuess.map((letter, i) => (
        <Cell key={i} value={letter} />
      ))}
      {emptyCells.map((_, i) => (
        <Cell key={i} />
      ))}
    </div>
  );
}
