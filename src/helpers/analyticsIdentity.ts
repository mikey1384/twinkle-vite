export function getConfirmedAnalyticsUserId({
  confirmedUserId,
  currentUserId,
  sessionLoaded
}: {
  confirmedUserId: number | null;
  currentUserId: number | null | undefined;
  sessionLoaded: boolean;
}) {
  const normalizedCurrentUserId = Number(currentUserId || 0);
  return sessionLoaded &&
    confirmedUserId !== null &&
    confirmedUserId === normalizedCurrentUserId
    ? confirmedUserId
    : null;
}
