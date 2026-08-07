let engine = null;
let currentRequestId = 0;
let isInitialized = false;
let sentUci = false;
let sentIsReady = false;
let currentEvaluation = null;
let currentDepth = null;
let currentMate = null;
// UCI runs one search at a time. Track the in-flight search so an abandoned
// one is stopped and its bestmove discarded instead of being attributed to
// the next request's position.
let activeSearch = false;
let staleBestMoves = 0;
let queuedSearch = null;
const NL = '\n';

const wasmSupported = typeof WebAssembly === 'object';
const stockfishFile = wasmSupported ? 'stockfish.wasm.js' : 'stockfish.js';

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
    if (message.startsWith('Stockfish')) {
      maybeSendIsReady();
      return;
    }

    if (message === 'uciok' || message.includes('uciok')) {
      maybeSendIsReady();
      return;
    }

    if (message === 'readyok' || message.includes('readyok')) {
      isInitialized = true;
      // Configure strong defaults once the engine is ready
      try {
        const threads =
          self.navigator && self.navigator.hardwareConcurrency
            ? Math.max(1, Math.min(8, self.navigator.hardwareConcurrency))
            : 2;
        engine &&
          engine.postMessage(`setoption name Threads value ${threads}` + NL);
        engine && engine.postMessage('setoption name Hash value 256' + NL);
        engine &&
          engine.postMessage('setoption name UCI_AnalyseMode value true' + NL);
        engine &&
          engine.postMessage(
            'setoption name UCI_LimitStrength value false' + NL
          );
        engine && engine.postMessage('setoption name MultiPV value 1' + NL);
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
        normalizeMoveTimeMs(evalData.moveTimeMs)
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

function evaluatePosition(fen, depth, requestId, moveTimeMs) {
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
    queuedSearch = { fen, depth, requestId, moveTimeMs };
    stopActiveSearch();
    return;
  }

  startSearch({ fen, depth, requestId, moveTimeMs });
}

function startSearch({ fen, depth, requestId, moveTimeMs }) {
  activeSearch = true;
  currentRequestId = requestId;
  currentEvaluation = null;
  currentDepth = null;
  currentMate = null;

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
      error: move === '(none)' ? 'No legal moves' : undefined
    }
  });

  currentRequestId = null;
  currentEvaluation = null;
  currentDepth = null;
  currentMate = null;
  activeSearch = false;
}

function handleInfo(message) {
  if (!currentRequestId) return;

  const evaluation = parseEvaluation(message);
  const depth = parseDepth(message);
  const mate = parseMate(message);

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
  const depthMatch = infoLine.match(/depth (\d+)/);
  return depthMatch ? parseInt(depthMatch[1], 10) : undefined;
}

function parseMate(infoLine) {
  const mateMatch = infoLine.match(/score mate (-?\d+)/);
  return mateMatch ? parseInt(mateMatch[1], 10) : undefined;
}
