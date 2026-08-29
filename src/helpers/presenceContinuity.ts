interface PresenceContinuityProof {
  expiresAt: number;
  userId: number;
  token: string;
}

interface PresenceContinuityStateOptions {
  pageSessionId?: string;
}

export function createPresenceContinuityState({
  pageSessionId = createPageSessionId()
}: PresenceContinuityStateOptions = {}) {
  let canonicalProof: PresenceContinuityProof | null = null;

  return {
    getBindMetadata({
      userId,
      visible
    }: {
      userId: number;
      visible: boolean;
    }) {
      const matchingProof =
        canonicalProof?.userId === Number(userId) ? canonicalProof.token : '';
      return {
        presenceSessionId: pageSessionId,
        presenceVisible: visible,
        ...(matchingProof
          ? { presenceContinuityToken: matchingProof }
          : {})
      };
    },
    recordCanonicalProof({
      expiresAt,
      userId,
      token
    }: PresenceContinuityProof) {
      const normalizedUserId = Number(userId || 0);
      if (
        !Number.isSafeInteger(normalizedUserId) ||
        normalizedUserId <= 0 ||
        !Number.isSafeInteger(expiresAt) ||
        expiresAt <= 0 ||
        typeof token !== 'string' ||
        !token ||
        token.length > 4096
      ) {
        return false;
      }
      if (
        canonicalProof?.userId === normalizedUserId &&
        canonicalProof.expiresAt > expiresAt
      ) {
        return false;
      }
      canonicalProof = { expiresAt, userId: normalizedUserId, token };
      return true;
    },
    clear() {
      canonicalProof = null;
    }
  };
}

const pagePresenceContinuity = createPresenceContinuityState();

export function getPresenceContinuityBindMetadata(userId: number) {
  return pagePresenceContinuity.getBindMetadata({
    userId,
    visible: currentPageIsVisible()
  });
}

export function recordCanonicalPresenceContinuity({
  expiresAt,
  userId,
  token
}: PresenceContinuityProof) {
  return pagePresenceContinuity.recordCanonicalProof({
    expiresAt,
    userId,
    token
  });
}

export function clearPresenceContinuity() {
  pagePresenceContinuity.clear();
}

function createPageSessionId() {
  const randomId =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `web-page:${randomId}`;
}

function currentPageIsVisible() {
  if (typeof document === 'undefined') return false;
  if (document.visibilityState !== 'visible') return false;
  return typeof document.hasFocus !== 'function' || document.hasFocus();
}
