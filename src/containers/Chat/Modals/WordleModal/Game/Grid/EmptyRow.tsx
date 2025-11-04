import React from 'react';
import Cell from './Cell';

export default function EmptyRow({
  maxWordLength,
  uiScale = 1
}: {
  maxWordLength: number;
  uiScale?: number;
}) {
  const emptyCells = Array.from(Array(maxWordLength));

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: `${0.5 * uiScale}rem`
      }}
    >
      {emptyCells.map((_, i) => (
        <Cell key={i} uiScale={uiScale} />
      ))}
    </div>
  );
}
