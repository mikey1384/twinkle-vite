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

// The canonical "sent" line (receipt store or the server's copy for this
// exact revision): when it went and who it is waiting on, so a quiet owner
// does not look like nothing happened.
export function formatBranchSubmitWaitingLine({
  ownerName,
  sentAgo
}: {
  ownerName: string;
  sentAgo: string;
}) {
  return `Sent ${sentAgo}, waiting for ${ownerName}`;
}

export function getBranchSubmitOwnerPresence(presence: any) {
  const isOnline = presence?.isOnline === true;

  return {
    isOnline,
    isAway: isOnline && presence?.isAway === true,
    isBusy: isOnline && presence?.isBusy === true
  };
}

// Who may hand a branch to its owner, and whether there is anything to hand.
// One rule for every surface that offers the send (workspace header, Team
// panel), matching the pair the notify-owner route enforces: only the branch's
// own author, never the project owner, and only an open branch with saved
// work. A merged branch grows a delta again once Main moves on by itself (Main-
// only files the branch never deleted), so the delta alone is not enough.
export function getBranchSubmitToOwnerTarget({
  build,
  userId
}: {
  build: any;
  userId?: number | null;
}) {
  const status = String(build?.contributionStatus || '').trim();
  const isContributionFork =
    status === 'draft' || status === 'merging' || status === 'merged';
  if (!isContributionFork) return null;
  const viewerId = Number(userId || 0);
  if (!viewerId) return null;
  if (Number(build.contributionContributorId || 0) !== viewerId) return null;
  if (Number(build.rootBuildUserId || 0) === viewerId) return null;
  const rootBuildId = Number(build.contributionRootBuildId || 0);
  const branchBuildId = Number(build.id || 0);
  if (!rootBuildId || !branchBuildId) return null;
  const revisionHash = String(build.contributionRevisionHash || '');
  const isBranchOpen = status !== 'merged' && status !== 'merging';
  // The server remembers the last send and which saved work it carried; it
  // only counts as sent while that is still the branch's current work.
  const submittedRevisionHash = String(
    build.contributionSubmittedRevisionHash || ''
  );
  const submittedAt =
    revisionHash && submittedRevisionHash === revisionHash
      ? Number(build.contributionSubmittedAt || 0)
      : 0;
  return {
    submittedAt,
    rootBuildId,
    branchBuildId,
    revisionHash,
    hasWorkToSend: isBranchOpen && Boolean(revisionHash),
    ownerUserId: Number(build.rootBuildUserId || 0),
    ownerUsername: build.rootBuildUsername || null,
    ownerProfilePicUrl: build.rootBuildProfilePicUrl || null
  };
}

// The server's own timestamp for the send, kept per set of changes so every
// surface showing the send agrees on whether this exact work was handed over.
// A new save changes the revision hash, which is a new, unsent piece of work.
const sentReceipts = new Map<string, number>();
const receiptListeners = new Set<() => void>();

function getReceiptKey(branchBuildId: number, revisionHash?: string | null) {
  return `${Number(branchBuildId || 0)}:${String(revisionHash || '')}`;
}

export function recordBranchSubmitReceipt({
  branchBuildId,
  revisionHash,
  sentAt
}: {
  branchBuildId: number;
  revisionHash?: string | null;
  sentAt: number;
}) {
  sentReceipts.set(getReceiptKey(branchBuildId, revisionHash), sentAt);
  receiptListeners.forEach((listener) => listener());
}

export function getBranchSubmitReceipt({
  branchBuildId,
  revisionHash
}: {
  branchBuildId: number;
  revisionHash?: string | null;
}) {
  return sentReceipts.get(getReceiptKey(branchBuildId, revisionHash)) || 0;
}

export function subscribeBranchSubmitReceipts(listener: () => void) {
  receiptListeners.add(listener);
  return () => {
    receiptListeners.delete(listener);
  };
}
