import {
  getHttpHeaderValue,
  normalizeAuthorizationToken
} from './httpHeaderHelpers';

export type SessionTokenValidation = 'valid' | 'invalid' | 'unknown';

interface UnauthorizedSessionResolverOptions {
  canonicalSessionUrl: string;
  getCurrentToken: () => string;
  validateSessionToken: (token: string) => Promise<SessionTokenValidation>;
}

function getErrorRequestConfig(error: any) {
  return error?.config || error?.response?.config || null;
}

function isCanonicalSessionRequest(error: any, canonicalSessionUrl: string) {
  const config = getErrorRequestConfig(error);
  const requestUrl = String(config?.url || '').trim();
  if (!requestUrl) return false;

  try {
    const canonicalUrl = new URL(canonicalSessionUrl);
    const resolvedRequestUrl = new URL(requestUrl, `${canonicalUrl.origin}/`);
    const canonicalPath = canonicalUrl.pathname.replace(/\/+$/, '');
    const requestPath = resolvedRequestUrl.pathname.replace(/\/+$/, '');
    return (
      resolvedRequestUrl.origin === canonicalUrl.origin &&
      requestPath === canonicalPath
    );
  } catch {
    return false;
  }
}

function getRequestAuthorizationToken(error: any) {
  const headers = getErrorRequestConfig(error)?.headers;
  return normalizeAuthorizationToken(
    getHttpHeaderValue(headers, 'authorization')
  );
}

/**
 * Resolves the exact stored token that a 401 has canonically proven invalid.
 * Route-specific 401s (including expired Lumine Build API tokens) are not
 * evidence that the interactive session is invalid, and late responses from
 * an older token must never clear a newer login.
 */
export function createUnauthorizedSessionResolver({
  canonicalSessionUrl,
  getCurrentToken,
  validateSessionToken
}: UnauthorizedSessionResolverOptions) {
  const pendingValidations = new Map<string, Promise<SessionTokenValidation>>();

  function validateOnce(token: string) {
    const pending = pendingValidations.get(token);
    if (pending) return pending;

    const validation = Promise.resolve()
      .then(() => validateSessionToken(token))
      .then((result): SessionTokenValidation => {
        if (result === 'valid' || result === 'invalid') return result;
        return 'unknown';
      })
      .catch((): SessionTokenValidation => 'unknown')
      .finally(() => {
        if (pendingValidations.get(token) === validation) {
          pendingValidations.delete(token);
        }
      });
    pendingValidations.set(token, validation);
    return validation;
  }

  return async function resolveInvalidSessionToken(error: any) {
    if (Number(error?.response?.status || 0) !== 401) return null;

    const currentStoredToken = String(getCurrentToken() || '');
    const currentToken = normalizeAuthorizationToken(currentStoredToken);
    if (!currentToken) return null;

    const requestToken = getRequestAuthorizationToken(error);
    if (requestToken && requestToken !== currentToken) {
      return null;
    }

    if (requestToken && isCanonicalSessionRequest(error, canonicalSessionUrl)) {
      return String(getCurrentToken() || '') === currentStoredToken
        ? currentStoredToken
        : null;
    }

    const validation = await validateOnce(currentToken);
    if (validation !== 'invalid') return null;

    return String(getCurrentToken() || '') === currentStoredToken
      ? currentStoredToken
      : null;
  };
}
