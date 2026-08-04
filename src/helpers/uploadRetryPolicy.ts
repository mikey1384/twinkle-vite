export function isUploadClientRefreshRequired(error: any) {
  return (
    Number(error?.response?.status || 0) === 426 ||
    error?.response?.data?.code === 'client_refresh_required'
  );
}

export function shouldRetryUploadRequest(error: any) {
  const status = Number(error?.response?.status || 0);
  const retryable = error?.response?.data?.retryable;
  if (retryable === false) return false;
  if (!status) return true;
  return retryable === true || status === 429 || status >= 500;
}

export function getUploadRetryDelayMs(error: any, fallbackMs: number) {
  const retryAfterSeconds = Number(
    error?.response?.data?.retryAfterSeconds ||
      error?.response?.headers?.['retry-after'] ||
      0
  );
  return Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
    ? Math.min(retryAfterSeconds, 60) * 1000
    : fallbackMs;
}
