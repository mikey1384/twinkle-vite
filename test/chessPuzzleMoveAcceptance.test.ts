import test from 'node:test';
import assert from 'node:assert/strict';
import { validateMoveWithAnalysis } from '../src/containers/Home/ChessPuzzleModal/helpers';

// The client accepts exactly what the API's verifier accepts
// (twinkle-api controllers/content/model/chess-verify.ts): the solution's
// move, or any move that delivers checkmate. The engine never accepts.
const fen = 'r1bqkbnr/1ppp1ppp/p1n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 4';
const engineSaysMate = async () => ({ success: true, move: 'c4f7', mate: 3 });

test('the solution move and a mating move are accepted', async () => {
  const solution = await validateMoveWithAnalysis({
    userMove: { from: 'f3', to: 'f7' },
    expectedMove: 'f3f7',
    fen,
    engineBestMove: engineSaysMate
  });
  assert.equal(solution.isCorrect, true);
  assert.equal(solution.mate, 0);
  const otherMate = await validateMoveWithAnalysis({
    userMove: { from: 'f3', to: 'f7' },
    expectedMove: 'c4f7',
    fen,
    engineBestMove: engineSaysMate
  });
  assert.equal(otherMate.isCorrect, true);
});

test('an engine-approved non-mating alternative is rejected at once', async () => {
  let engineCalls = 0;
  const result = await validateMoveWithAnalysis({
    userMove: { from: 'c4', to: 'f7' },
    expectedMove: 'f3f7',
    fen,
    engineBestMove: async () => {
      engineCalls += 1;
      return { success: true, move: 'f3f7', mate: 1 };
    },
    withEngineSuggestion: false
  });
  assert.equal(result.isCorrect, false);
  assert.equal(engineCalls, 0, 'time attack never waits on the engine');
  const withSuggestion = await validateMoveWithAnalysis({
    userMove: { from: 'c4', to: 'f7' },
    expectedMove: 'f3f7',
    fen,
    engineBestMove: engineSaysMate
  });
  assert.equal(withSuggestion.isCorrect, false);
  assert.equal(withSuggestion.engineSuggestion, 'c4f7');
});
