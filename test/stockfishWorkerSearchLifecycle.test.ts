import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

// Drives public/stockfish-worker.js with a fake engine to verify the search
// lifecycle: an abandoned search is stopped and its bestmove discarded, a
// superseding request queues until the engine is free, and results are never
// attributed to a different request's position.
function bootWorker() {
  const src = readFileSync(
    fileURLToPath(new URL('../public/stockfish-worker.js', import.meta.url)),
    'utf8'
  );

  const posted: any[] = [];
  const engineCmds: string[] = [];
  let engineListener: ((e: { data: string }) => void) | null = null;

  class FakeEngine {
    addEventListener(type: string, fn: (e: { data: string }) => void) {
      if (type === 'message') engineListener = fn;
    }
    postMessage(cmd: string) {
      engineCmds.push(cmd.trim());
    }
    terminate() {}
  }

  const workerSelf: any = {
    postMessage: (m: any) => posted.push(m),
    navigator: { hardwareConcurrency: 4 },
    onmessage: null
  };

  new Function('self', 'Worker', 'navigator', src)(
    workerSelf,
    FakeEngine,
    workerSelf.navigator
  );

  const engineSays = (msg: string) => engineListener!({ data: msg });
  engineSays('Stockfish 16 by the Stockfish developers');
  engineSays('uciok');
  engineSays('readyok');

  return {
    engineSays,
    mainSends: (data: any) => workerSelf.onmessage({ data }),
    engineCmds,
    results: () => posted.filter((m) => m.type === 'result'),
    stops: () => engineCmds.filter((c) => c === 'stop').length
  };
}

test('completed search resolves to its own requestId with parsed score', () => {
  const w = bootWorker();
  w.mainSends({ type: 'evaluate', requestId: 1, data: { fen: 'FEN1', depth: 15 } });
  assert(w.engineCmds.includes('position fen FEN1'));
  w.engineSays('info depth 15 score cp 42 pv e2e4');
  w.engineSays('bestmove e2e4');
  const r = w.results();
  assert.equal(r.length, 1);
  assert.equal(r[0].requestId, 1);
  assert.equal(r[0].result.move, 'e2e4');
  assert.equal(r[0].result.evaluation, 42);
});

test('stop fails the in-flight request, discards its bestmove, and frees the engine', () => {
  const w = bootWorker();
  w.mainSends({ type: 'evaluate', requestId: 1, data: { fen: 'FEN1', depth: 15 } });
  w.mainSends({ type: 'stop', requestId: 1 });
  assert.equal(w.stops(), 1);
  let r = w.results();
  assert.equal(r.length, 1);
  assert.equal(r[0].result.success, false);

  // The stopped search's bestmove must not resolve anything.
  w.engineSays('bestmove d2d4');
  assert.equal(w.results().length, 1);

  // Engine is usable again afterwards.
  w.mainSends({ type: 'evaluate', requestId: 2, data: { fen: 'FEN2', depth: 15 } });
  w.engineSays('info depth 15 score mate 2 pv g1f3');
  w.engineSays('bestmove g1f3');
  r = w.results();
  assert.equal(r[1].requestId, 2);
  assert.equal(r[1].result.move, 'g1f3');
  assert.equal(r[1].result.mate, 2);
});

test('superseding request queues until the stopped search completes, then runs', () => {
  const w = bootWorker();
  w.mainSends({ type: 'evaluate', requestId: 1, data: { fen: 'FEN1', depth: 20 } });
  w.mainSends({ type: 'evaluate', requestId: 2, data: { fen: 'FEN2', depth: 15 } });

  let r = w.results();
  assert.equal(r.length, 1);
  assert.equal(r[0].requestId, 1);
  assert.equal(r[0].result.success, false);
  assert(!w.engineCmds.includes('position fen FEN2'));

  w.engineSays('bestmove a2a3'); // stale bestmove of the stopped search
  assert(w.engineCmds.includes('position fen FEN2'));
  w.engineSays('bestmove b2b3');
  r = w.results();
  assert.equal(r[1].requestId, 2);
  assert.equal(r[1].result.move, 'b2b3');
  assert.equal(r[1].result.success, true);
});

test('double supersede sends exactly one stop and runs only the last request', () => {
  const w = bootWorker();
  w.mainSends({ type: 'evaluate', requestId: 1, data: { fen: 'FEN1', depth: 20 } });
  w.mainSends({ type: 'evaluate', requestId: 2, data: { fen: 'FEN2', depth: 15 } });
  w.mainSends({ type: 'evaluate', requestId: 3, data: { fen: 'FEN3', depth: 15 } });
  assert.equal(w.stops(), 1);

  const failedIds = w.results().map((m) => m.requestId);
  assert.deepEqual(failedIds, [1, 2]);

  w.engineSays('bestmove c2c3'); // stale bestmove -> starts the last request
  assert(w.engineCmds.includes('position fen FEN3'));
  assert(!w.engineCmds.includes('position fen FEN2'));
  w.engineSays('bestmove d7d5');
  const r = w.results();
  assert.equal(r[r.length - 1].requestId, 3);
  assert.equal(r[r.length - 1].result.move, 'd7d5');
});

test('moveTimeMs is forwarded as a movetime bound on the search', () => {
  const w = bootWorker();
  w.mainSends({
    type: 'evaluate',
    requestId: 1,
    data: { fen: 'FEN1', depth: 15, moveTimeMs: 4500 }
  });
  assert(w.engineCmds.includes('go depth 15 movetime 4500'));
});
