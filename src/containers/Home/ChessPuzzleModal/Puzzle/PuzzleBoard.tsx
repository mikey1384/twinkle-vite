import React, { useMemo } from 'react';
import ChessBoard from '../ChessBoard';
import CastlingOverlay from './CastlingOverlay';
import { Chess } from 'chess.js';
import {
  canCastle as canCastleHelper,
  getCastlingIndices,
  clearArrivedStatesExcept,
  updateThreatHighlighting
} from '../helpers';
import { analysisFadeCls } from './styles';

interface PuzzleBoardProps {
  isReady: boolean;
  chessBoardState: any;
  userId: number;
  puzzleState: any;
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
}

export default function PuzzleBoard({
  isReady,
  chessBoardState,
  userId,
  puzzleState,
  selectedSquare,
  onSquareClick,
  chessRef,
  setChessBoardState,
  executeEngineMove,
  requestEngineReply,
  appendCurrentFen,
  handleCastling
}: PuzzleBoardProps) {
  const emptySquares = useMemo(() => {
    return Array.from({ length: 64 }, () => ({} as any));
  }, []);

  if (!isReady) {
    return (
      <ChessBoard
        className={
          (puzzleState as any).phase === 'ANALYSIS' ? analysisFadeCls : ''
        }
        squares={emptySquares as any[]}
        playerColor={'white'}
        interactable={false}
        onSquareClick={() => {}}
        showSpoiler={false}
        onSpoilerClick={() => {}}
        enPassantTarget={undefined}
        selectedSquare={null}
        game={undefined}
      />
    );
  }

  const playerColor = chessBoardState!.playerColors[userId] || 'white';
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
  const overlayInteractable =
    puzzleState.phase === 'WAIT_USER' ||
    (puzzleState as any).phase === 'ANALYSIS';

  return (
    <ChessBoard
      className={
        (puzzleState as any).phase === 'ANALYSIS' ? analysisFadeCls : ''
      }
      squares={chessBoardState!.board as any[]}
      playerColor={playerColor}
      interactable={overlayInteractable}
      onSquareClick={onSquareClick}
      showSpoiler={false}
      onSpoilerClick={() => {}}
      enPassantTarget={chessBoardState!.enPassantTarget || undefined}
      selectedSquare={selectedSquare}
      game={chessRef.current || undefined}
    >
      <CastlingOverlay
        interactable={overlayInteractable}
        playerColor={playerColor}
        onCastling={onCastlingClick}
        canKingside={canKingside}
        canQueenside={canQueenside}
        onPreClick={() => {}}
      />
    </ChessBoard>
  );

  async function onCastlingClick(dir: 'kingside' | 'queenside') {
    if ((puzzleState as any)?.phase === 'ANALYSIS') {
      try {
        const castlingSan = dir === 'kingside' ? 'O-O' : 'O-O-O';
        const moved = chessRef.current?.move(castlingSan);
        if (!moved) return;

        const isBlack = playerColor === 'black';
        const isKingside = dir === 'kingside';
        const { kingFrom, kingTo, rookFrom, rookTo } = getCastlingIndices({
          isBlack,
          isKingside
        });

        setChessBoardState((prev: any) => {
          if (!prev) return prev;
          const newBoard = [...prev.board];
          const kingPiece = { ...newBoard[kingFrom] } as any;
          kingPiece.state = 'arrived';
          newBoard[kingTo] = kingPiece;
          newBoard[kingFrom] = {} as any;
          const rookPiece = { ...newBoard[rookFrom] } as any;
          rookPiece.state = 'arrived';
          newBoard[rookTo] = rookPiece;
          newBoard[rookFrom] = {} as any;
          clearArrivedStatesExcept({
            board: newBoard,
            keepIndices: [kingTo, rookTo]
          });
          updateThreatHighlighting({
            board: newBoard,
            chessInstance: chessRef.current!
          });
          return {
            ...prev,
            board: newBoard,
            isCheck: chessRef.current?.isCheck() || false,
            isCheckmate: chessRef.current?.isCheckmate() || false
          } as any;
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
