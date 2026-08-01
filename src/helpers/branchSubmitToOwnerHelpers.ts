export function getBranchSubmitOwnerCopy({
  ownerUsername,
  sent
}: {
  ownerUsername?: string | null;
  sent: boolean;
}) {
  const ownerName =
    String(ownerUsername || '').trim() || 'the project owner';

  return {
    ownerName,
    actionLabel: sent
      ? `Send another update to ${ownerName}`
      : `Send update to ${ownerName}`,
    sentLabel: `Update sent to ${ownerName}`
  };
}

export function getBranchSubmitOwnerPresence(presence: any) {
  const isOnline = presence?.isOnline === true;

  return {
    isOnline,
    isAway: isOnline && presence?.isAway === true,
    isBusy: isOnline && presence?.isBusy === true
  };
}
