import { Chess } from 'chess.js';
import { equalSAN, PuzzleMove } from '~/types/chess';

const WIN_THRESH_CP = 150;
const WIN_THRESH_MATE = 0;

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
    mate?: number;
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
          const { evaluation, depth, mate } = await engineBestMove(
            altGame.fen()
          );

          // Accept if still winning position
          // After our move, it's opponent's turn, so positive eval = good for opponent (bad for us)
          // We want negative eval = good for us, or a mate found
          let isWinning = false;

          // Check for mate first (different engines format this differently)
          if (mate !== undefined && mate < 0) {
            // Mate in N moves for us (negative mate means opponent gets mated)
            isWinning = true;
          } else if (evaluation !== undefined && evaluation <= -WIN_THRESH_CP) {
            // Significant material advantage for us (negative = good for us)
            isWinning = true;
          } else if (depth !== undefined && depth <= WIN_THRESH_MATE) {
            // Fallback: sometimes engines return depth 0 for immediate mate
            isWinning = true;
          }

          if (isWinning) {
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

function uciToSan({ uci, fen }: { uci: string; fen: string }): string {
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
