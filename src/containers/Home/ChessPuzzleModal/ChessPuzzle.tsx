import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo
} from 'react';
import { produce } from 'immer';
import ChessBoard from './ChessBoard';
import {
  convertLichessPuzzle,
  calculatePuzzleXP,
  LichessPuzzle,
  PuzzleGameState,
  uciToSquareIndices,
  indexToAlgebraic,
  algebraicToIndex
} from './helpers/puzzleHelpers';
import { chessStateJSONToFen } from '../../Chat/Chess/helpers/model';
import {
  PuzzleResult,
  PuzzleStatus,
  MoveResult,
  ChessBoardState,
  PuzzleTheme
} from './types';
import { useChessEngine } from './hooks/useChessEngine';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { useKeyContext } from '~/contexts';

interface ChessPuzzleProps {
  puzzle: LichessPuzzle;
  onPuzzleComplete: (result: PuzzleResult) => void;
  onGiveUp?: () => void;
  onNewPuzzle?: () => void;
  loading?: boolean;
}

export default function ChessPuzzle({
  puzzle,
  onPuzzleComplete,
  onGiveUp,
  onNewPuzzle,
  loading
}: ChessPuzzleProps) {
  const { userId } = useKeyContext((v) => v.myState);
  const { getBestMove } = useChessEngine();
  const [gameState, setGameState] = useState<PuzzleGameState | null>(null);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [puzzleStatus, setPuzzleStatus] = useState<PuzzleStatus>('setup');
  const [spoilerOff, setSpoilerOff] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [showCheckmate, setShowCheckmate] = useState(false);
  const [showAiCheckmate, setShowAiCheckmate] = useState(false);
  const [chessBoardState, setChessBoardState] =
    useState<ChessBoardState | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<number | null>(null);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [moveResult, setMoveResult] = useState<MoveResult>({
    type: null,
    message: ''
  });
  const [originalPosition, setOriginalPosition] = useState<any>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Initialize puzzle
  useEffect(() => {
    if (!puzzle || !userId) {
      return;
    }

    const convertedPuzzle = convertLichessPuzzle({
      puzzle,
      userId
    });

    setGameState(convertedPuzzle);
    setChessBoardState(convertedPuzzle.initialState);
    setOriginalPosition(convertedPuzzle.initialState);
    startTimeRef.current = Date.now();

    setPuzzleStatus('playing');
  }, [puzzle, userId]);

  const makeMove = useCallback(
    (
      fromSquare: number,
      toSquare: number,
      boardStateToUpdate?: ChessBoardState
    ) => {
      const currentBoardState = boardStateToUpdate || chessBoardState;
      if (!currentBoardState || !gameState) return false;

      const movingPiece = currentBoardState.board[fromSquare];
      if (!movingPiece || !('isPiece' in movingPiece) || !movingPiece.isPiece)
        return false;

      // Use Immer for efficient immutable update
      const newChessBoardState = produce(currentBoardState, (draft) => {
        // Move the piece
        draft.board[toSquare] = { ...movingPiece, state: 'arrived' };
        draft.board[fromSquare] = {}; // Empty the source square

        // Clear any previous 'arrived' states
        draft.board.forEach((square, i) => {
          if (
            i !== toSquare &&
            'state' in square &&
            square.state === 'arrived'
          ) {
            square.state = '';
          }
        });
      });

      setChessBoardState(newChessBoardState);
      return true;
    },
    [chessBoardState, gameState]
  );

  // Memoize mate puzzle check to avoid re-creating on every render
  const isMatePuzzle = useMemo(
    () =>
      puzzle.themes.some(
        (theme) =>
          theme === PuzzleTheme.MATE ||
          theme === PuzzleTheme.MATE_IN_1 ||
          theme === PuzzleTheme.MATE_IN_2 ||
          theme === PuzzleTheme.MATE_IN_3
      ),
    [puzzle.themes]
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
      try {
        const result = await getBestMove(fen);

        if (result.success && result.move) {
          return result.move;
        }

        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Chess engine error:', result.error);
        }
        return null;
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Chess engine error:', error);
        }
        return null;
      }
    },
    [getBestMove]
  );

  const makeDefensiveMove = useCallback(
    async (boardStateAfterMove?: any) => {
      const boardToAnalyze = boardStateAfterMove || chessBoardState;
      if (!boardToAnalyze || !gameState) return;

      const playerColor = boardToAnalyze.playerColors[userId];

      // Use chess engine for best move - no fallbacks
      try {
        let currentFen = chessStateJSONToFen(boardToAnalyze);

        // Fix turn in FEN - we need opponent's move (White) not player's (Black)
        const fenParts = currentFen.split(' ');
        fenParts[1] = playerColor === 'black' ? 'w' : 'b'; // Flip to opponent's turn
        currentFen = fenParts.join(' ');

        const bestMoveUci = await getBestEngineMove(currentFen);

        if (bestMoveUci) {
          // Opponent's moves need opponent's perspective (opposite of player)
          const opponentIsBlack = playerColor === 'white';
          const { from, to } = uciToSquareIndices({
            uci: bestMoveUci,
            isBlackPlayer: opponentIsBlack
          });

          makeMove(from, to, boardToAnalyze);

          // 🎆 CHECK FOR AI CHECKMATE! 🎆
          // If this is a mate-themed puzzle and AI just delivered checkmate

          if (isMatePuzzle) {
            // AI just checkmated the player for making wrong move!
            setTimeout(() => {
              // Get the current board state (which already includes the AI's checkmate move)
              setChessBoardState((currentState: any) => {
                const currentBoard = [...currentState.board];

                // Find player's king and mark it as checkmated
                for (let i = 0; i < currentBoard.length; i++) {
                  const piece = currentBoard[i];
                  if (
                    piece.isPiece &&
                    piece.type === 'king' &&
                    piece.color === playerColor
                  ) {
                    currentBoard[i] = { ...piece, state: 'checkmate' };
                    break;
                  }
                }

                // Return updated state with highlighted king
                return {
                  ...currentState,
                  board: currentBoard
                };
              });

              setShowAiCheckmate(true);
              setMoveResult({
                type: 'wrong',
                message: '♔ Checkmate! The AI found the killing blow! ♔'
              });

              // Show defeat message after effect
              setTimeout(() => {
                setMoveResult({
                  type: 'wrong',
                  message: `You've been checkmated! The opponent refutes your move. Click 'Try Again' to retry.`
                });
              }, 2000);
            }, 500); // Small delay to see the move first
          }

          return;
        } else {
          console.error('❌ Chess engine returned no move');
          alert('Error: Chess engine could not find a move. Please try again.');
          return;
        }
      } catch (error) {
        console.error('❌ Chess engine error:', error);
        alert(
          'Error: Unable to connect to chess engine. Please check your internet connection and try again.'
        );
        return;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      chessBoardState,
      gameState,
      userId,
      getBestEngineMove,
      makeMove,
      puzzle.themes
    ]
  );

  const resetToOriginalPosition = useCallback(() => {
    if (originalPosition) {
      setChessBoardState({ ...originalPosition });
      setCurrentMoveIndex(0);
      setSelectedSquare(null);
      setIsPlayerTurn(true);
      setShowAiCheckmate(false); // Clear AI checkmate overlay
      setShowCheckmate(false); // Clear player checkmate overlay (just in case)
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
          isBlackPlayer: false // Always use absolute coordinates for move notation
        });
        const toAlgebraic = indexToAlgebraic({
          index: clickedSquare,
          isBlackPlayer: false // Always use absolute coordinates for move notation
        });

        const playerMoveUci = fromAlgebraic + toAlgebraic;

        // Check if player captured the blundered piece (the opponent's key piece from their last move)
        const opponentLastMove = gameState.opponentMove;
        const blunderedPieceSquare = opponentLastMove.to; // Where the opponent moved their piece
        const capturedBlunderedPiece =
          clickedSquare ===
          algebraicToIndex({
            square: blunderedPieceSquare,
            isBlackPlayer: false // Use absolute coordinates
          });

        // Accept move if it matches expected OR if it captures the blundered piece
        const moveIsCorrect =
          (expectedMove && playerMoveUci === expectedMove.uci) ||
          capturedBlunderedPiece;

        if (moveIsCorrect) {
          const newMoveIndex = currentMoveIndex + 1;
          const isLastMove = newMoveIndex >= gameState.solution.length;

          // 🎆 CHECKMATE EFFECT! 🎆
          // Only trigger checkmate for mateIn1 puzzles on the final move
          // This ensures we only show checkmate when it's actually delivered, not just piece captures
          const isActualCheckmate =
            isLastMove && puzzle.themes.includes(PuzzleTheme.MATE_IN_1);

          if (isActualCheckmate) {
            // Find and highlight the enemy king in red
            const updatedBoardWithCheckmate = [...updatedBoardState.board];
            const enemyColor = playerColor === 'white' ? 'black' : 'white';

            // Find enemy king and mark it as checkmated
            for (let i = 0; i < updatedBoardWithCheckmate.length; i++) {
              const piece = updatedBoardWithCheckmate[i];
              if (
                piece.isPiece &&
                piece.type === 'king' &&
                piece.color === enemyColor
              ) {
                updatedBoardWithCheckmate[i] = { ...piece, state: 'checkmate' };
                break;
              }
            }

            // Update board with highlighted king
            setChessBoardState({
              ...updatedBoardState,
              board: updatedBoardWithCheckmate
            });

            setShowCheckmate(true);
            setMoveResult({
              type: 'correct',
              message: '♔ Checkmate! Brilliant finish! ♔'
            });

            // Trigger completion after checkmate effect
            setTimeout(() => {
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
            }, 2000);
            return;
          }

          // Regular correct move
          setMoveResult({
            type: 'correct',
            message: '✅ Excellent move!'
          });
          setCurrentMoveIndex(newMoveIndex);
          setIsPlayerTurn(false);

          // Check if puzzle is completed
          if (isLastMove) {
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
              message: `The opponent refutes your move. Click 'Try Again' to retry.`
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

  const handleSpoilerClick = useCallback(() => {
    setSpoilerOff(true);
  }, []);

  const handleGiveUp = useCallback(() => {
    setShowSolution(true);
    setPuzzleStatus('failed');
    if (onGiveUp) {
      onGiveUp();
    }
  }, [onGiveUp]);

  if (!gameState || !chessBoardState) {
    return <div>Loading puzzle...</div>;
  }

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
      {/* Main Title/Status - Only show when there's a message */}
      {(puzzleStatus === 'setup' ||
        (puzzleStatus === 'playing' && spoilerOff) ||
        puzzleStatus === 'completed' ||
        puzzleStatus === 'failed') && (
        <div
          className={css`
            text-align: center;
            padding: 1rem 2rem;
            border-radius: 12px;
            font-size: 1.5rem;
            font-weight: 700;
            background: ${puzzleStatus === 'completed'
              ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)'
              : puzzleStatus === 'failed'
              ? 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)'
              : 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'};
            color: ${puzzleStatus === 'completed'
              ? '#166534'
              : puzzleStatus === 'failed'
              ? '#dc2626'
              : '#1e40af'};
            border: 1px solid
              ${puzzleStatus === 'completed'
                ? '#86efac'
                : puzzleStatus === 'failed'
                ? '#f87171'
                : '#93c5fd'};
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);

            @media (max-width: 1000px) {
              padding: 0.75rem 1.5rem;
              font-size: 1.25rem;
            }

            @media (max-width: ${mobileMaxWidth}) {
              padding: 1rem 1.25rem;
              font-size: 1.375rem;
            }
          `}
        >
          {puzzleStatus === 'setup' && '⚙️ Setting up puzzle...'}
          {puzzleStatus === 'completed' && '🎉 Checkmate! Puzzle solved!'}
          {puzzleStatus === 'failed' && '😞 Better luck next time!'}
          {puzzleStatus === 'playing' &&
            spoilerOff &&
            !isPlayerTurn &&
            '⏳ AI is thinking...'}
          {puzzleStatus === 'playing' &&
            spoilerOff &&
            isPlayerTurn &&
            '🎯 Find the best move'}
        </div>
      )}

      {/* Main Game Area */}
      <div
        className={css`
          flex: 1;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          grid-template-areas: 'left-panel board right-panel';
          gap: 0.5rem;
          align-items: stretch;
          align-content: center;

          /* Responsive breakpoints */
          @media (max-width: 1200px) {
            grid-template-columns: 0.8fr auto 0.8fr;
            gap: 0.375rem;
          }

          @media (max-width: 1000px) {
            grid-template-columns: 0.6fr auto 0.6fr;
            gap: 0.25rem;
            padding: 0.125rem;
          }

          @media (max-width: ${mobileMaxWidth}) {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            padding: 0.5rem;
            height: auto;
          }
        `}
      >
        {/* 🎆 PLAYER CHECKMATE FIREWORKS OVERLAY 🎆 */}
        {showCheckmate && (
          <div
            className={css`
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              z-index: 1000;
              pointer-events: none;
              display: flex;
              justify-content: center;
              align-items: center;
              background: radial-gradient(
                circle,
                rgba(255, 215, 0, 0.1) 0%,
                rgba(255, 69, 0, 0.05) 50%,
                transparent 100%
              );
              animation: checkmateFireworks 2s ease-out;

              @keyframes checkmateFireworks {
                0% {
                  background: transparent;
                  opacity: 0;
                }
                20% {
                  background: radial-gradient(
                    circle,
                    rgba(255, 215, 0, 0.15) 0%,
                    rgba(255, 69, 0, 0.08) 50%,
                    transparent 100%
                  );
                  opacity: 1;
                }
                60% {
                  background: radial-gradient(
                    circle,
                    rgba(255, 215, 0, 0.1) 0%,
                    rgba(255, 69, 0, 0.05) 50%,
                    transparent 100%
                  );
                }
                100% {
                  background: transparent;
                  opacity: 0;
                }
              }
            `}
          >
            <div
              className={css`
                text-align: center;
                color: #ffd700;
                font-size: 3.5rem;
                font-weight: 800;
                text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.5),
                  0 0 20px rgba(255, 215, 0, 0.8),
                  0 0 30px rgba(255, 215, 0, 0.4);
                animation: checkmateText 2s ease-out;

                @keyframes checkmateText {
                  0% {
                    transform: scale(0.7);
                    opacity: 0;
                  }
                  30% {
                    transform: scale(1.05);
                    opacity: 1;
                  }
                  60% {
                    transform: scale(1);
                  }
                  100% {
                    transform: scale(1);
                    opacity: 0.9;
                  }
                }
              `}
            >
              ♔ Checkmate! ♔
              <div
                className={css`
                  font-size: 1.5rem;
                  margin-top: 0.75rem;
                  color: #ffa500;
                  font-weight: 700;
                  animation: sparkle 1.5s infinite alternate;

                  @keyframes sparkle {
                    0% {
                      text-shadow: 0 0 3px rgba(255, 165, 0, 0.6);
                    }
                    100% {
                      text-shadow: 0 0 10px rgba(255, 165, 0, 0.8),
                        0 0 15px rgba(255, 215, 0, 0.6);
                    }
                  }
                `}
              >
                ✨ Brilliant! ✨
              </div>
            </div>
          </div>
        )}

        {/* 💀 AI CHECKMATE OVERLAY (Red theme for defeat) 💀 */}
        {showAiCheckmate && (
          <div
            className={css`
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              z-index: 1000;
              pointer-events: none;
              display: flex;
              justify-content: center;
              align-items: center;
              background: radial-gradient(
                circle,
                rgba(220, 20, 60, 0.15) 0%,
                rgba(139, 0, 0, 0.08) 50%,
                transparent 100%
              );
              animation: aiCheckmateEffect 2s ease-out;

              @keyframes aiCheckmateEffect {
                0% {
                  background: transparent;
                  opacity: 0;
                }
                20% {
                  background: radial-gradient(
                    circle,
                    rgba(220, 20, 60, 0.12) 0%,
                    rgba(139, 0, 0, 0.06) 50%,
                    transparent 100%
                  );
                  opacity: 1;
                }
                60% {
                  background: radial-gradient(
                    circle,
                    rgba(220, 20, 60, 0.08) 0%,
                    rgba(139, 0, 0, 0.04) 50%,
                    transparent 100%
                  );
                }
                100% {
                  background: transparent;
                  opacity: 0;
                }
              }
            `}
          >
            <div
              className={css`
                text-align: center;
                color: #dc143c;
                font-size: 3.5rem;
                font-weight: 800;
                text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.6),
                  0 0 18px rgba(220, 20, 60, 0.8),
                  0 0 25px rgba(220, 20, 60, 0.5);
                animation: aiCheckmateText 2s ease-out;

                @keyframes aiCheckmateText {
                  0% {
                    transform: scale(0.7);
                    opacity: 0;
                  }
                  30% {
                    transform: scale(1.05);
                    opacity: 1;
                  }
                  60% {
                    transform: scale(1);
                  }
                  100% {
                    transform: scale(1);
                    opacity: 0.9;
                  }
                }
              `}
            >
              ♚ Checkmate! ♚
              <div
                className={css`
                  font-size: 1.5rem;
                  margin-top: 0.75rem;
                  color: #b22222;
                  font-weight: 700;
                  animation: redSparkle 1.5s infinite alternate;

                  @keyframes redSparkle {
                    0% {
                      text-shadow: 0 0 3px rgba(178, 34, 34, 0.6);
                    }
                    100% {
                      text-shadow: 0 0 10px rgba(178, 34, 34, 0.8),
                        0 0 15px rgba(220, 20, 60, 0.6);
                    }
                  }
                `}
              >
                💀 Defeated! 💀
              </div>
            </div>
          </div>
        )}

        {/* Left Panel - Puzzle Info */}
        <div
          className={css`
            grid-area: left-panel;
            display: flex;
            flex-direction: column;
            gap: 0.375rem;
            padding: 0.25rem;
            min-height: 100%;
            justify-content: flex-start;
            box-sizing: border-box;

            @media (max-width: 1000px) {
              gap: 0.25rem;
              padding: 0.125rem;
            }

            @media (max-width: ${mobileMaxWidth}) {
              order: 1;
              min-height: auto;
            }
          `}
        >
          {/* Spacer to make left panel stretch to full height */}
          <div
            className={css`
              flex-grow: 1;
            `}
          />
        </div>

        {/* Chess Board - Center */}
        <div
          className={css`
            grid-area: board;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            box-sizing: border-box;

            @media (max-width: 1000px) {
              gap: 0.5rem;
            }

            @media (max-width: ${mobileMaxWidth}) {
              order: 2;
              gap: 0.625rem;
            }
          `}
        >
          <ChessBoard
            squares={(chessBoardState?.board || []) as any[]}
            playerColor={chessBoardState?.playerColors?.[userId] || 'white'}
            interactable={puzzleStatus === 'playing' && isPlayerTurn}
            onSquareClick={handleSquareClick}
            showSpoiler={!spoilerOff}
            onSpoilerClick={handleSpoilerClick}
            opponentName="AI"
            enPassantTarget={chessBoardState?.enPassantTarget || undefined}
            selectedSquare={selectedSquare}
          />

          {/* Status Bar Below Board */}
          {puzzleStatus === 'playing' && isPlayerTurn && spoilerOff && (
            <div
              className={css`
                text-align: center;
                padding: 0.875rem 1.25rem;
                background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
                border-radius: 10px;
                font-size: 1rem;
                font-weight: 600;
                color: #166534;
                border: 1px solid #86efac;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
              `}
            >
              {selectedSquare !== null
                ? `Selected: ${indexToAlgebraic({
                    index: selectedSquare,
                    isBlackPlayer:
                      chessBoardState?.playerColors?.[userId] === 'black'
                  })} • Click a highlighted square to move`
                : 'Click your pieces to see possible moves'}
            </div>
          )}
        </div>

        {/* Right Panel - Feedback & Actions */}
        <div
          className={css`
            grid-area: right-panel;
            display: flex;
            flex-direction: column;
            gap: 0.375rem;
            padding: 0.25rem;
            min-height: 100%;
            justify-content: flex-start;
            box-sizing: border-box;

            @media (max-width: 1000px) {
              gap: 0.25rem;
              padding: 0.125rem;
            }

            @media (max-width: ${mobileMaxWidth}) {
              order: 3;
              min-height: auto;
            }
          `}
        >
          {/* Dynamic Feedback */}
          {moveResult.type && (
            <div
              className={css`
                text-align: center;
                padding: 1.5rem;
                border-radius: 12px;
                font-weight: 700;
                font-size: 1.25rem;
                line-height: 1.4;
                background: ${moveResult.type === 'correct'
                  ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)'
                  : 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)'};
                color: ${moveResult.type === 'correct' ? '#166534' : '#dc2626'};
                border: 1px solid
                  ${moveResult.type === 'correct' ? '#86efac' : '#f87171'};
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                animation: slideIn 0.4s ease-out;

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

          {/* Action Buttons */}
          {(moveResult.type === 'wrong' || puzzleStatus === 'failed') && (
            <div
              className={css`
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
              `}
            >
              {moveResult.type === 'wrong' && (
                <button
                  onClick={() => {
                    resetToOriginalPosition();
                    setMoveResult({ type: null, message: '' });
                  }}
                  className={css`
                    background: linear-gradient(
                      135deg,
                      #3b82f6 0%,
                      #1d4ed8 100%
                    );
                    color: white;
                    border: none;
                    padding: 1.25rem 2rem;
                    border-radius: 12px;
                    cursor: pointer;
                    font-size: 1.25rem;
                    font-weight: 700;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);

                    &:hover {
                      background: linear-gradient(
                        135deg,
                        #2563eb 0%,
                        #1e40af 100%
                      );
                      transform: translateY(-2px);
                      box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
                    }

                    &:active {
                      transform: translateY(0);
                    }
                  `}
                >
                  🔄 Try Again
                </button>
              )}

              {puzzleStatus !== 'completed' && onGiveUp && (
                <button
                  onClick={handleGiveUp}
                  className={css`
                    background: linear-gradient(
                      135deg,
                      #f8fafc 0%,
                      #e2e8f0 100%
                    );
                    color: #475569;
                    border: 2px solid #cbd5e1;
                    padding: 1.25rem 2rem;
                    border-radius: 12px;
                    cursor: pointer;
                    font-size: 1.25rem;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

                    &:hover {
                      background: linear-gradient(
                        135deg,
                        #e2e8f0 0%,
                        #cbd5e1 100%
                      );
                      border-color: #94a3b8;
                      transform: translateY(-1px);
                      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    }

                    &:active {
                      transform: translateY(0);
                    }
                  `}
                >
                  💡 Show Solution
                </button>
              )}
            </div>
          )}

          {/* Spacer to push New Puzzle button to bottom */}
          <div
            className={css`
              flex-grow: 1;
            `}
          />

          {/* New Puzzle Button - Show after puzzle is solved or given up */}
          {onNewPuzzle &&
            (puzzleStatus === 'completed' || puzzleStatus === 'failed') && (
              <button
                onClick={onNewPuzzle}
                disabled={loading}
                className={css`
                  background: linear-gradient(135deg, #10b981 0%, #047857 100%);
                  color: white;
                  border: none;
                  padding: 1rem 1.5rem;
                  border-radius: 8px;
                  cursor: pointer;
                  font-size: 1.125rem;
                  font-weight: 700;
                  transition: all 0.3s ease;
                  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
                  opacity: ${loading ? 0.6 : 1};

                  @media (max-width: 1000px) {
                    padding: 0.75rem 1.25rem;
                    font-size: 1rem;
                  }

                  @media (max-width: ${mobileMaxWidth}) {
                    padding: 1rem 1.5rem;
                    font-size: 1.125rem;
                  }

                  &:hover {
                    background: linear-gradient(
                      135deg,
                      #059669 0%,
                      #065f46 100%
                    );
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
                  }

                  &:active {
                    transform: translateY(0);
                  }

                  &:disabled {
                    cursor: not-allowed;
                    transform: none !important;
                  }
                `}
              >
                {loading ? '⏳ Loading...' : '🆕 New Puzzle'}
              </button>
            )}
        </div>

        {/* Solution Display in Right Panel */}
        {showSolution && (
          <div
            className={css`
              padding: 1.5rem;
              background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%);
              border-radius: 12px;
              border: 2px solid #fdba74;
              text-align: center;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            `}
          >
            <div
              className={css`
                color: #ea580c;
                font-weight: 700;
                margin-bottom: 1rem;
                font-size: 1.25rem;
              `}
            >
              💡 Complete Solution
            </div>
            <div
              className={css`
                font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono',
                  monospace;
                font-size: 1rem;
                color: #9a3412;
                background: rgba(255, 255, 255, 0.9);
                padding: 1rem;
                border-radius: 8px;
                border: 1px solid rgba(251, 146, 60, 0.3);
                line-height: 1.6;
                font-weight: 600;
              `}
            >
              {gameState.solution.map((move, index) => {
                const moveNumber = Math.floor(index / 2) + 1;
                const isWhiteMove = index % 2 === 0;
                const moveNotation = `${move.from}-${move.to}`;

                return (
                  <span key={index}>
                    {isWhiteMove && `${moveNumber}. `}
                    {moveNotation}
                    {index < gameState.solution.length - 1 && ' '}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
