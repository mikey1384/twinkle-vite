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

export async function validateMoveWithAnalysis({
  userMove,
  expectedMove,
  fen,
  engineBestMove
}: {
  userMove: { from: string; to: string; promotion?: string };
  expectedMove: string;
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
}): Promise<{
  isCorrect: boolean;
  userMove: string;
  expectedMove: string;
  engineSuggestion?: string;
  evaluation?: number;
  mate?: number;
  analysisLog: string[];
}>;

export async function validateMoveWithAnalysis({
  userMove,
  expectedMove,
  fen,
  engineBestMove
}: {
  userMove: { from: string; to: string; promotion?: string };
  expectedMove: string;
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
}): Promise<{
  isCorrect: boolean;
  userMove: string;
  expectedMove: string;
  engineSuggestion?: string;
  evaluation?: number;
  mate?: number;
  analysisLog: string[];
}> {
  const analysisLog: string[] = [];
  const game = new Chess(fen);

  const beforeResult = await engineBestMove(fen, 15, 5000);
  if (!beforeResult.success) {
    analysisLog.push(`Engine failed before move: ${beforeResult.error}`);
    return {
      isCorrect: false,
      userMove: `${userMove.from}${userMove.to}${userMove.promotion || ''}`,
      expectedMove,
      mate: undefined,
      analysisLog
    };
  }

  // Display in standard format
  const fenWhiteToMove = / w /.test(fen);
  const stdBefore = toStandard(beforeResult.evaluation, fenWhiteToMove);
  analysisLog.push(
    `Position evaluation: ${fmt(stdBefore)}${
      beforeResult.mate ? `, mate in ${beforeResult.mate}` : ''
    }`
  );
  analysisLog.push(`Engine suggests: ${beforeResult.move}`);

  // Make user's move
  const move = game.move(userMove);
  if (!move) {
    analysisLog.push('Invalid move');
    return {
      isCorrect: false,
      userMove: `${userMove.from}${userMove.to}${userMove.promotion || ''}`,
      expectedMove,
      engineSuggestion: beforeResult.move,
      evaluation: stdBefore,
      mate: undefined,
      analysisLog
    };
  }

  const userMoveStr = `${userMove.from}${userMove.to}${
    userMove.promotion || ''
  }`;
  analysisLog.push(`Your move: ${userMoveStr} (${move.san})`);

  // Check if the position is checkmate/stalemate before engine evaluation
  if (game.isCheckmate()) {
    analysisLog.push('✓ Checkmate! Move accepted.');
    return {
      isCorrect: true,
      userMove: userMoveStr,
      expectedMove,
      engineSuggestion: beforeResult.move,
      evaluation: stdBefore,
      mate: 0, // Checkmate delivered
      analysisLog
    };
  }

  if (game.isStalemate()) {
    analysisLog.push('✓ Stalemate achieved. Move accepted.');
    return {
      isCorrect: true,
      userMove: userMoveStr,
      expectedMove,
      engineSuggestion: beforeResult.move,
      evaluation: stdBefore,
      mate: undefined,
      analysisLog
    };
  }

  // Get engine evaluation after the move
  const afterResult = await engineBestMove(game.fen(), 15, 5000);
  if (!afterResult.success) {
    analysisLog.push(`Engine failed after move: ${afterResult.error}`);
    return {
      isCorrect: false,
      userMove: userMoveStr,
      expectedMove,
      engineSuggestion: beforeResult.move,
      evaluation: stdBefore,
      mate: undefined,
      analysisLog
    };
  }

  // Display in standard format
  const stdAfter = toStandard(afterResult.evaluation, !fenWhiteToMove);
  analysisLog.push(
    `Position after move: ${fmt(stdAfter)}${
      afterResult.mate ? `, mate in ${Math.abs(afterResult.mate)}` : ''
    }`
  );

  /* ----------  mate / winning-line logic  ---------- */
  const beforeMate = beforeResult.mate; // my turn
  const afterMateRaw = afterResult.mate; // opp. turn

  if (beforeMate !== undefined && beforeMate > 0) {
    // I was mating in |beforeMate| plies

    // 1) Did we finish it right now?
    if (game.isCheckmate()) {
      analysisLog.push(`✓ Checkmate delivered! Move accepted.`);
      return {
        isCorrect: true,
        userMove: userMoveStr,
        expectedMove,
        engineSuggestion: beforeResult.move,
        evaluation: stdBefore,
        mate: 0, // Checkmate delivered
        analysisLog
      };
    }

    // 2) Otherwise we must still be mating, and the distance should not increase
    if (
      afterMateRaw !== undefined &&
      afterMateRaw < 0 &&
      Math.abs(afterMateRaw) <= beforeMate
    ) {
      analysisLog.push(
        `✓ Mate line continues: ${beforeMate} → ${Math.abs(afterMateRaw)} moves`
      );
      return {
        isCorrect: true,
        userMove: userMoveStr,
        expectedMove,
        engineSuggestion: beforeResult.move,
        evaluation: stdBefore,
        mate: Math.abs(afterMateRaw), // Use the remaining mate distance
        analysisLog
      };
    }

    analysisLog.push(
      `✗ Lost the mate line. Had mate in ${beforeMate}, now ${
        afterMateRaw ?? 'none'
      }`
    );
    return {
      isCorrect: false,
      userMove: userMoveStr,
      expectedMove,
      engineSuggestion: beforeResult.move,
      evaluation: stdBefore,
      mate: undefined,
      analysisLog
    };
  }

  // Normalize both evaluations to player's perspective
  if (beforeResult.evaluation == null || afterResult.evaluation == null) {
    analysisLog.push(`✗ Missing evaluations for analysis`);
    return {
      isCorrect: false,
      userMove: userMoveStr,
      expectedMove,
      engineSuggestion: beforeResult.move,
      evaluation: stdBefore,
      mate: undefined,
      analysisLog
    };
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
    analysisLog.push(
      `✓ Move accepted: evaluation changed by ${
        evalChange > 0 ? '+' : ''
      }${evalChange}cp`
    );
    return {
      isCorrect: true,
      userMove: userMoveStr,
      expectedMove,
      engineSuggestion: beforeResult.move,
      evaluation: afterEval,
      mate: afterResult.mate ? Math.abs(afterResult.mate) : undefined,
      analysisLog
    };
  } else {
    analysisLog.push(
      `✗ Move rejected: evaluation dropped by ${Math.abs(
        evalChange
      )}cp (threshold: 100cp)`
    );
  }

  // Fallback: check against official answer if engine validation failed
  if (userMoveStr === expectedMove) {
    analysisLog.push(
      `✓ Matches expected move - accepted despite engine concerns`
    );
    return {
      isCorrect: true,
      userMove: userMoveStr,
      expectedMove,
      engineSuggestion: beforeResult.move,
      evaluation: afterEval,
      mate: afterResult.mate ? Math.abs(afterResult.mate) : undefined,
      analysisLog
    };
  }

  analysisLog.push(
    `✗ Move rejected: failed both engine and expected move validation`
  );
  return {
    isCorrect: false,
    userMove: userMoveStr,
    expectedMove,
    engineSuggestion: beforeResult.move,
    evaluation: beforeEval,
    analysisLog
  };
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
      return uci;
    }

    return move.san;
  } catch {
    return uci;
  }
}
