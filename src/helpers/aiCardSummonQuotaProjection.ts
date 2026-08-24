export interface AICardSummonQuotaProjectionRequest {
  canonicalRevision: number;
  requestOrdinal: number;
}

let canonicalRevision = 0;
let nextRequestOrdinal = 0;
let lastAcceptedReadRequestOrdinal = 0;

// Read snapshots, summon responses, and cross-account socket invalidations can
// complete in any order. Give reads an issue-order token, while mutations and
// sockets advance a canonical revision that invalidates every older in-flight
// read. This prevents both HTTP-vs-HTTP and HTTP-vs-socket regressions without
// guessing that a larger count is newer (bucket changes can legitimately lower
// one account's current projection).
export function captureAICardSummonQuotaProjectionRequest(): AICardSummonQuotaProjectionRequest {
  return {
    canonicalRevision,
    requestOrdinal: ++nextRequestOrdinal
  };
}

export function invalidateAICardSummonQuotaProjection() {
  canonicalRevision += 1;
  return canonicalRevision;
}

export function acceptAICardSummonQuotaReadProjection(
  request: AICardSummonQuotaProjectionRequest
) {
  if (
    request.canonicalRevision !== canonicalRevision ||
    request.requestOrdinal <= lastAcceptedReadRequestOrdinal
  ) {
    return false;
  }
  lastAcceptedReadRequestOrdinal = request.requestOrdinal;
  return true;
}

export function acceptAICardSummonQuotaMutationProjection(
  request: AICardSummonQuotaProjectionRequest
) {
  if (request.canonicalRevision !== canonicalRevision) return false;
  canonicalRevision += 1;
  return true;
}
