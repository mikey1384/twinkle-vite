let engine = null;
let currentRequestId = 0;
let isInitialized = false;
let sentUci = false;
let sentIsReady = false;
let currentEvaluation = null;
let currentDepth = null;
let currentMate = null;
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
      evaluatePosition(evalData.fen, evalData.depth || 15, requestId);
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
      self.postMessage({ type: 'terminated' });
      return;
    }
  } catch (error) {
    self.postMessage({ type: 'error', error: error.message });
  }
};

function evaluatePosition(fen, depth, requestId) {
  if (!engine) {
    self.postMessage({
      type: 'result',
      requestId,
      result: { success: false, error: 'Engine not initialized' }
    });
    return;
  }

  currentRequestId = requestId;
  currentEvaluation = null;
  currentDepth = null;
  currentMate = null;

  // Keep transposition table between calls for stronger play
  engine.postMessage(`position fen ${fen}` + NL);
  // Prefer fixed depth; caller can pass a higher number for stronger search
  engine.postMessage(`go depth ${depth}` + NL);
}

function handleBestMove(message) {
  const move = message.split(' ')[1];

  if (!currentRequestId) return;

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
