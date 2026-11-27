export interface BuildApiTokenState {
  buildId?: number;
  userId?: number;
  token: string;
  scopes: string[];
  expiresAt: number;
}

/**
 * Keep the broader valid cached token when a narrower concurrent token refresh
 * finishes later for the same build and viewer, so parallel boot requests
 * (e.g. privateDb + sharedDb) do not downgrade each other's cached scopes.
 */
export function selectCachedBuildApiToken(
  latestCached: BuildApiTokenState | null | undefined,
  nextToken: BuildApiTokenState,
  nowSeconds: number
): BuildApiTokenState {
  const latestMatches =
    Boolean(latestCached) &&
    Number(latestCached?.buildId || 0) > 0 &&
    Number(latestCached?.buildId || 0) === Number(nextToken.buildId || 0) &&
    Number(latestCached?.userId || 0) > 0 &&
    Number(latestCached?.userId || 0) === Number(nextToken.userId || 0) &&
    Number(latestCached?.expiresAt || 0) - 30 > nowSeconds;
  const latestSuperset =
    latestMatches &&
    nextToken.scopes.every((scope) => latestCached!.scopes.includes(scope)) &&
    latestCached!.scopes.length > nextToken.scopes.length;
  return latestSuperset ? latestCached! : nextToken;
}
