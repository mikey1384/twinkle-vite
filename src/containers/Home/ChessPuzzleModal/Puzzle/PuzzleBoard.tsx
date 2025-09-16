import React, { useMemo } from 'react';
import ChessBoard from '../ChessBoard';
import {
  getLevelCategory,
  canCastle as canCastleHelper,
  applyFenToBoard
} from '../helpers';
import CastlingOverlay from './CastlingOverlay';
import { Chess } from 'chess.js';
import { analysisFadeCls } from './styles';
import { PuzzlePhase } from '~/types/chess';

interface PuzzleBoardProps {
  isReady: boolean;
  chessBoardState: any;
  userId: number;
  puzzleState: any;
  phase: PuzzlePhase;
  selectedSquare: number | null;
  onSquareClick: (index: number) => void;
  chessRef: React.RefObject<Chess | null>;
  setChessBoardState: (fn: (prev: any) => any) => void;
  executeEngineMove: (moveUci: string) => void;
  requestEngineReply: (params: {
    executeEngineMove: (uci: string) => void;
  }) => Promise<void>;
  appendCurrentFen: () => void;
  handleCastling: (
    dir: 'kingside' | 'queenside'
  ) => Promise<boolean | void> | void;
  currentLevel?: number;
}

export default function PuzzleBoard({
  isReady,
  chessBoardState,
  userId,
  selectedSquare,
  onSquareClick,
  chessRef,
  phase,
  setChessBoardState,
  executeEngineMove,
  requestEngineReply,
  appendCurrentFen,
  handleCastling,
  currentLevel
}: PuzzleBoardProps) {
  const emptySquares = useMemo(() => {
    return Array.from({ length: 64 }, () => ({} as any));
  }, []);

  // Choose square colors based on level category (must be declared before any early returns)
  const levelCategory = getLevelCategory(currentLevel || 1);
  const squareColors = useMemo(() => {
    if ((currentLevel || 1) === 42) {
      return { light: '#e0e7ff', dark: '#556377' };
    }
    switch (levelCategory) {
      case 'BEGINNER':
        return undefined;
      case 'INTERMEDIATE':
        return { light: '#dbeafe', dark: '#93c5fd' };
      case 'ADVANCED':
        return { light: '#e2e8f0', dark: '#94a3b8' };
      case 'EXPERT':
        return { light: '#ede9fe', dark: '#c4b5fd' };
      case 'LEGENDARY':
        return { light: '#fee2e2', dark: '#fca5a5' };
      case 'GENIUS':
        return { light: '#fef3c7', dark: '#fbbf24' };
      default:
        return undefined;
    }
  }, [levelCategory, currentLevel]);

  const playerColor = chessBoardState?.playerColor || 'white';
  const overlayPlayerColor = React.useMemo(() => {
    try {
      if (phase === 'ANALYSIS' && chessRef.current) {
        return chessRef.current.turn() === 'w' ? 'white' : 'black';
      }
    } catch {}
    return playerColor;
  }, [phase, chessRef, playerColor]);

  if (!isReady) {
    return (
      <ChessBoard
        className={phase === 'ANALYSIS' ? analysisFadeCls : ''}
        squares={emptySquares as any[]}
        playerColor={'white'}
        interactable={false}
        onSquareClick={() => {}}
        showSpoiler={false}
        enPassantTarget={undefined}
        selectedSquare={null}
        game={undefined}
        squareColors={squareColors}
      />
    );
  }

  const canKingside = canCastleHelper({
    chessInstance: chessRef.current,
    chessBoardState,
    userId,
    side: 'kingside'
  });
  const canQueenside = canCastleHelper({
    chessInstance: chessRef.current,
    chessBoardState,
    userId,
    side: 'queenside'
  });
  const overlayInteractable = phase === 'WAIT_USER' || phase === 'ANALYSIS';

  return (
    <ChessBoard
      className={phase === 'ANALYSIS' ? analysisFadeCls : ''}
      squares={chessBoardState!.board as any[]}
      playerColor={playerColor}
      interactable={overlayInteractable}
      onSquareClick={onSquareClick}
      showSpoiler={false}
      enPassantTarget={chessBoardState!.enPassantTarget || undefined}
      selectedSquare={selectedSquare}
      game={chessRef.current || undefined}
      squareColors={squareColors}
    >
      <CastlingOverlay
        interactable={overlayInteractable}
        playerColor={overlayPlayerColor}
        onCastling={onCastlingClick}
        canKingside={canKingside}
        canQueenside={canQueenside}
        onPreClick={() => {}}
      />
    </ChessBoard>
  );

  async function onCastlingClick(dir: 'kingside' | 'queenside') {
    if (phase === 'ANALYSIS') {
      try {
        const castlingSan = dir === 'kingside' ? 'O-O' : 'O-O-O';
        const moved = chessRef.current?.move(castlingSan);
        if (!moved) return;

        applyFenToBoard({
          fen: chessRef.current!.fen(),
          chessRef,
          setChessBoardState
        });
        try {
          appendCurrentFen();
        } catch {}

        await requestEngineReply({ executeEngineMove });
        return;
      } catch {}
    }
    const success = await handleCastling(dir);
    if (success) {
      try {
        appendCurrentFen();
      } catch {}
    }
  }
}
