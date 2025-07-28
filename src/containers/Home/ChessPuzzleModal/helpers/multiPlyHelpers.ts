import { Chess } from 'chess.js';
import { PuzzleMove } from '~/types/chess';

function scoreForPlayer(cp: number, playerToMoveIsMe: boolean): number {
  return playerToMoveIsMe ? cp : -cp;
}

function toStandard(cp: number | undefined, whiteToMove: boolean) {
  if (cp === undefined) return undefined;
  return whiteToMove ? cp : -cp;
}

const fmt = (cp?: number) =>
  cp === undefined ? '—' : (cp > 0 ? '+' : '') + (cp / 100).toFixed(2);

export async function validateMoveAsync({
  userMove,
  fen,
  engineBestMove
}: {
  userMove: { from: string; to: string; promotion?: string };
  fen: string;
  engineBestMove: (
    fen: string,
    depth?: number,
    timeout?: number
  ) => Promise<{
    success: boolean;
    move?: string;
    evaluation?: number;
    depth?: number;
    mate?: number;
    error?: string;
  }>;
}): Promise<boolean> {
  const game = new Chess(fen);

  // Get engine evaluation before the move
  const beforeResult = await engineBestMove(fen, 15, 5000);
  if (!beforeResult.success) {
    console.error('Engine failed before move:', beforeResult.error);
    return false;
  }

  // Display in standard format
  const fenWhiteToMove = / w /.test(fen);
  const stdBefore = toStandard(beforeResult.evaluation, fenWhiteToMove);
  console.log(
    `STD BEFORE: ${fmt(stdBefore)}, mate=${
      beforeResult.mate
    }, engine suggests=${beforeResult.move}`
  );

  // Make user's move
  const move = game.move(userMove);
  if (!move) return false;

  const userMoveStr = `${userMove.from}${userMove.to}${
    userMove.promotion || ''
  }`;
  console.log(`USER MOVE: ${userMoveStr} (${move.san})`);

  // Check if the position is checkmate/stalemate before engine evaluation
  if (game.isCheckmate()) {
    console.log(`✓ ACCEPTED: ${userMoveStr} - CHECKMATE!`);
    return true;
  }

  if (game.isStalemate()) {
    console.log(`✓ ACCEPTED: ${userMoveStr} - stalemate (draw)`);
    return true;
  }

  // Get engine evaluation after the move
  const afterResult = await engineBestMove(game.fen(), 15, 5000);
  if (!afterResult.success) {
    console.error('Engine failed after move:', afterResult.error);
    return false;
  }

  // Display in standard format
  const stdAfter = toStandard(afterResult.evaluation, !fenWhiteToMove);
  console.log(
    `STD  AFTER: ${fmt(stdAfter)}, mate=${
      afterResult.mate
    }, opponent should play=${afterResult.move}`
  );

  /* ----------  mate / winning-line logic  ---------- */
  const beforeMate = beforeResult.mate; // my turn
  const afterMateRaw = afterResult.mate; // opp. turn

  if (beforeMate !== undefined && beforeMate > 0) {
    // I was mating in |beforeMate| plies

    // 1) Did we finish it right now?
    if (game.isCheckmate()) {
      console.log(`✓ ACCEPTED: ${userMoveStr} – checkmate on the board`);
      return true;
    }

    // 2) Otherwise we must still be mating, and the distance should not increase
    if (
      afterMateRaw !== undefined &&
      afterMateRaw < 0 &&
      Math.abs(afterMateRaw) <= beforeMate
    ) {
      console.log(
        `✓ ACCEPTED: ${userMoveStr} – mate line continues ` +
          `${beforeMate}→${Math.abs(afterMateRaw)}`
      );
      return true;
    }

    console.log(
      `✗ REJECTED: ${userMoveStr} – engine had mate in ` +
        `${beforeMate}, now ${afterMateRaw ?? 'none'}`
    );
    return false;
  }

  // Normalize both evaluations to player's perspective
  if (beforeResult.evaluation == null || afterResult.evaluation == null) {
    console.log(`✗ REJECTED: ${userMoveStr} – missing evaluations`);
    return false;
  }

  // Convert both evaluations to player's perspective
  const beforeEval = scoreForPlayer(beforeResult.evaluation, true); // my turn
  const afterEval = scoreForPlayer(afterResult.evaluation, false); // opp. turn

  // For non-mate positions, check evaluation change
  const TOLERANCE_CP = 100;
  const evalChange = afterEval - beforeEval;
  // Accept if eval didn't drop by more than tolerance (same logic for both colors)
  const isAcceptable = evalChange >= -TOLERANCE_CP;

  if (isAcceptable) {
    console.log(
      `✓ ACCEPTED: ${userMoveStr} - eval changed by ${
        evalChange > 0 ? '+' : ''
      }${evalChange}cp (${beforeEval} → ${afterEval})`
    );
  } else {
    console.log(
      `✗ REJECTED: ${userMoveStr} - eval changed by ${
        evalChange > 0 ? '+' : ''
      }${evalChange}cp (${beforeEval} → ${afterEval}), threshold is ≥-100cp`
    );
  }

  return isAcceptable;
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
      return uci;
    }

    return move.san;
  } catch (error) {
    console.warn(`Error converting UCI to SAN: ${uci}`, error);
    return uci;
  }
}
