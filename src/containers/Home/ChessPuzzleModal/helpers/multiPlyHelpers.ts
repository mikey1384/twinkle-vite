import { Chess } from 'chess.js';
import { PuzzleMove, equalSAN } from '../types';

/**
 * Converts UCI moves to SAN notation using chess.js
 * Returns UCI as fallback if conversion fails
 */
export function uciToSan({ uci, fen }: { uci: string; fen: string }): string {
  try {
    const chess = new Chess(fen);
    const move = chess.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci.length > 4 ? uci.slice(4) : undefined
    });

    if (!move) {
      console.warn(`Invalid UCI move: ${uci} on position: ${fen}`);
      return uci; // Fallback to UCI
    }

    return move.san;
  } catch (error) {
    console.warn(`Error converting UCI to SAN: ${uci}`, error);
    return uci; // Fallback to UCI
  }
}

/**
 * Converts SAN move to UCI notation using chess.js
 * Returns empty string as fallback if conversion fails
 */
export function sanToUci({ san, fen }: { san: string; fen: string }): string {
  try {
    const chess = new Chess(fen);
    const move = chess.move(san);

    if (!move) {
      console.warn(`Invalid SAN move: ${san} on position: ${fen}`);
      return ''; // Fallback to empty string
    }

    const uci = move.from + move.to + (move.promotion || '');
    return uci;
  } catch (error) {
    console.warn(`Error converting SAN to UCI: ${san}`, error);
    return ''; // Fallback to empty string
  }
}

/**
 * Applies a UCI move to a FEN position and returns the new FEN
 * Returns original FEN as fallback if move application fails
 */
export function applyUciMove({
  fen,
  uci
}: {
  fen: string;
  uci: string;
}): string {
  try {
    const chess = new Chess(fen);
    const move = chess.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci.length > 4 ? uci.slice(4) : undefined
    });

    if (!move) {
      console.warn(`Cannot apply UCI move: ${uci} to position: ${fen}`);
      return fen; // Fallback to original FEN
    }

    return chess.fen();
  } catch (error) {
    console.warn(`Error applying UCI move: ${uci}`, error);
    return fen; // Fallback to original FEN
  }
}

/**
 * Validates if a move matches the expected solution move
 * Now supports position-equivalence: accepts moves that after engine reply
 * lead to the same position as the official line (transpositions)
 */
export function validateMove({
  userMove,
  expectedMove,
  fen,
  engineReply
}: {
  userMove: { from: string; to: string; promotion?: string };
  expectedMove: string; // UCI format
  fen: string;
  engineReply?: string; // UCI format - the next move after expectedMove
}): boolean {
  try {
    // 1) Exact match still passes immediately
    const userUci = userMove.from + userMove.to + (userMove.promotion || '');
    if (userUci === expectedMove) {
      return true;
    }

    // 2) Position-equivalence check: see if user's move + engine reply
    //    reaches the same position as the official line
    if (engineReply) {
      // Play the official line: expected move + engine reply
      const chessOfficial = new Chess(fen);
      const officialMove = chessOfficial.move({
        from: expectedMove.slice(0, 2),
        to: expectedMove.slice(2, 4),
        promotion: expectedMove.length > 4 ? expectedMove.slice(4) : undefined
      });

      if (officialMove) {
        const officialReply = chessOfficial.move({
          from: engineReply.slice(0, 2),
          to: engineReply.slice(2, 4),
          promotion: engineReply.length > 4 ? engineReply.slice(4) : undefined
        });

        if (officialReply) {
          const targetFen = chessOfficial.fen();

          // Play the alternative line: user's move + same engine reply
          const chessAlternative = new Chess(fen);
          const userMoveResult = chessAlternative.move(userMove);

          if (userMoveResult) {
            const altReply = chessAlternative.move({
              from: engineReply.slice(0, 2),
              to: engineReply.slice(2, 4),
              promotion:
                engineReply.length > 4 ? engineReply.slice(4) : undefined
            });

            if (altReply) {
              const altFen = chessAlternative.fen();

              // If positions are identical, this is a valid transposition
              if (altFen === targetFen) {
                return true;
              }
            }
          }
        }
      }
    }

    // 3) Fallback to old SAN comparison for backwards compatibility
    const chess = new Chess(fen);
    const userSan = chess.move(userMove)?.san;

    if (!userSan) {
      return false;
    }

    chess.load(fen);
    const expectedSan = chess.move({
      from: expectedMove.slice(0, 2),
      to: expectedMove.slice(2, 4),
      promotion: expectedMove.length > 4 ? expectedMove.slice(4) : undefined
    })?.san;

    if (!expectedSan) {
      return false;
    }

    return equalSAN(userSan, expectedSan);
  } catch (error) {
    console.error('Error validating move:', error);
    return false;
  }
}

// Evaluation thresholds for accepting alternative moves
const WIN_THRESH_CP = 200; // +2.0 pawns or better
const WIN_THRESH_MATE = 0; // any mate score is fine

/**
 * Async version of validateMove that uses engine evaluation for alternative moves
 * Accepts moves that maintain a decisive advantage even if not in the scripted line
 */
export async function validateMoveAsync({
  userMove,
  expectedMove,
  fen,
  engineReply,
  engineBestMove
}: {
  userMove: { from: string; to: string; promotion?: string };
  expectedMove: string; // UCI format
  fen: string;
  engineReply?: string; // UCI format - the next move after expectedMove
  engineBestMove?: (fen: string) => Promise<{
    success: boolean;
    move?: string;
    evaluation?: number;
    depth?: number;
    error?: string;
  }>;
}): Promise<boolean> {
  try {
    // 1) Exact match still passes immediately
    const userUci = userMove.from + userMove.to + (userMove.promotion || '');
    if (userUci === expectedMove) {
      return true;
    }

    // 2) Position-equivalence check: see if user's move + engine reply
    //    reaches the same position as the official line (transpositions)
    if (engineReply) {
      // Play the official line: expected move + engine reply
      const chessOfficial = new Chess(fen);
      const officialMove = chessOfficial.move({
        from: expectedMove.slice(0, 2),
        to: expectedMove.slice(2, 4),
        promotion: expectedMove.length > 4 ? expectedMove.slice(4) : undefined
      });

      if (officialMove) {
        const officialReply = chessOfficial.move({
          from: engineReply.slice(0, 2),
          to: engineReply.slice(2, 4),
          promotion: engineReply.length > 4 ? engineReply.slice(4) : undefined
        });

        if (officialReply) {
          const targetFen = chessOfficial.fen();

          // Play the alternative line: user's move + same engine reply
          const chessAlternative = new Chess(fen);
          const userMoveResult = chessAlternative.move(userMove);

          if (userMoveResult) {
            const altReply = chessAlternative.move({
              from: engineReply.slice(0, 2),
              to: engineReply.slice(2, 4),
              promotion:
                engineReply.length > 4 ? engineReply.slice(4) : undefined
            });

            if (altReply) {
              const altFen = chessAlternative.fen();

              // If positions are identical, this is a valid transposition
              if (altFen === targetFen) {
                return true;
              }
            }
          }
        }
      }
    }

    // 3) Engine evaluation for alternative moves
    if (engineBestMove) {
      // Clone the position and try the user's move
      const altGame = new Chess(fen);
      const userMoveResult = altGame.move(userMove);

      if (userMoveResult) {
        try {
          const { evaluation, depth } = await engineBestMove(altGame.fen());

          // Accept if still winning position
          // Positive evaluation means advantage for side to move (which is now the opponent)
          // So we want negative evaluation (advantage for the solver)
          const isWinning =
            (evaluation !== undefined && evaluation <= -WIN_THRESH_CP) || // significant material advantage
            (depth !== undefined && depth <= WIN_THRESH_MATE); // mate found (depth 0 or forced mate)

          if (isWinning) {
            console.log(
              `Accepting alternative move ${userUci} with evaluation ${evaluation} (depth ${depth})`
            );
            return true;
          }
        } catch (error) {
          console.warn(
            'Engine evaluation failed, falling back to strict validation:',
            error
          );
          // Continue to fallback validation below
        }
      }
    }

    // 4) Fallback to old SAN comparison for backwards compatibility
    const chess = new Chess(fen);
    const userSan = chess.move(userMove)?.san;

    if (!userSan) {
      return false;
    }

    chess.load(fen);
    const expectedSan = chess.move({
      from: expectedMove.slice(0, 2),
      to: expectedMove.slice(2, 4),
      promotion: expectedMove.length > 4 ? expectedMove.slice(4) : undefined
    })?.san;

    if (!expectedSan) {
      return false;
    }

    return equalSAN(userSan, expectedSan);
  } catch (error) {
    console.error('Error validating move:', error);
    return false;
  }
}

/**
 * Creates a PuzzleMove from UCI and FEN
 */
export function createPuzzleMove({
  uci,
  fen
}: {
  uci: string;
  fen: string;
}): PuzzleMove {
  const san = uciToSan({ uci, fen });
  return {
    san,
    uci,
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    promotion: uci.length > 4 ? uci.slice(4) : undefined
  };
}

/**
 * Builds the current FEN position from initial FEN + move sequence
 */
export function buildCurrentFen({
  initialFen,
  moves
}: {
  initialFen: string;
  moves: string[]; // UCI moves
}): string {
  let currentFen = initialFen;

  for (const uci of moves) {
    currentFen = applyUciMove({ fen: currentFen, uci });
  }

  return currentFen;
}

/**
 * Checks if the current position is game over (checkmate, stalemate, etc.)
 */
export function isGameOver(fen: string): {
  gameOver: boolean;
  reason?:
    | 'checkmate'
    | 'stalemate'
    | 'insufficient-material'
    | 'threefold-repetition'
    | 'fifty-move-rule';
} {
  const chess = new Chess(fen);

  if (chess.isCheckmate()) {
    return { gameOver: true, reason: 'checkmate' };
  }

  if (chess.isStalemate()) {
    return { gameOver: true, reason: 'stalemate' };
  }

  if (chess.isInsufficientMaterial()) {
    return { gameOver: true, reason: 'insufficient-material' };
  }

  if (chess.isThreefoldRepetition()) {
    return { gameOver: true, reason: 'threefold-repetition' };
  }

  if (chess.isDraw()) {
    return { gameOver: true, reason: 'fifty-move-rule' };
  }

  return { gameOver: false };
}
