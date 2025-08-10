import React from 'react';
import CastlingButton from './CastlingButton';

export default function CastlingOverlay({
  interactable,
  playerColor,
  canKingside,
  canQueenside,
  onCastling,
  onPreClick
}: {
  interactable: boolean;
  playerColor: string;
  canKingside: boolean;
  canQueenside: boolean;
  onCastling: (dir: 'kingside' | 'queenside') => void | Promise<void>;
  onPreClick?: (dir: 'kingside' | 'queenside') => void;
}) {
  return (
    <CastlingButton
      interactable={interactable}
      playerColor={playerColor}
      canKingside={canKingside}
      canQueenside={canQueenside}
      onCastling={onCastling}
      onPreClickLog={onPreClick}
    />
  );
}
