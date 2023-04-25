import React from 'react';
import Cell from './Cell';

export default function EmptyRow({ maxWordLength }: { maxWordLength: number }) {
  const emptyCells = Array.from(Array(maxWordLength));

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '0.5rem'
      }}
    >
      {emptyCells.map((_, i) => (
        <Cell key={i} />
      ))}
    </div>
  );
}
