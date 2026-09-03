let engine = null;
let currentRequestId = 0;
let isInitialized = false;
let sentUci = false;
let sentIsReady = false;
let currentEvaluation = null;
let currentDepth = null;
let currentMate = null;
// Per-line results of the in-flight search, keyed by MultiPV index. Line 1
// is the principal variation; the rest exist only when the request asked for
// multiPv > 1. Each entry is the latest complete (non-bound) score seen.
let currentLines = {};
let currentMultiPv = 1;
let engineMultiPv = 1;
// UCI runs one search at a time. Track the in-flight search so an abandoned
// one is stopped and its bestmove discarded instead of being attributed to
// the next request's position.
let activeSearch = false;
let staleBestMoves = 0;
let queuedSearch = null;
const NL = '\n';
const MAX_MULTI_PV = 10;

// Stockfish 17.1 "lite" single-threaded NNUE build (stockfish npm package,
// copied into the site root by vite.config.ts). Single-threaded means no
// SharedArrayBuffer / cross-origin-isolation requirement, but the build uses
// wasm SIMD (iOS 16+, Chrome 91+, Firefox 89+). Browsers without SIMD fall
// back to the previous Stockfish 10 wasm build, and browsers without wasm at
// all to its asm.js build, so no engine consumer loses coverage.
const MODERN_ENGINE_FILE = 'stockfish-17.1-lite-single-03e3232.js';
const LEGACY_WASM_ENGINE_FILE = 'stockfish.wasm.js';
const LEGACY_ASM_ENGINE_FILE = 'stockfish.js';
const wasmSupported = typeof WebAssembly === 'object';
const simdSupported = wasmSupported && detectWasmSimd();
const stockfishFile = simdSupported
  ? MODERN_ENGINE_FILE
  : wasmSupported
    ? LEGACY_WASM_ENGINE_FILE
    : LEGACY_ASM_ENGINE_FILE;
const modernEngine = stockfishFile === MODERN_ENGINE_FILE;

// Smallest valid module using a v128 op (i32x4.splat): validates only where
// the SIMD proposal is implemented.
function detectWasmSimd() {
  try {
    return WebAssembly.validate(
      new Uint8Array([
        0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10,
        10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11
      ])
    );
  } catch (error) {
    return false;
  }
}

try {
  engine = new Worker(stockfishFile);
  setupEngineListeners();
} catch (error) {
  self.postMessage({
    type: 'error',
    error: 'Failed to create Stockfish worker: ' + error.message
  });
}

function setupEngineListeners() {
  if (!engine) {
    self.postMessage({ type: 'error', error: 'No engine' });
    return;
  }

  engine.addEventListener('message', (e) => handleEngineMessage(e.data));
  // A failed engine load (bad download, unsupported wasm) must surface as a
  // clear error instead of an init timeout.
  engine.addEventListener('error', (e) => {
    self.postMessage({
      type: 'error',
      error: 'Stockfish engine failed to load (' + stockfishFile + '): ' + ((e && e.message) || 'unknown error')
    });
  });
  maybeSendUci();
}

function maybeSendUci() {
  if (!sentUci && engine) {
    engine.postMessage('uci' + NL);
    sentUci = true;
  }
}

function maybeSendIsReady() {
  if (!sentIsReady && engine) {
    engine.postMessage('isready' + NL);
    sentIsReady = true;
  }
}

function handleEngineMessage(message) {
  try {
    if (typeof message !== 'string') return;
    if (message.startsWith('Stockfish')) {
      maybeSendIsReady();
      return;
    }

    if (message === 'uciok' || message.includes('uciok')) {
      maybeSendIsReady();
      return;
    }

    if (message === 'readyok' || message.includes('readyok')) {
      if (isInitialized) return;
      isInitialized = true;
      // Configure defaults once the engine is ready. The modern build is
      // single-threaded (no Threads option); keep the hash modest so the
      // 32-bit wasm heap stays comfortable on phones.
      try {
        if (!modernEngine) {
          const threads =
            self.navigator && self.navigator.hardwareConcurrency
              ? Math.max(1, Math.min(8, self.navigator.hardwareConcurrency))
              : 2;
          engine && engine.postMessage(`setoption name Threads value ${threads}` + NL);
        }
        engine && engine.postMessage('setoption name Hash value 64' + NL);
        engine && engine.postMessage('setoption name MultiPV value 1' + NL);
        engineMultiPv = 1;
      } catch (err) {}
      self.postMessage({ type: 'ready' });
      self.postMessage({ type: 'initialized', success: true });
      return;
    }

    if (
      message.startsWith('bestmove') ||
      (message.startsWith('info') && message.includes('score'))
    ) {
      self.postMessage({
        type: 'output',
        data: message,
        timestamp: Date.now()
      });
      self.postMessage({ type: 'engine-message', message });
    }

    if (message.startsWith('bestmove')) {
      handleBestMove(message);
    } else if (message.startsWith('info') && message.includes('score')) {
      handleInfo(message);
    }
  } catch (error) {
    self.postMessage({ type: 'error', error: error.message });
  }
}

self.onmessage = function (e) {
  const { type, command, data, payload, requestId } = e.data;

  try {
    if (type === 'init' || command === 'init') {
      return;
    }

    if (type === 'evaluate' || command === 'evaluate') {
      const evalData = data || payload;
      evaluatePosition(
        evalData.fen,
        evalData.depth || 15,
        requestId,
        normalizeMoveTimeMs(evalData.moveTimeMs),
        normalizeMultiPv(evalData.multiPv)
      );
      return;
    }

    if (type === 'stop' || command === 'stop') {
      if (engine && (!requestId || requestId === currentRequestId)) {
        stopActiveSearch();
      }
      return;
    }

    if (type === 'uci' || command === 'send') {
      if (engine && isInitialized) {
        engine.postMessage((data || payload) + NL);
      } else {
        self.postMessage({ type: 'error', error: 'Engine not initialized' });
      }
      return;
    }

    if (command === 'terminate') {
      if (engine) {
        engine.terminate();
        engine = null;
        isInitialized = false;
      }
      activeSearch = false;
      staleBestMoves = 0;
      queuedSearch = null;
      currentRequestId = null;
      self.postMessage({ type: 'terminated' });
      return;
    }
  } catch (error) {
    self.postMessage({ type: 'error', error: error.message });
  }
};

function evaluatePosition(fen, depth, requestId, moveTimeMs, multiPv) {
  if (!engine) {
    self.postMessage({
      type: 'result',
      requestId,
      result: { success: false, error: 'Engine not initialized' }
    });
    return;
  }

  if (activeSearch) {
    // A previous search is still running (typically one the client already
    // timed out). Stop it, discard its bestmove, and start this search once
    // the engine acknowledges.
    if (queuedSearch) {
      self.postMessage({
        type: 'result',
        requestId: queuedSearch.requestId,
        result: { success: false, error: 'Superseded' }
      });
    }
    queuedSearch = { fen, depth, requestId, moveTimeMs, multiPv };
    stopActiveSearch();
    return;
  }

  startSearch({ fen, depth, requestId, moveTimeMs, multiPv });
}

function startSearch({ fen, depth, requestId, moveTimeMs, multiPv }) {
  activeSearch = true;
  currentRequestId = requestId;
  currentEvaluation = null;
  currentDepth = null;
  currentMate = null;
  currentLines = {};
  currentMultiPv = multiPv || 1;
  if (currentMultiPv !== engineMultiPv) {
    engine.postMessage(`setoption name MultiPV value ${currentMultiPv}` + NL);
    engineMultiPv = currentMultiPv;
  }
  // Keep transposition table between calls for stronger play
  engine.postMessage(`position fen ${fen}` + NL);
  if (moveTimeMs) {
    engine.postMessage(`go depth ${depth} movetime ${moveTimeMs}` + NL);
    return;
  }
  engine.postMessage(`go depth ${depth}` + NL);
}

function stopActiveSearch() {
  if (!activeSearch || !currentRequestId) return;
  self.postMessage({
    type: 'result',
    requestId: currentRequestId,
    result: { success: false, error: 'Stopped' }
  });
  currentRequestId = null;
  staleBestMoves += 1;
  engine.postMessage('stop' + NL);
}

function normalizeMoveTimeMs(value) {
  const normalized = Number(value);
  if (!Number.isFinite(normalized) || normalized <= 0) return null;
  return Math.max(1, Math.floor(normalized));
}

function normalizeMultiPv(value) {
  const normalized = Number(value);
  if (!Number.isFinite(normalized)) return 1;
  return Math.max(1, Math.min(MAX_MULTI_PV, Math.floor(normalized)));
}

function handleBestMove(message) {
  if (staleBestMoves > 0) {
    // Completion of a stopped/superseded search: discard it, then run any
    // queued search now that the engine is free.
    staleBestMoves -= 1;
    if (staleBestMoves === 0) {
      activeSearch = false;
      if (queuedSearch) {
        const next = queuedSearch;
        queuedSearch = null;
        startSearch(next);
      }
    }
    return;
  }

  const move = message.split(' ')[1];
  if (!currentRequestId) {
    activeSearch = false;
    return;
  }

  self.postMessage({
    type: 'result',
    requestId: currentRequestId,
    result: {
      success: move && move !== '(none)',
      move: move !== '(none)' ? move : undefined,
      evaluation: currentEvaluation,
      depth: currentDepth,
      mate: currentMate,
      lines: collectLines(),
      error: move === '(none)' ? 'No legal moves' : undefined
    }
  });
  currentRequestId = null;
  currentEvaluation = null;
  currentDepth = null;
  currentMate = null;
  currentLines = {};
  activeSearch = false;
}

function collectLines() {
  return Object.keys(currentLines)
    .map((key) => Number(key))
    .sort((a, b) => a - b)
    .map((index) => currentLines[index]);
}

function handleInfo(message) {
  if (!currentRequestId) return;
  // "lowerbound" / "upperbound" lines are aspiration-window fail-highs and
  // fail-lows, not evaluations. Treating them as scores made a search's
  // reported eval depend on which line happened to arrive last.
  if (/\b(lowerbound|upperbound)\b/.test(message)) return;
  const evaluation = parseEvaluation(message);
  const depth = parseDepth(message);
  const mate = parseMate(message);
  const lineIndex = parseMultiPv(message);
  const pv = parsePv(message);
  if (pv.length) {
    currentLines[lineIndex] = {
      multipv: lineIndex,
      move: pv[0],
      evaluation: evaluation === undefined ? null : evaluation,
      mate: mate === undefined ? null : mate,
      depth: depth === undefined ? null : depth,
      pv
    };
  }
  if (lineIndex !== 1) return;
  if (evaluation !== undefined) currentEvaluation = evaluation;
  if (depth !== undefined) currentDepth = depth;
  if (mate !== undefined) currentMate = mate;
  if (evaluation !== undefined || mate !== undefined) {
    self.postMessage({
      type: 'info',
      requestId: currentRequestId,
      evaluation,
      depth,
      mate
    });
  }
}

function parseEvaluation(infoLine) {
  const cpMatch = infoLine.match(/score cp (-?\d+)/);
  return cpMatch ? parseInt(cpMatch[1], 10) : undefined;
}

function parseDepth(infoLine) {
  const depthMatch = infoLine.match(/\bdepth (\d+)/);
  return depthMatch ? parseInt(depthMatch[1], 10) : undefined;
}

function parseMate(infoLine) {
  const mateMatch = infoLine.match(/score mate (-?\d+)/);
  return mateMatch ? parseInt(mateMatch[1], 10) : undefined;
}

function parseMultiPv(infoLine) {
  const match = infoLine.match(/\bmultipv (\d+)/);
  return match ? parseInt(match[1], 10) : 1;
}

function parsePv(infoLine) {
  const match = infoLine.match(/\bpv (.+)$/);
  if (!match) return [];
  return match[1].trim().split(/\s+/).filter(Boolean);
}
