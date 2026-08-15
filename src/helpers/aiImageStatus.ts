import {
  browserReportsOffline,
  markBrowserNetworkReachable
} from './browserNetwork';

export interface AiImageRecoveryLocation {
  objectKey: string;
  format: string;
}

export interface AiImageRequestFingerprintInput {
  prompt: string;
  previousResponseId?: string;
  previousImageId?: string;
  referenceImageB64?: string;
  engine?: 'gemini' | 'openai';
  quality?: 'low' | 'medium' | 'high';
}

const AI_IMAGE_CANONICAL_STATUS_TIMEOUT_MS = 6 * 60 * 1000;
const AI_IMAGE_CANONICAL_STATUS_RETRY_MS = 2 * 1000;
const AI_IMAGE_TRANSPORT_RETRY_MAX_MS = 30 * 1000;
const AI_IMAGE_OFFLINE_RECHECK_MS = 30 * 1000;

export async function createAIImageRequestFingerprint({
  prompt,
  previousResponseId,
  previousImageId,
  referenceImageB64,
  engine = 'openai',
  quality = 'high'
}: AiImageRequestFingerprintInput): Promise<string | null> {
  try {
    if (!globalThis.crypto?.subtle || typeof TextEncoder === 'undefined') {
      return null;
    }
    const canonicalInput = [
      engine,
      engine === 'openai' ? quality : 'stable',
      prompt || '',
      previousResponseId || '',
      previousImageId || '',
      referenceImageB64 || ''
    ].join('\n');
    const digest = await globalThis.crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(canonicalInput)
    );
    return Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, '0')
    ).join('');
  } catch {
    // Older embedded browsers can fall back to the original request fields.
    return null;
  }
}

function waitForConnectivityOrDelay(delayMs: number) {
  return new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', finish);
      }
      resolve();
    };
    const timeoutId = setTimeout(finish, delayMs);
    if (typeof window !== 'undefined' && browserReportsOffline()) {
      window.addEventListener('online', finish, { once: true });
    }
  });
}

export async function pollCanonicalRequestStatus({
  loadStatus,
  isComplete,
  isActive = () => true,
  transientInitialStatuses = [],
  transientInitialStatusTimeoutMs = 0,
  timeoutMs = AI_IMAGE_CANONICAL_STATUS_TIMEOUT_MS,
  now = () => Date.now(),
  wait = waitForConnectivityOrDelay
}: {
  loadStatus: () => Promise<any>;
  isComplete: (result: any) => boolean;
  isActive?: () => boolean;
  transientInitialStatuses?: string[];
  transientInitialStatusTimeoutMs?: number;
  timeoutMs?: number;
  now?: () => number;
  wait?: (delayMs: number) => Promise<void>;
}) {
  const startedAt = now();
  let deadline = startedAt + Math.max(0, timeoutMs);
  let initialStatusGraceStartedAt: number | null = null;
  let consecutiveStatusReadFailures = 0;

  while (isActive() && now() <= deadline) {
    if (browserReportsOffline()) {
      const offlineStartedAt = now();
      await wait(AI_IMAGE_OFFLINE_RECHECK_MS);
      // Being explicitly offline is not processing time. Keep the full
      // recovery budget available for when the canonical service is reachable
      // again, even if the device was disconnected for hours.
      deadline += Math.max(0, now() - offlineStartedAt);
      continue;
    }

    let result: any;
    try {
      result = await loadStatus();
    } catch (error: any) {
      // Request helpers normally normalize transport failures, but a lazy
      // module/runtime failure can still reject before reaching that boundary.
      // Treat that uncertainty exactly like a response-less request: status
      // polling may continue, but generation must never be replayed.
      result = {
        success: false,
        generationStatus: 'unknown',
        error:
          (typeof error?.message === 'string' && error.message) ||
          'Unable to check image generation status',
        retryable: true,
        isTransportError: true
      };
    }
    if (!isActive()) return null;
    if (result?.isTransportError !== true) {
      // A real canonical status response is stronger evidence than Safari's
      // cached navigator.onLine hint. Refresh the short-lived override on each
      // successful read so a generation that legitimately runs longer than
      // thirty seconds does not pause itself while the server remains
      // reachable. This changes only recovery scheduling; processing status
      // still polls at the same two-second cadence and every streaming event
      // remains intact.
      markBrowserNetworkReachable();
    }
    if (isComplete(result)) return result;
    const isTransportError = result?.isTransportError === true;
    if (!isTransportError && initialStatusGraceStartedAt === null) {
      // The visibility race begins when the first status read can actually
      // reach the server, not when polling was requested while offline.
      initialStatusGraceStartedAt = now();
    }

    const generationStatus = String(
      result?.status || result?.generationStatus || ''
    );
    const withinInitialStatusGrace =
      initialStatusGraceStartedAt !== null &&
      transientInitialStatusTimeoutMs > 0 &&
      now() - initialStatusGraceStartedAt < transientInitialStatusTimeoutMs &&
      transientInitialStatuses.includes(generationStatus);
    const shouldRetry =
      generationStatus === 'processing' ||
      result?.retryable === true ||
      withinInitialStatusGrace;
    if (!shouldRetry) return result;

    const isStatusReadFailure =
      isTransportError ||
      (result?.retryable === true && generationStatus !== 'processing');
    consecutiveStatusReadFailures = isStatusReadFailure
      ? consecutiveStatusReadFailures + 1
      : 0;
    const retryAfterMs = isStatusReadFailure
      ? Math.min(
          AI_IMAGE_TRANSPORT_RETRY_MAX_MS,
          Math.max(
            Number(result?.retryAfterSeconds || 0) * 1000,
            AI_IMAGE_CANONICAL_STATUS_RETRY_MS *
              2 ** Math.max(0, consecutiveStatusReadFailures - 1)
          )
        )
      : Math.min(
          10_000,
          Math.max(
            AI_IMAGE_CANONICAL_STATUS_RETRY_MS,
            Number(result?.retryAfterSeconds || 0) * 1000
          )
        );
    await wait(retryAfterMs);
  }

  if (!isActive()) return null;
  return {
    success: false,
    generationStatus: 'unknown',
    code: 'ai_image_status_timeout',
    error:
      'The image is still being finalized. Please try checking it again shortly.'
  };
}

export function pollCanonicalAIImageStatus({
  loadStatus,
  isActive,
  transientInitialStatuses,
  transientInitialStatusTimeoutMs,
  timeoutMs,
  now,
  wait
}: {
  loadStatus: () => Promise<any>;
  isActive?: () => boolean;
  transientInitialStatuses?: string[];
  transientInitialStatusTimeoutMs?: number;
  timeoutMs?: number;
  now?: () => number;
  wait?: (delayMs: number) => Promise<void>;
}) {
  return pollCanonicalRequestStatus({
    loadStatus,
    isComplete: (result) =>
      result?.success === true && typeof result?.imageUrl === 'string',
    isActive,
    transientInitialStatuses,
    transientInitialStatusTimeoutMs,
    timeoutMs,
    now,
    wait
  });
}

export function shouldRecoverAIImageUnknownOutcome(options: {
  reachedServer: unknown;
  hasServerProgress: boolean;
  hasPendingCompletion?: boolean;
}) {
  // A response-less transport failure is an unknown outcome even when the
  // first volatile socket progress frame was also lost. The canonical status
  // endpoint is read-only and keyed by the request fingerprint, so it is safe
  // to check without ever replaying generation or charging twice.
  return options.reachedServer === false;
}

export async function resolveAIImageStatusImageUrl({
  imageUrl,
  recovery,
  loadResult
}: {
  imageUrl?: string;
  recovery?: AiImageRecoveryLocation;
  loadResult: (args: {
    recovery: AiImageRecoveryLocation;
  }) => Promise<{ imageUrl?: string } | undefined>;
}) {
  if (typeof imageUrl === 'string' && imageUrl) return imageUrl;
  if (!recovery) return undefined;

  const recovered = await loadResult({ recovery });
  return typeof recovered?.imageUrl === 'string' && recovered.imageUrl
    ? recovered.imageUrl
    : undefined;
}
