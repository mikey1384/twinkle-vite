import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo
} from 'react';
import { Chess } from 'chess.js';
import ChessBoard from './ChessBoard';
import {
  calculatePuzzleXP,
  LichessPuzzle,
  uciToSquareIndices,
  indexToAlgebraic,
  algebraicToIndex,
  fenToBoardState
} from './helpers/puzzleHelpers';
import { validateMove, createPuzzleMove } from './helpers/multiPlyHelpers';
import { PuzzleResult, ChessBoardState, MultiPlyPuzzleState } from './types';
import { css } from '@emotion/css';
import { mobileMaxWidth, Color } from '~/constants/css';
import { useKeyContext } from '~/contexts';
import Button from '~/components/Button';

// Helper to convert view coordinates to absolute board coordinates
function viewToBoard(index: number, isBlack: boolean): number {
  if (!isBlack) return index; // White: already absolute
  const row = Math.floor(index / 8);
  const col = index % 8;
  const result = (7 - row) * 8 + (7 - col); // full 180° flip: both rows AND columns
  if (process.env.NODE_ENV === 'development') {
    console.log('🔄 view->board', {
      view: index,
      isBlack,
      board: result,
      row,
      col
    });
  }
  return result;
}

// Helper to convert absolute board coordinates to view coordinates
function boardToView(index: number, isBlack: boolean): number {
  if (!isBlack) return index; // White: view same as absolute
  const row = Math.floor(index / 8);
  const col = index % 8;
  const result = (7 - row) * 8 + (7 - col); // symmetric inverse: full 180° flip
  if (process.env.NODE_ENV === 'development') {
    console.log('🔄 board->view', {
      board: index,
      isBlack,
      view: result,
      row,
      col
    });
  }
  return result;
}

interface MultiPlyChessPuzzleProps {
  puzzle: LichessPuzzle;
  onPuzzleComplete: (result: PuzzleResult) => void;
  onGiveUp?: () => void;
  onNewPuzzle?: () => void;
  loading?: boolean;
}

// Determine puzzle difficulty based on rating
function getPuzzleDifficultyFromRating(
  rating: number
): 'easy' | 'medium' | 'hard' | 'expert' {
  if (rating < 1200) return 'easy';
  if (rating < 1800) return 'medium';
  if (rating < 2300) return 'hard';
  return 'expert';
}

export default function MultiPlyChessPuzzle({
  puzzle,
  onPuzzleComplete,
  onGiveUp,
  onNewPuzzle,
  loading: _loading
}: MultiPlyChessPuzzleProps) {
  const { userId } = useKeyContext((v) => v.myState);

  // Core state machine
  const [puzzleState, setPuzzleState] = useState<MultiPlyPuzzleState>({
    phase: 'WAIT_USER',
    solutionIndex: 0,
    moveHistory: [],
    attemptsUsed: 0,
    showingHint: false,
    autoPlaying: false
  });

  // Board state
  const [chessBoardState, setChessBoardState] =
    useState<ChessBoardState | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<number | null>(null);
  const [legalTargets, setLegalTargets] = useState<number[]>([]);
  const [originalPosition, setOriginalPosition] = useState<any>(null);

  // Chess.js instance for logic
  const chessRef = useRef<Chess | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const animationTimeoutRef = useRef<number | null>(null);

  // Initialize puzzle
  useEffect(() => {
    if (!puzzle || !userId) return;

    // Determine player color directly from the puzzle FEN
    const [_boardPart, turn] = puzzle.fen.split(' ');
    const playerColor = turn === 'w' ? 'white' : 'black'; // The side to move is the player

    // Create board state directly from puzzle FEN
    const initialState = fenToBoardState({
      fen: puzzle.fen,
      userId,
      playerColor
    });

    // Initialize chess.js with the puzzle position (moves[0] is the PLAYER's first move)
    const chess = new Chess(puzzle.fen);

    // NO auto-move of puzzle.moves[0] - that's the player's move!
    chessRef.current = chess;
    setChessBoardState(initialState);
    setOriginalPosition(initialState);
    startTimeRef.current = Date.now();

    // Reset puzzle state - start at index 0 (player's first move)
    setPuzzleState({
      phase: 'WAIT_USER',
      solutionIndex: 0,
      moveHistory: [],
      attemptsUsed: 0,
      showingHint: false,
      autoPlaying: false
    });
  }, [puzzle, userId]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  const resetToOriginalPosition = useCallback(() => {
    if (!puzzle || !originalPosition || !chessRef.current) return;

    // Reset chess.js to puzzle starting position (just the FEN, no moves applied)
    const chess = new Chess(puzzle.fen);

    chessRef.current = chess;
    setChessBoardState((prev) => {
      if (!prev || !originalPosition) return prev;
      return { ...originalPosition };
    });
    setSelectedSquare(null);
    setLegalTargets([]);
    setPuzzleState((prev) => ({
      ...prev,
      phase: 'WAIT_USER',
      solutionIndex: 0,
      moveHistory: [],
      attemptsUsed: prev.attemptsUsed + 1
    }));
  }, [puzzle, originalPosition]);

  const makeEngineMove = useCallback(
    (moveUci: string) => {
      if (!chessRef.current || !chessBoardState) return;

      if (process.env.NODE_ENV === 'development') {
        console.log('🤖 engineMove', moveUci);
      }

      const { from } = uciToSquareIndices(moveUci);

      // Apply move to chess.js to get SAN
      const move = chessRef.current.move({
        from: moveUci.slice(0, 2),
        to: moveUci.slice(2, 4),
        promotion: moveUci.length > 4 ? moveUci.slice(4) : undefined
      });

      if (!move) {
        console.error('Invalid engine move:', moveUci);
        return;
      }

      // Update board visually with functional state update
      setChessBoardState((prev) => {
        if (!prev) return prev;

        const newBoard = [...prev.board];
        let movingPiece = { ...newBoard[from] };
        const toIndex = uciToSquareIndices(moveUci).to;

        // Handle promotion - update piece type based on SAN
        if (move.san.includes('=')) {
          const promotionPiece = move.san.slice(-1).toLowerCase(); // Q, R, B, N
          const pieceTypeMap: { [key: string]: string } = {
            q: 'queen',
            r: 'rook',
            b: 'bishop',
            n: 'knight'
          };
          movingPiece.type = pieceTypeMap[promotionPiece] || 'queen';
        }

        movingPiece.state = 'arrived';
        newBoard[toIndex] = movingPiece;
        newBoard[from] = {};

        // Clear previous arrived states
        newBoard.forEach((square, i) => {
          if (
            i !== toIndex &&
            'state' in square &&
            square.state === 'arrived'
          ) {
            square.state = '';
          }
        });

        return {
          ...prev,
          board: newBoard
        };
      });
    },
    [chessBoardState]
  );

  const handleAutoPlay = useCallback(() => {
    if (!puzzle || puzzleState.autoPlaying) return;

    setPuzzleState((prev) => ({ ...prev, autoPlaying: true }));

    const playMoves = async () => {
      const solutionMoves = puzzle.moves; // All moves are part of the solution

      for (let i = 0; i < solutionMoves.length; i++) {
        const moveUci = solutionMoves[i];
        const isPlayerMove = i % 2 === 0; // Even indices are player moves

        if (process.env.NODE_ENV === 'development') {
          console.log('⏭️ autoPlay index', { i, moveUci, isPlayerMove });
        }

        await new Promise((resolve) => setTimeout(resolve, 400));

        if (isPlayerMove) {
          // User's move - highlight and animate
          const { from } = uciToSquareIndices(moveUci);

          // Convert from absolute board coordinates to view coordinates for highlighting
          const isBlack = chessBoardState?.playerColors[userId] === 'black';
          const viewIndex = boardToView(from, isBlack);
          setSelectedSquare(viewIndex);

          await new Promise((resolve) => setTimeout(resolve, 200));

          // Make the move
          makeEngineMove(moveUci);
          setSelectedSquare(null);
        } else {
          makeEngineMove(moveUci);
        }
      }

      // Mark as auto-played (no XP)
      setTimeout(() => {
        setPuzzleState((prev) => ({
          ...prev,
          phase: 'FAIL', // Mark as failed so user can retry without XP
          autoPlaying: false
        }));
      }, 500);
    };

    playMoves();
  }, [
    puzzle,
    puzzleState.autoPlaying,
    chessBoardState,
    userId,
    makeEngineMove
  ]);

  const handleUserMove = useCallback(
    (from: number, to: number) => {
      if (!chessRef.current || !puzzle || puzzleState.phase !== 'WAIT_USER') {
        return false;
      }

      const isBlack = chessBoardState?.playerColors[userId] === 'black';

      const fromAlgebraic = indexToAlgebraic(viewToBoard(from, isBlack));
      const toAlgebraic = indexToAlgebraic(viewToBoard(to, isBlack));

      // Capture FEN before making the move for validation
      const fenBeforeMove = chessRef.current.fen();

      if (process.env.NODE_ENV === 'development') {
        console.log('📝 validate', {
          fromAlgebraic,
          toAlgebraic,
          fenBeforeMove,
          from,
          to,
          isBlack
        });
      }

      const isPawnPromotion = (() => {
        const absFrom = viewToBoard(from, isBlack);
        const absTo = viewToBoard(to, isBlack);

        const piece = chessBoardState?.board[absFrom];
        const playerColor = piece?.color;
        const targetRank = playerColor === 'white' ? 0 : 7; // 8th rank for white, 1st rank for black
        const targetRankStart = targetRank * 8;
        const targetRankEnd = targetRankStart + 7;

        return (
          piece?.type === 'pawn' &&
          piece?.color === chessBoardState?.playerColors[userId] &&
          absTo >= targetRankStart &&
          absTo <= targetRankEnd
        );
      })();

      // Check if move is legal (with promotion if needed)
      const move = chessRef.current.move({
        from: fromAlgebraic,
        to: toAlgebraic,
        ...(isPawnPromotion && { promotion: 'q' }) // Auto-promote to queen for now
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ move result', move);
      }

      if (!move) {
        return false; // Illegal move
      }

      // Check if move matches expected solution
      const expectedMove = puzzle.moves[puzzleState.solutionIndex]; // No +1 offset needed now
      const isCorrect = validateMove({
        userMove: {
          from: fromAlgebraic,
          to: toAlgebraic,
          promotion: move.promotion
        },
        expectedMove,
        fen: fenBeforeMove // Use FEN from before the move
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 validateMove', {
          expectedMove,
          isCorrect,
          userMove: { from: fromAlgebraic, to: toAlgebraic }
        });
      }

      if (!isCorrect) {
        // Wrong move - go to FAIL state
        setPuzzleState((prev) => {
          const next = {
            ...prev,
            phase: 'FAIL' as const,
            attemptsUsed: prev.attemptsUsed + 1
          };
          if (process.env.NODE_ENV === 'development') {
            console.log('⚙️ phase change', {
              from: prev.phase,
              to: next.phase,
              reason: 'wrong move'
            });
          }
          return next;
        });
        return false;
      }

      // Correct move - update state
      const newMoveHistory = [
        ...puzzleState.moveHistory,
        createPuzzleMove({
          uci: move.from + move.to + (move.promotion || ''),
          fen: fenBeforeMove // Use FEN from before the move, not after
        })
      ];

      const newSolutionIndex = puzzleState.solutionIndex + 1;
      const isLastMove = newSolutionIndex >= puzzle.moves.length;

      setPuzzleState((prev) => {
        const next = {
          ...prev,
          solutionIndex: newSolutionIndex,
          moveHistory: newMoveHistory
        };
        if (process.env.NODE_ENV === 'development') {
          console.log('⚙️ move progress', {
            solutionIndex: newSolutionIndex,
            totalMoves: puzzle.moves.length,
            isLastMove
          });
        }
        return next;
      });

      // Update visual board state to show the move
      setChessBoardState((prev) => {
        if (!prev) return prev;

        // Convert view coordinates to absolute coordinates for board array access
        const absFrom = viewToBoard(from, isBlack);
        const absTo = viewToBoard(to, isBlack);

        if (process.env.NODE_ENV === 'development') {
          console.log('📦 board update', {
            from,
            to,
            absFrom,
            absTo,
            movingPiece: prev.board[absFrom],
            isBlack
          });
        }

        const newBoard = [...prev.board];
        const movingPiece = { ...newBoard[absFrom] };

        // Handle promotion - update piece type if promoted
        if (move.promotion) {
          const pieceTypeMap: { [key: string]: string } = {
            q: 'queen',
            r: 'rook',
            b: 'bishop',
            n: 'knight'
          };
          movingPiece.type = pieceTypeMap[move.promotion] || 'queen';
        }

        movingPiece.state = 'arrived';
        newBoard[absTo] = movingPiece;
        newBoard[absFrom] = {};

        // Clear previous arrived states
        newBoard.forEach((square, i) => {
          if (i !== absTo && 'state' in square && square.state === 'arrived') {
            square.state = '';
          }
        });

        return {
          ...prev,
          board: newBoard
        };
      });

      if (isLastMove) {
        // Puzzle completed!
        setPuzzleState((prev) => {
          const next = { ...prev, phase: 'SUCCESS' as const };
          if (process.env.NODE_ENV === 'development') {
            console.log('⚙️ phase change', {
              from: prev.phase,
              to: next.phase,
              reason: 'puzzle complete'
            });
          }
          return next;
        });

        const timeSpent = Math.floor(
          (Date.now() - startTimeRef.current) / 1000
        );
        const xpEarned = calculatePuzzleXP({
          difficulty: getPuzzleDifficultyFromRating(puzzle.rating),
          solved: true,
          attemptsUsed: puzzleState.attemptsUsed + 1,
          timeSpent
        });

        setTimeout(() => {
          onPuzzleComplete({
            solved: true,
            xpEarned,
            timeSpent,
            attemptsUsed: puzzleState.attemptsUsed + 1
          });
        }, 1000);

        return true;
      }

      // Check if there's an engine reply
      const nextMove = puzzle.moves[newSolutionIndex];
      if (nextMove) {
        // Go to animation phase
        setPuzzleState((prev) => ({ ...prev, phase: 'ANIM_ENGINE' }));

        animationTimeoutRef.current = window.setTimeout(() => {
          makeEngineMove(nextMove);

          const finalIndex = newSolutionIndex + 1;
          const puzzleComplete = finalIndex >= puzzle.moves.length;

          setPuzzleState((prev) => ({
            ...prev,
            phase: puzzleComplete ? 'SUCCESS' : 'WAIT_USER',
            solutionIndex: finalIndex
          }));

          if (puzzleComplete) {
            const timeSpent = Math.floor(
              (Date.now() - startTimeRef.current) / 1000
            );
            const xpEarned = calculatePuzzleXP({
              difficulty: getPuzzleDifficultyFromRating(puzzle.rating),
              solved: true,
              attemptsUsed: puzzleState.attemptsUsed + 1,
              timeSpent
            });

            setTimeout(() => {
              onPuzzleComplete({
                solved: true,
                xpEarned,
                timeSpent,
                attemptsUsed: puzzleState.attemptsUsed + 1
              });
            }, 1000);
          }
        }, 450);
      } else {
        // No engine reply, puzzle complete
        setPuzzleState((prev) => ({ ...prev, phase: 'SUCCESS' }));
      }

      return true;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chessRef, puzzle, puzzleState, makeEngineMove, onPuzzleComplete]
  );

  const handleSquareClick = useCallback(
    (clickedSquare: number) => {
      if (!chessBoardState || puzzleState.phase !== 'WAIT_USER') return;

      // Convert view coordinate to absolute coordinate for piece lookup
      const isBlack = chessBoardState.playerColors[userId] === 'black';
      const absClickedSquare = viewToBoard(clickedSquare, isBlack);

      if (process.env.NODE_ENV === 'development') {
        console.log('🖱️ click', {
          viewIdx: clickedSquare,
          absIdx: absClickedSquare,
          isBlack
        });
      }

      const clickedPiece = chessBoardState.board[absClickedSquare];
      const playerColor = chessBoardState.playerColors[userId];

      // If no piece selected
      if (selectedSquare === null) {
        if (clickedPiece?.isPiece && clickedPiece.color === playerColor) {
          setSelectedSquare(clickedSquare);

          // Calculate legal moves for the selected piece
          const fromAlgebraic = indexToAlgebraic(absClickedSquare);
          const moves = chessRef.current
            ? chessRef.current
                .moves({ square: fromAlgebraic as any, verbose: true })
                .map((m: any) => algebraicToIndex(m.to)) // abs indices
                .map((abs) => boardToView(abs, isBlack)) // view indices
            : [];

          setLegalTargets(moves);

          if (process.env.NODE_ENV === 'development') {
            console.log('🎯 select piece', {
              square: clickedSquare,
              piece: clickedPiece,
              fromAlgebraic,
              legalMoves: moves?.length || 0
            });
          }
        }
        return;
      }

      // If clicking same square, deselect
      if (selectedSquare === clickedSquare) {
        setSelectedSquare(null);
        setLegalTargets([]);
        if (process.env.NODE_ENV === 'development') {
          console.log('🧹 deselect');
        }
        return;
      }

      // If clicking another own piece, select it
      if (clickedPiece?.isPiece && clickedPiece.color === playerColor) {
        setSelectedSquare(clickedSquare);

        // Calculate legal moves for the newly selected piece
        const fromAlgebraic = indexToAlgebraic(absClickedSquare);
        const moves = chessRef.current
          ? chessRef.current
              .moves({ square: fromAlgebraic as any, verbose: true })
              .map((m: any) => algebraicToIndex(m.to)) // abs indices
              .map((abs) => boardToView(abs, isBlack)) // view indices
          : [];

        setLegalTargets(moves);

        if (process.env.NODE_ENV === 'development') {
          console.log('🎯 reselect piece', {
            square: clickedSquare,
            piece: clickedPiece,
            fromAlgebraic,
            legalMoves: moves.length
          });
        }
        return;
      }

      // Try to make move
      const success = handleUserMove(selectedSquare, clickedSquare);
      if (success) {
        setSelectedSquare(null);
        setLegalTargets([]);
        if (process.env.NODE_ENV === 'development') {
          console.log('🧹 deselect after move');
        }
      }
    },
    [chessBoardState, selectedSquare, userId, puzzleState.phase, handleUserMove]
  );

  const currentMoveNumber = Math.floor(puzzleState.solutionIndex / 2) + 1;

  // Memoize SAN conversions for better performance - ALWAYS call this hook
  const moveDisplayCache = useMemo(() => {
    if (!puzzle) return {};

    const cache: { [key: number]: string } = {};

    try {
      // Create a temporary Chess instance for SAN conversions
      const tempChess = new Chess(puzzle.fen);

      puzzle.moves.forEach((moveUci, index) => {
        try {
          const move = tempChess.move({
            from: moveUci.slice(0, 2),
            to: moveUci.slice(2, 4),
            promotion: moveUci.length > 4 ? moveUci.slice(4) : undefined
          });
          cache[index] = move ? move.san : moveUci;
        } catch (_error) {
          cache[index] = moveUci; // Fallback to UCI
        }
      });
    } catch (error) {
      console.warn('Failed to build SAN cache:', error);
    }

    return cache;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle?.fen, puzzle?.moves?.length]); // More precise dependencies

  if (!puzzle || !chessBoardState) {
    return <div>Loading puzzle...</div>;
  }

  const solutionMoves = puzzle.moves; // All moves are part of the solution

  return (
    <div
      className={css`
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        position: relative;
        padding: 0.25rem;
        box-sizing: border-box;
      `}
    >
      {/* Status Header */}
      <div
        className={css`
          text-align: center;
          padding: 1rem 2rem;
          border-radius: 12px;
          font-size: 1.5rem;
          font-weight: 700;
          background: ${puzzleState.phase === 'SUCCESS'
            ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)'
            : puzzleState.phase === 'FAIL'
            ? 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)'
            : 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'};
          color: ${puzzleState.phase === 'SUCCESS'
            ? '#166534'
            : puzzleState.phase === 'FAIL'
            ? '#dc2626'
            : '#1e40af'};
          border: 1px solid
            ${puzzleState.phase === 'SUCCESS'
              ? '#86efac'
              : puzzleState.phase === 'FAIL'
              ? '#f87171'
              : '#93c5fd'};
        `}
      >
        {puzzleState.phase === 'SUCCESS' &&
          '🎉 Puzzle solved! You found the winning line.'}
        {puzzleState.phase === 'FAIL' && '❌ Try again!'}
        {puzzleState.phase === 'WAIT_USER' &&
          `🎯 Find the best move (${currentMoveNumber})`}
        {puzzleState.phase === 'ANIM_ENGINE' && '⏳ Opponent responds...'}
      </div>

      {/* Player Color Indicator */}
      <h3
        className={css`
          text-align: center;
          margin: 0;
          color: ${Color.logoBlue()};
          font-size: 1.25rem;
          font-weight: 600;
        `}
      >
        {chessBoardState?.playerColors[userId] === 'white'
          ? '♔ You are playing White'
          : '♚ You are playing Black'}
      </h3>

      {/* Puzzle Theme Context */}
      {puzzle.themes.length > 0 && (
        <div
          className={css`
            text-align: center;
            margin: 0.5rem 0;
            font-size: 0.9rem;
            color: ${Color.darkerGray()};
            font-style: italic;
          `}
        >
          Theme:{' '}
          {puzzle.themes
            .join(', ')
            .replace(/([A-Z])/g, ' $1')
            .toLowerCase()}
        </div>
      )}

      {/* Main Game Area */}
      <div
        className={css`
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          grid-template-areas: 'left-panel board right-panel';
          gap: 1rem;
          flex-grow: 1;
          min-height: 0;

          @media (max-width: ${mobileMaxWidth}) {
            grid-template-columns: 1fr;
            grid-template-areas:
              'board'
              'left-panel'
              'right-panel';
            gap: 0.75rem;
          }
        `}
      >
        {/* Left Panel - Move List */}
        <div
          className={css`
            grid-area: left-panel;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          `}
        >
          <h4
            className={css`
              margin: 0;
              font-size: 1rem;
              color: ${Color.darkerGray()};
            `}
          >
            Solution Line:
          </h4>

          <ol
            className={css`
              margin: 0;
              padding-left: 1.5rem;
              max-height: 200px;
              overflow-y: auto;
              font-family: 'SF Mono', 'Monaco', monospace;
              font-size: 0.9rem;
            `}
          >
            {solutionMoves.map((moveUci, index) => {
              const moveNumber = Math.floor(index / 2) + 1;
              const isWhiteMove = index % 2 === 0;
              const isCurrent = index === puzzleState.solutionIndex;
              const isPlayed = index < puzzleState.solutionIndex;

              // Use cached SAN conversion for better performance
              const displayMove = moveDisplayCache[index] || moveUci;

              return (
                <li
                  key={index}
                  className={css`
                    color: ${isCurrent
                      ? Color.logoBlue()
                      : isPlayed
                      ? Color.darkGray()
                      : Color.lightGray()};
                    font-weight: ${isCurrent ? 'bold' : 'normal'};
                    margin: 0.25rem 0;
                  `}
                >
                  {isWhiteMove && `${moveNumber}. `}
                  {displayMove}
                </li>
              );
            })}
          </ol>
        </div>

        {/* Chess Board - Center */}
        <div
          className={css`
            grid-area: board;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          `}
        >
          <ChessBoard
            squares={chessBoardState.board as any[]}
            playerColor={chessBoardState.playerColors[userId] || 'white'}
            interactable={
              puzzleState.phase === 'WAIT_USER' && !puzzleState.autoPlaying
            }
            onSquareClick={handleSquareClick}
            showSpoiler={false}
            onSpoilerClick={() => {}}
            opponentName="AI"
            enPassantTarget={chessBoardState.enPassantTarget || undefined}
            selectedSquare={selectedSquare}
            legalTargets={legalTargets}
          />
        </div>

        {/* Right Panel - Controls */}
        <div
          className={css`
            grid-area: right-panel;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          `}
        >
          <Button
            color="orange"
            onClick={resetToOriginalPosition}
            disabled={puzzleState.autoPlaying}
          >
            ↺ Reset
          </Button>

          <Button
            color="purple"
            onClick={handleAutoPlay}
            disabled={
              puzzleState.autoPlaying || puzzleState.phase === 'SUCCESS'
            }
          >
            {puzzleState.autoPlaying ? '▶ Playing...' : '▶ Show Line'}
          </Button>

          {puzzleState.phase === 'FAIL' && (
            <Button color="logoBlue" onClick={resetToOriginalPosition}>
              Try Again
            </Button>
          )}

          {puzzleState.phase === 'SUCCESS' && onNewPuzzle && (
            <Button color="green" onClick={onNewPuzzle}>
              Next Puzzle
            </Button>
          )}

          {onGiveUp && (
            <Button
              color="red"
              onClick={onGiveUp}
              disabled={puzzleState.autoPlaying}
            >
              Give Up
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
