import React from 'react';
import Board from './Board';
import BoardFrame from './BoardFrame';

export default function Game({
  interactable,
  loading,
  onClick,
  squares,
  myColor,
  onBoardClick,
  onCastling,
  onSpoilerClick,
  opponentName,
  spoilerOff,
  size = 'regular'
}: {
  interactable: boolean;
  loading: boolean;
  onClick: (v: number) => void;
  squares: any[];
  myColor: string;
  onCastling: (v: string) => void;
  spoilerOff: boolean;
  opponentName: string;
  onBoardClick?: () => void;
  onSpoilerClick: () => void;
  size?: 'regular' | 'compact' | 'inline';
}) {
  return (
    <BoardFrame size={size} loading={loading}>
      {squares.length > 0 ? (
        <Board
          interactable={interactable}
          myColor={myColor}
          onBoardClick={onBoardClick}
          onCastling={onCastling}
          onClick={onClick}
          onSpoilerClick={onSpoilerClick}
          opponentName={opponentName}
          spoilerOff={spoilerOff}
          squares={squares}
          size={size}
        />
      ) : null}
    </BoardFrame>
  );
}
