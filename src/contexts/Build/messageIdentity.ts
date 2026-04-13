let latestFallbackBuildRunMessageId = 0;

export function createFallbackBuildRunMessageId() {
  const nowScopedId = Date.now() * 1000;
  latestFallbackBuildRunMessageId = Math.max(
    latestFallbackBuildRunMessageId + 1,
    nowScopedId
  );
  return latestFallbackBuildRunMessageId;
}
