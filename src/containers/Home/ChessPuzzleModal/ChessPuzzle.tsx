import React, { useState, useEffect, useCallback, useRef } from 'react';
import ChessBoard from './ChessBoard';
import {
  convertLichessPuzzle,
  calculatePuzzleXP,
  LichessPuzzle,
  PuzzleGameState,
  uciToSquareIndices,
  indexToAlgebraic
} from './helpers/puzzleHelpers';
import { chessStateJSONToFen } from '../../Chat/Chess/helpers/model';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useKeyContext } from '~/contexts';

interface ChessPuzzleProps {
  puzzle: LichessPuzzle;
  onPuzzleComplete: (result: {
    solved: boolean;
    xpEarned: number;
    timeSpent: number;
    attemptsUsed: number;
  }) => void;
  onGiveUp?: () => void;
}

export default function ChessPuzzle({
  puzzle,
  onPuzzleComplete,
  onGiveUp
}: ChessPuzzleProps) {
  const { userId } = useKeyContext((v) => v.myState);
  const [gameState, setGameState] = useState<PuzzleGameState | null>(null);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [puzzleStatus, setPuzzleStatus] = useState<
    'setup' | 'playing' | 'completed' | 'failed'
  >('setup');
  const [spoilerOff, setSpoilerOff] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [chessBoardState, setChessBoardState] = useState<any>(null);
  const [selectedSquare, setSelectedSquare] = useState<number | null>(null);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [moveResult, setMoveResult] = useState<{
    type: 'correct' | 'wrong' | null;
    message: string;
  }>({ type: null, message: '' });
  const [originalPosition, setOriginalPosition] = useState<any>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Initialize puzzle
  useEffect(() => {
    if (!puzzle || !userId) {
      return;
    }

    const opponentId = 999999999; // Dummy opponent ID for puzzle mode (very large to avoid conflicts)
    const convertedPuzzle = convertLichessPuzzle({
      puzzle,
      userId,
      opponentId
    });

    setGameState(convertedPuzzle);
    setChessBoardState(convertedPuzzle.initialState);
    setOriginalPosition(convertedPuzzle.initialState);
    startTimeRef.current = Date.now();

    // Auto-play opponent's first move after a short delay
    setTimeout(() => {
      playOpponentMove(convertedPuzzle);
    }, 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle, userId]);

  const playOpponentMove = useCallback(
    (state: PuzzleGameState) => {
      // Convert UCI move to board indices and simulate the opponent's move
      const { from: _from, to: _to } = uciToSquareIndices({
        uci: state.opponentMove.uci,
        isBlackPlayer: state.initialState.playerColors[userId] === 'black'
      });

      // This would trigger your existing chess move logic
      // For now, we'll just update the status to start the puzzle
      setPuzzleStatus('playing');
    },
    [userId]
  );

  const makeMove = useCallback(
    (fromSquare: number, toSquare: number, boardStateToUpdate?: any) => {
      const currentBoardState = boardStateToUpdate || chessBoardState;
      if (!currentBoardState || !gameState) return false;

      // Create new board state with the move
      const newBoard = [...currentBoardState.board];
      const movingPiece = newBoard[fromSquare];

      if (!movingPiece || !movingPiece.isPiece) return false;

      // Move the piece
      newBoard[toSquare] = { ...movingPiece, state: 'arrived' };
      newBoard[fromSquare] = {}; // Empty the source square

      // Clear any previous 'arrived' states
      for (let i = 0; i < newBoard.length; i++) {
        if (i !== toSquare && newBoard[i].state === 'arrived') {
          newBoard[i] = { ...newBoard[i], state: '' };
        }
      }

      // Update the board state
      const newChessBoardState = {
        ...currentBoardState,
        board: newBoard
      };

      setChessBoardState(newChessBoardState);
      return true;
    },
    [chessBoardState, gameState]
  );

  const makeOpponentMove = useCallback(
    (moveUci: string) => {
      if (!chessBoardState || !gameState) return;

      const playerColor = chessBoardState.playerColors[userId];
      const { from, to } = uciToSquareIndices({
        uci: moveUci,
        isBlackPlayer: playerColor === 'black'
      });

      // Make the opponent's move
      makeMove(from, to);
    },
    [chessBoardState, gameState, userId, makeMove]
  );

  const getBestEngineMove = useCallback(
    async (fen: string): Promise<string | null> => {
      // Method 1: Try PlayStrategy.org (Lichess fork with better CORS)
      try {
        const playStrategyResponse = await fetch(
          `https://playstrategy.org/api/cloud-eval?fen=${encodeURIComponent(
            fen
          )}&multiPv=1&variant=standard`,
          {
            method: 'GET',
            headers: {
              Accept: 'application/json'
            }
          }
        );

        if (playStrategyResponse.ok) {
          const data = await playStrategyResponse.json();
          if (data.pvs && data.pvs[0] && data.pvs[0].moves) {
            const bestMove = data.pvs[0].moves.split(' ')[0];
            console.log('✅ PlayStrategy.org returned:', bestMove);
            return bestMove;
          }
        }
      } catch (error) {
        console.error('Error calling PlayStrategy API:', error);
      }

      // Method 2: Try Lichess cloud-eval
      try {
        const lichessResponse = await fetch(
          `https://lichess.org/api/cloud-eval?fen=${encodeURIComponent(
            fen
          )}&multiPv=1&variant=standard`,
          {
            method: 'GET',
            headers: {
              Accept: 'application/json'
            }
          }
        );

        if (lichessResponse.ok) {
          const lichessData = await lichessResponse.json();
          if (
            lichessData.pvs &&
            lichessData.pvs[0] &&
            lichessData.pvs[0].moves
          ) {
            const bestMove = lichessData.pvs[0].moves.split(' ')[0];
            console.log('✅ Lichess returned:', bestMove);
            return bestMove;
          }
        }
      } catch (error) {
        console.error('Error calling Lichess API:', error);
      }

      // Method 3: Try Chess-API.com
      try {
        const chessApiResponse = await fetch('https://chess-api.com/v1', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ fen, depth: 12 })
        });

        if (chessApiResponse.ok) {
          const data = await chessApiResponse.json();
          if (data.move) {
            console.log('✅ Chess-API.com returned:', data.move);
            return data.move;
          }
        }
      } catch (error) {
        console.error('Error calling Chess-API.com:', error);
      }

      console.log('All chess engine APIs failed');
      return null;
    },
    []
  );

  const makeDefensiveMove = useCallback(
    async (boardStateAfterMove?: any) => {
      const boardToAnalyze = boardStateAfterMove || chessBoardState;
      if (!boardToAnalyze || !gameState) return;

      try {
        // Convert current board state to FEN
        const currentFen = chessStateJSONToFen(boardToAnalyze);
        console.log('🔍 Analyzing position:', currentFen);

        // Get the best move from chess engine
        const bestMoveUci = await getBestEngineMove(currentFen);

        if (bestMoveUci) {
          console.log('♟️ Engine move:', bestMoveUci);
          const playerColor = boardToAnalyze.playerColors[userId];
          const { from, to } = uciToSquareIndices({
            uci: bestMoveUci,
            isBlackPlayer: playerColor === 'black'
          });

          makeMove(from, to, boardToAnalyze);
        } else {
          // Fallback to a simple defensive move if all APIs fail
          console.warn(
            'All chess engine APIs failed. Trying simple heuristic move...'
          );
          const playerColor = boardToAnalyze.playerColors[userId];
          const opponentColor = playerColor === 'white' ? 'black' : 'white';
          const board = boardToAnalyze.board;

          // Simple fallback: try to capture a piece if possible
          let moveMade = false;
          for (let i = 0; i < board.length && !moveMade; i++) {
            if (board[i].isPiece && board[i].color === opponentColor) {
              for (let j = 0; j < board.length; j++) {
                if (board[j].isPiece && board[j].color === playerColor) {
                  // Simple capture attempt (not checking if legal)
                  console.log(
                    `Making fallback capture move: ${i} captures ${j}`
                  );
                  makeMove(i, j, boardToAnalyze);
                  moveMade = true;
                  return;
                }
              }
            }
          }

          if (!moveMade) {
            console.warn(
              'No capture moves available, trying any piece move...'
            );
            // If no captures, try to move any opponent piece
            for (let i = 0; i < board.length; i++) {
              if (board[i].isPiece && board[i].color === opponentColor) {
                for (let j = 0; j < board.length; j++) {
                  if (!board[j].isPiece) {
                    console.log(
                      `Making fallback non-capture move: ${i} to ${j}`
                    );
                    makeMove(i, j, boardToAnalyze);
                    return;
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error in makeDefensiveMove:', error);
        // Inline simple defensive move as fallback
        const playerColor = boardToAnalyze.playerColors[userId];
        const opponentColor = playerColor === 'white' ? 'black' : 'white';
        const board = boardToAnalyze.board;

        // Simple fallback: try to capture a piece if possible
        let moveMade = false;
        for (let i = 0; i < board.length && !moveMade; i++) {
          if (board[i].isPiece && board[i].color === opponentColor) {
            for (let j = 0; j < board.length; j++) {
              if (board[j].isPiece && board[j].color === playerColor) {
                // Simple capture attempt (not checking if legal)
                console.log(
                  `Making emergency fallback move: ${i} captures ${j}`
                );
                makeMove(i, j, boardToAnalyze);
                moveMade = true;
                return;
              }
            }
          }
        }

        if (!moveMade) {
          // If no captures, try to move any piece
          for (let i = 0; i < board.length; i++) {
            if (board[i].isPiece && board[i].color === opponentColor) {
              for (let j = 0; j < board.length; j++) {
                if (!board[j].isPiece) {
                  console.log(
                    `Making emergency fallback non-capture: ${i} to ${j}`
                  );
                  makeMove(i, j, boardToAnalyze);
                  return;
                }
              }
            }
          }
        }
      }
    },
    [chessBoardState, gameState, userId, makeMove, getBestEngineMove]
  );

  const resetToOriginalPosition = useCallback(() => {
    if (originalPosition) {
      setChessBoardState({ ...originalPosition });
      setCurrentMoveIndex(0);
      setSelectedSquare(null);
      setIsPlayerTurn(true);
    }
  }, [originalPosition]);

  const handleSquareClick = useCallback(
    (clickedSquare: number) => {
      if (
        !gameState ||
        puzzleStatus !== 'playing' ||
        !chessBoardState ||
        !isPlayerTurn
      )
        return;

      const clickedPiece = chessBoardState.board[clickedSquare];
      const playerColor = chessBoardState.playerColors[userId];

      // Clear any previous feedback when starting a new move
      if (moveResult.type) {
        setMoveResult({ type: null, message: '' });
      }

      // If no piece is selected
      if (selectedSquare === null) {
        // Only select player's own pieces
        if (clickedPiece?.isPiece && clickedPiece.color === playerColor) {
          setSelectedSquare(clickedSquare);
        }
        return;
      }

      // If clicking on the same square, deselect
      if (selectedSquare === clickedSquare) {
        setSelectedSquare(null);
        return;
      }

      // If clicking on another piece of the same color, select that piece
      if (clickedPiece?.isPiece && clickedPiece.color === playerColor) {
        setSelectedSquare(clickedSquare);
        return;
      }

      // Try to make a move
      const moveSuccessful = makeMove(selectedSquare, clickedSquare);

      if (moveSuccessful) {
        setSelectedSquare(null);

        // Create updated board state with the move for engine analysis
        const updatedBoard = [...chessBoardState.board];
        const movingPiece = updatedBoard[selectedSquare];
        updatedBoard[clickedSquare] = { ...movingPiece, state: 'arrived' };
        updatedBoard[selectedSquare] = {}; // Empty the source square

        const updatedBoardState = {
          ...chessBoardState,
          board: updatedBoard
        };

        // Check if this move matches the expected solution
        const expectedMove = gameState.solution[currentMoveIndex];
        const fromAlgebraic = indexToAlgebraic({
          index: selectedSquare,
          isBlackPlayer: playerColor === 'black'
        });
        const toAlgebraic = indexToAlgebraic({
          index: clickedSquare,
          isBlackPlayer: playerColor === 'black'
        });

        const playerMoveUci = fromAlgebraic + toAlgebraic;

        console.log('🎯 Player move:', playerMoveUci);

        console.log('Move validation:', {
          playerMoveUci,
          expectedMoveUci: expectedMove?.uci,
          matches: expectedMove && playerMoveUci === expectedMove.uci
        });

        if (expectedMove && playerMoveUci === expectedMove.uci) {
          // Correct move!
          console.log('✅ Correct move!');
          setMoveResult({
            type: 'correct',
            message: '✅ Correct! Great move!'
          });
          const newMoveIndex = currentMoveIndex + 1;
          setCurrentMoveIndex(newMoveIndex);
          setIsPlayerTurn(false);

          // Check if puzzle is completed
          if (newMoveIndex >= gameState.solution.length) {
            // Puzzle completed successfully!
            const timeSpent = Math.floor(
              (Date.now() - startTimeRef.current) / 1000
            );
            const xpEarned = calculatePuzzleXP({
              difficulty: gameState.difficulty,
              solved: true,
              attemptsUsed: attemptsUsed + 1,
              timeSpent
            });

            setPuzzleStatus('completed');
            onPuzzleComplete({
              solved: true,
              xpEarned,
              timeSpent,
              attemptsUsed: attemptsUsed + 1
            });
            return;
          }

          // Play opponent's response (if any)
          setTimeout(() => {
            // Clear the correct move feedback
            setMoveResult({ type: null, message: '' });

            if (gameState.solution[newMoveIndex]) {
              makeOpponentMove(gameState.solution[newMoveIndex].uci);
              setCurrentMoveIndex(newMoveIndex + 1);

              // Check again if puzzle is completed after opponent's move
              if (newMoveIndex + 1 >= gameState.solution.length) {
                const timeSpent = Math.floor(
                  (Date.now() - startTimeRef.current) / 1000
                );
                const xpEarned = calculatePuzzleXP({
                  difficulty: gameState.difficulty,
                  solved: true,
                  attemptsUsed: attemptsUsed + 1,
                  timeSpent
                });

                setPuzzleStatus('completed');
                onPuzzleComplete({
                  solved: true,
                  xpEarned,
                  timeSpent,
                  attemptsUsed: attemptsUsed + 1
                });
              } else {
                setIsPlayerTurn(true);
              }
            } else {
              setIsPlayerTurn(true);
            }
          }, 1500); // 1.5 second delay for opponent move
        } else {
          // Wrong move - show why it doesn't work
          console.log('❌ Wrong move!');
          setMoveResult({
            type: 'wrong',
            message: '❌ Wrong move! Watch how the opponent responds...'
          });
          setAttemptsUsed((prev) => prev + 1);
          setIsPlayerTurn(false);

          // Make a defensive move to show why the user's move doesn't work
          setTimeout(() => {
            makeDefensiveMove(updatedBoardState);

            setMoveResult({
              type: 'wrong',
              message: `The opponent refutes your move. The correct move was ${expectedMove?.from} to ${expectedMove?.to}. Click 'Try Again' to retry.`
            });
          }, 1500);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      gameState,
      puzzleStatus,
      chessBoardState,
      userId,
      selectedSquare,
      currentMoveIndex,
      attemptsUsed,
      isPlayerTurn,
      makeMove,
      makeOpponentMove,
      makeDefensiveMove,
      resetToOriginalPosition,
      onPuzzleComplete
    ]
  );

  const handleShowHint = useCallback(() => {
    if (!gameState || !isPlayerTurn) return;

    const currentSolutionMove = gameState.solution[currentMoveIndex];
    if (currentSolutionMove) {
      // Show the move notation as a hint
      setShowHint(true);
    }
  }, [gameState, isPlayerTurn, currentMoveIndex]);

  const handleSpoilerClick = useCallback(() => {
    setSpoilerOff(true);
  }, []);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '#4CAF50';
      case 'medium':
        return '#FF9800';
      case 'hard':
        return '#F44336';
      case 'expert':
        return '#9C27B0';
      default:
        return Color.darkerGray();
    }
  };

  if (!gameState || !chessBoardState) {
    return <div>Loading puzzle...</div>;
  }

  return (
    <div
      className={css`
        width: 100%;
        background: #fff;
        border-radius: 8px;
        padding: 1rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

        @media (max-width: ${mobileMaxWidth}) {
          padding: 0.5rem;
        }
      `}
    >
      {/* Puzzle Header */}
      <div
        className={css`
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          flex-wrap: wrap;
          gap: 0.5rem;
        `}
      >
        <div>
          <h3
            className={css`
              margin: 0 0 0.25rem 0;
              color: ${Color.darkerGray()};
            `}
          >
            Chess Puzzle #{puzzle.id}
          </h3>
          <div
            className={css`
              display: flex;
              gap: 1rem;
              align-items: center;
              flex-wrap: wrap;
            `}
          >
            <span
              className={css`
                background: ${getDifficultyColor(gameState.difficulty)};
                color: white;
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                font-size: 0.875rem;
                font-weight: 500;
                text-transform: capitalize;
              `}
            >
              {gameState.difficulty}
            </span>
            <span
              className={css`
                color: ${Color.darkGray()};
                font-size: 0.875rem;
              `}
            >
              Rating: {puzzle.rating}
            </span>
            <span
              className={css`
                color: ${Color.darkGray()};
                font-size: 0.875rem;
              `}
            >
              Themes: {puzzle.themes.slice(0, 3).join(', ')}
            </span>
          </div>
        </div>

        <div
          className={css`
            display: flex;
            gap: 0.5rem;
          `}
        >
          {moveResult.type === 'wrong' && (
            <button
              onClick={() => {
                resetToOriginalPosition();
                setMoveResult({ type: null, message: '' });
              }}
              className={css`
                background: ${Color.orange()};
                color: white;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.875rem;
                font-weight: 500;

                &:hover {
                  background: ${Color.darkBrownOrange()};
                }
              `}
            >
              Try Again
            </button>
          )}

          <button
            onClick={handleShowHint}
            disabled={puzzleStatus !== 'playing'}
            className={css`
              background: ${Color.logoBlue()};
              color: white;
              border: none;
              padding: 0.5rem 1rem;
              border-radius: 4px;
              cursor: pointer;
              font-size: 0.875rem;

              &:hover:not(:disabled) {
                background: ${Color.darkBlue()};
              }

              &:disabled {
                background: ${Color.lightGray()};
                cursor: not-allowed;
              }
            `}
          >
            Hint
          </button>

          {onGiveUp && (
            <button
              onClick={onGiveUp}
              disabled={puzzleStatus === 'completed'}
              className={css`
                background: ${Color.rose()};
                color: white;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.875rem;

                &:hover:not(:disabled) {
                  background: ${Color.darkRed()};
                }

                &:disabled {
                  background: ${Color.lightGray()};
                  cursor: not-allowed;
                }
              `}
            >
              Give Up
            </button>
          )}
        </div>
      </div>

      {/* Status Message */}
      <div
        className={css`
          margin-bottom: 1rem;
          padding: 0.75rem;
          border-radius: 4px;
          font-weight: 500;
          background: ${puzzleStatus === 'completed'
            ? '#E8F5E8'
            : puzzleStatus === 'failed'
            ? '#FFEBEE'
            : puzzleStatus === 'playing'
            ? '#E3F2FD'
            : '#F5F5F5'};
          color: ${puzzleStatus === 'completed'
            ? '#2E7D32'
            : puzzleStatus === 'failed'
            ? '#C62828'
            : puzzleStatus === 'playing'
            ? '#1565C0'
            : Color.darkerGray()};
        `}
      >
        {puzzleStatus === 'setup' && 'Setting up puzzle...'}
        {puzzleStatus === 'playing' &&
          !isPlayerTurn &&
          '⏳ Opponent is thinking...'}
        {puzzleStatus === 'playing' &&
          isPlayerTurn &&
          `🎯 Your turn! Find the best move (${
            Math.floor(currentMoveIndex / 2) + 1
          }/${Math.ceil(gameState.solution.length / 2)})`}
        {puzzleStatus === 'completed' && '🎉 Puzzle solved! Great job!'}
        {puzzleStatus === 'failed' &&
          '😞 Puzzle failed. Better luck next time!'}
        {attemptsUsed > 0 &&
          puzzleStatus === 'playing' &&
          ` • ${attemptsUsed} attempt${attemptsUsed > 1 ? 's' : ''} used`}
      </div>

      {/* Move Result Feedback */}
      {moveResult.type && (
        <div
          className={css`
            margin-bottom: 1rem;
            padding: 0.75rem;
            border-radius: 4px;
            font-weight: 500;
            background: ${moveResult.type === 'correct'
              ? '#E8F5E8'
              : '#FFEBEE'};
            color: ${moveResult.type === 'correct' ? '#2E7D32' : '#C62828'};
            animation: slideIn 0.3s ease-out;

            @keyframes slideIn {
              from {
                opacity: 0;
                transform: translateY(-10px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}
        >
          {moveResult.message}
        </div>
      )}

      {/* Hint */}
      {showHint && gameState.solution[currentMoveIndex] && (
        <div
          className={css`
            margin-bottom: 1rem;
            padding: 0.75rem;
            background: #fff3e0;
            border-radius: 4px;
            color: #e65100;
          `}
        >
          <strong>Hint:</strong> Try moving from{' '}
          {gameState.solution[currentMoveIndex].from} to{' '}
          {gameState.solution[currentMoveIndex].to}
        </div>
      )}

      <ChessBoard
        squares={chessBoardState?.board || []}
        playerColor={chessBoardState?.playerColors?.[userId] || 'white'}
        interactable={puzzleStatus === 'playing' && isPlayerTurn}
        onSquareClick={handleSquareClick}
        showSpoiler={!spoilerOff}
        onSpoilerClick={handleSpoilerClick}
        opponentName="AI"
        enPassantTarget={chessBoardState?.enPassantTarget || undefined}
        selectedSquare={selectedSquare}
      />

      {/* Instructions */}
      <div
        className={css`
          margin-top: 1rem;
          padding: 0.75rem;
          background: ${Color.lightGray()};
          border-radius: 4px;
          font-size: 0.875rem;
          color: ${Color.darkerGray()};
        `}
      >
        <p style={{ margin: '0 0 0.5rem 0' }}>
          <strong>How to play:</strong> Find the best sequence of moves in this
          position. You need to play {Math.ceil(gameState.solution.length / 2)}{' '}
          correct move
          {Math.ceil(gameState.solution.length / 2) > 1 ? 's' : ''} to solve the
          puzzle.
        </p>
        <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>
          {selectedSquare !== null
            ? `Selected: ${indexToAlgebraic({
                index: selectedSquare,
                isBlackPlayer:
                  chessBoardState?.playerColors?.[userId] === 'black'
              })} • Click on a highlighted square to move`
            : isPlayerTurn
            ? 'Click on your pieces to see possible moves'
            : 'Waiting for opponent...'}
        </p>
      </div>
    </div>
  );
}
