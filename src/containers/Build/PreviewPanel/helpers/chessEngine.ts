interface BuildChessEngineOptions {
  fen: string;
  depth: number;
  skillLevel: number | null;
  moveTimeMs: number;
  timeoutMs: number;
}

interface BuildChessEngineWorkerResult {
  success: boolean;
  move?: string;
  evaluation?: number;
  depth?: number;
  mate?: number;
  error?: string;
}

export interface BuildChessEngineResult {
  success: boolean;
  move: string | null;
  bestMove: string | null;
  from: string | null;
  to: string | null;
  promotion: string | null;
  evaluation: number | null;
  depth: number | null;
  mate: number | null;
  error: string | null;
  fen: string;
  requestedDepth: number;
  skillLevel: number | null;
  timeoutMs: number;
  engine: 'stockfish';
}

const DEFAULT_CHESS_ENGINE_DEPTH = 10;
const MIN_CHESS_ENGINE_DEPTH = 1;
const MAX_CHESS_ENGINE_DEPTH = 24;
const DEFAULT_CHESS_ENGINE_TIMEOUT_MS = 5000;
const MIN_CHESS_ENGINE_TIMEOUT_MS = 500;
const MAX_CHESS_ENGINE_TIMEOUT_MS = 60000;
const CHESS_ENGINE_TIMEOUT_GRACE_MS = 1500;
const CHESS_ENGINE_CANCELED_ERROR = 'Chess engine request was canceled';

let chessEngineWorker: Worker | null = null;
let chessEngineReady = false;
let chessEngineReadyPromise: Promise<void> | null = null;
let resolveChessEngineReady: (() => void) | null = null;
let rejectChessEngineReady: ((error: Error) => void) | null = null;
let chessEngineReadyTimeout: number | null = null;
let chessEngineRequestId = 0;
let chessEngineLifecycleId = 0;
let chessEngineQueue: Promise<void> = Promise.resolve();
let activeChessEngineRequest: {
  requestId: number;
  timeout: number;
  options: BuildChessEngineOptions;
  resolve: (result: BuildChessEngineResult) => void;
} | null = null;

export function evaluateBuildChessPosition(
  rawOptions: Record<string, unknown> | null | undefined
) {
  const options = normalizeBuildChessEngineOptions(rawOptions);
  const lifecycleId = chessEngineLifecycleId;
  const task = chessEngineQueue.then(() => {
    if (lifecycleId !== chessEngineLifecycleId) {
      return buildCanceledChessEngineResult(options);
    }
    return runBuildChessEvaluation(options, lifecycleId);
  });
  chessEngineQueue = task.catch(() => undefined).then(() => undefined);
  return task;
}

export function disposeBuildChessEngine(
  reason = CHESS_ENGINE_CANCELED_ERROR
) {
  chessEngineLifecycleId += 1;
  chessEngineQueue = Promise.resolve();
  clearChessEngineReadyTimeout();
  rejectChessEngineReady?.(new Error(reason));
  resolveChessEngineReady = null;
  rejectChessEngineReady = null;
  chessEngineReadyPromise = null;
  resolveActiveChessEngineRequest({
    success: false,
    error: reason
  });
  resetBuildChessEngine();
}

function runBuildChessEvaluation(
  options: BuildChessEngineOptions,
  lifecycleId: number
) {
  return new Promise<BuildChessEngineResult>((resolve) => {
    void ensureBuildChessEngineReady()
      .then(() => {
        if (lifecycleId !== chessEngineLifecycleId) {
          resolve(buildCanceledChessEngineResult(options));
          return;
        }

        if (!chessEngineWorker) {
          resolve(
            buildChessEngineResult({
              options,
              workerResult: {
                success: false,
                error: 'Chess engine is not available'
              }
            })
          );
          return;
        }

        const requestId = ++chessEngineRequestId;
        const timeout = window.setTimeout(() => {
          if (lifecycleId !== chessEngineLifecycleId) {
            return;
          }
          if (
            !activeChessEngineRequest ||
            activeChessEngineRequest.requestId !== requestId
          ) {
            return;
          }
          activeChessEngineRequest = null;
          resetBuildChessEngine();
          resolve(
            buildChessEngineResult({
              options,
              workerResult: {
                success: false,
                error: 'Chess engine evaluation timed out'
              }
            })
          );
        }, options.timeoutMs);

        activeChessEngineRequest = {
          requestId,
          timeout,
          options,
          resolve
        };
        chessEngineWorker.postMessage({
          type: 'evaluate',
          requestId,
          data: {
            fen: options.fen,
            depth: options.depth,
            moveTimeMs: options.moveTimeMs
          }
        });
      })
      .catch((error: Error) => {
        if (lifecycleId !== chessEngineLifecycleId) {
          resolve(buildCanceledChessEngineResult(options));
          return;
        }

        resolve(
          buildChessEngineResult({
            options,
            workerResult: {
              success: false,
              error: error.message || 'Chess engine failed to initialize'
            }
          })
        );
      });
  });
}

function ensureBuildChessEngineReady() {
  if (chessEngineWorker && chessEngineReady) {
    return Promise.resolve();
  }
  if (chessEngineReadyPromise) {
    return chessEngineReadyPromise;
  }

  const readyPromise = new Promise<void>((resolve, reject) => {
    resolveChessEngineReady = resolve;
    rejectChessEngineReady = reject;
  });
  chessEngineReadyPromise = readyPromise;
  chessEngineReadyTimeout = window.setTimeout(() => {
    failChessEngineReady(new Error('Chess engine initialization timed out'));
  }, DEFAULT_CHESS_ENGINE_TIMEOUT_MS);

  try {
    chessEngineWorker = new Worker('/stockfish-worker.js');
    chessEngineWorker.addEventListener('message', handleChessEngineMessage);
    chessEngineWorker.addEventListener('error', handleChessEngineError);
    chessEngineWorker.postMessage({ type: 'init' });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to start chess engine';
    failChessEngineReady(
      new Error(message || 'Failed to start chess engine')
    );
  }

  return readyPromise;
}

function handleChessEngineMessage(event: MessageEvent) {
  const data = event.data || {};
  const { type, requestId, result, error } = data;

  if (type === 'ready' || type === 'initialized') {
    chessEngineReady = true;
    clearChessEngineReadyTimeout();
    resolveChessEngineReady?.();
    resolveChessEngineReady = null;
    rejectChessEngineReady = null;
    chessEngineReadyPromise = null;
    return;
  }

  if (type === 'error') {
    const engineError = new Error(error || 'Chess engine error');
    if (!chessEngineReady) {
      failChessEngineReady(engineError);
      return;
    }
    resolveActiveChessEngineRequest({
      success: false,
      error: engineError.message
    });
    return;
  }

  if (
    type !== 'result' ||
    !activeChessEngineRequest ||
    requestId !== activeChessEngineRequest.requestId
  ) {
    return;
  }

  resolveActiveChessEngineRequest(result || {
    success: false,
    error: 'Chess engine returned no result'
  });
}

function handleChessEngineError() {
  const error = new Error('Chess engine worker failed');
  if (!chessEngineReady) {
    failChessEngineReady(error);
    return;
  }
  resolveActiveChessEngineRequest({
    success: false,
    error: error.message
  });
  resetBuildChessEngine();
}

function resolveActiveChessEngineRequest(
  workerResult: BuildChessEngineWorkerResult
) {
  const activeRequest = activeChessEngineRequest;
  if (!activeRequest) return;
  window.clearTimeout(activeRequest.timeout);
  activeChessEngineRequest = null;
  activeRequest.resolve(
    buildChessEngineResult({
      options: activeRequest.options,
      workerResult
    })
  );
}

function failChessEngineReady(error: Error) {
  clearChessEngineReadyTimeout();
  rejectChessEngineReady?.(error);
  resolveChessEngineReady = null;
  rejectChessEngineReady = null;
  chessEngineReadyPromise = null;
  resetBuildChessEngine();
}

function clearChessEngineReadyTimeout() {
  if (chessEngineReadyTimeout == null) return;
  window.clearTimeout(chessEngineReadyTimeout);
  chessEngineReadyTimeout = null;
}

function resetBuildChessEngine() {
  if (chessEngineWorker) {
    try {
      chessEngineWorker.removeEventListener('message', handleChessEngineMessage);
      chessEngineWorker.removeEventListener('error', handleChessEngineError);
      chessEngineWorker.terminate();
    } catch {}
  }
  chessEngineWorker = null;
  chessEngineReady = false;
}

function normalizeBuildChessEngineOptions(
  rawOptions: Record<string, unknown> | null | undefined
): BuildChessEngineOptions {
  const options = rawOptions && typeof rawOptions === 'object' ? rawOptions : {};
  const fen = String(options.fen || '').trim();
  if (!fen) {
    throw new Error('fen is required');
  }

  const skillLevel = normalizeNullableNumber(options.skillLevel);
  const depth =
    options.depth == null
      ? resolveDepthFromSkillLevel(skillLevel)
      : clampInteger(
          options.depth,
          MIN_CHESS_ENGINE_DEPTH,
          MAX_CHESS_ENGINE_DEPTH,
          DEFAULT_CHESS_ENGINE_DEPTH
        );
  const timeoutSource =
    options.maxTimeMs == null ? options.timeoutMs : options.maxTimeMs;
  const moveTimeMs = clampInteger(
    timeoutSource,
    MIN_CHESS_ENGINE_TIMEOUT_MS,
    MAX_CHESS_ENGINE_TIMEOUT_MS,
    resolveMoveTimeFromSkillLevel(skillLevel)
  );

  return {
    fen,
    depth,
    skillLevel,
    moveTimeMs,
    timeoutMs: moveTimeMs + CHESS_ENGINE_TIMEOUT_GRACE_MS
  };
}

function resolveDepthFromSkillLevel(skillLevel: number | null) {
  if (skillLevel == null) return DEFAULT_CHESS_ENGINE_DEPTH;
  const normalizedSkill = Math.max(0, Math.min(20, skillLevel));
  return clampInteger(
    Math.round(2 + normalizedSkill * 1.1),
    MIN_CHESS_ENGINE_DEPTH,
    MAX_CHESS_ENGINE_DEPTH,
    DEFAULT_CHESS_ENGINE_DEPTH
  );
}

function resolveMoveTimeFromSkillLevel(skillLevel: number | null) {
  if (skillLevel == null) return DEFAULT_CHESS_ENGINE_TIMEOUT_MS;
  const normalizedSkill = Math.max(0, Math.min(20, skillLevel));
  if (normalizedSkill >= 20) return MAX_CHESS_ENGINE_TIMEOUT_MS;
  if (normalizedSkill >= 18) return 30000;
  if (normalizedSkill >= 15) return 15000;
  if (normalizedSkill >= 10) return 8000;
  if (normalizedSkill >= 5) return 3000;
  return 1000;
}

function normalizeNullableNumber(value: unknown) {
  if (value == null) return null;
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : null;
}

function clampInteger(
  value: unknown,
  min: number,
  max: number,
  fallback: number
) {
  const normalized = Number(value);
  if (!Number.isFinite(normalized)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(normalized)));
}

function buildChessEngineResult({
  options,
  workerResult
}: {
  options: BuildChessEngineOptions;
  workerResult: BuildChessEngineWorkerResult;
}): BuildChessEngineResult {
  const move =
    workerResult.success && workerResult.move
      ? String(workerResult.move).trim()
      : '';

  return {
    success: Boolean(workerResult.success && move),
    move: move || null,
    bestMove: move || null,
    from: move ? move.slice(0, 2) : null,
    to: move ? move.slice(2, 4) : null,
    promotion: move.length > 4 ? move.slice(4) : null,
    evaluation: normalizeResultNumber(workerResult.evaluation),
    depth: normalizeResultNumber(workerResult.depth),
    mate: normalizeResultNumber(workerResult.mate),
    error: workerResult.error || null,
    fen: options.fen,
    requestedDepth: options.depth,
    skillLevel: options.skillLevel,
    timeoutMs: options.moveTimeMs,
    engine: 'stockfish'
  };
}

function buildCanceledChessEngineResult(options: BuildChessEngineOptions) {
  return buildChessEngineResult({
    options,
    workerResult: {
      success: false,
      error: CHESS_ENGINE_CANCELED_ERROR
    }
  });
}

function normalizeResultNumber(value: unknown) {
  if (value == null || value === '') return null;
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : null;
}
