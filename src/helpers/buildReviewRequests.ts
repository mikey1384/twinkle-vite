// One review-request system for everything a Build creator asks Mikey to
// unlock: XP & Coin rewards, more project room, more Lumine file storage and an
// AI Card crafting recipe (the API's controllers/build/services/reviewRequests.ts).
// These helpers turn each type's canonical server state into the same kid-
// simple row: what it is, where it stands, and at most one thing to press.
// Creators never pick sizes, fill in forms or read rule IDs here.

export type BuildReviewRequestType =
  | 'rewards'
  | 'project-limit'
  | 'storage-limit'
  | 'cardcraft';

export const BUILD_REVIEW_REQUEST_TYPES: BuildReviewRequestType[] = [
  'rewards',
  'project-limit',
  'storage-limit',
  'cardcraft'
];

export const BUILD_REVIEW_TYPE_LABELS: Record<BuildReviewRequestType, string> =
  {
    rewards: 'XP & Coins',
    'project-limit': 'Project room',
    'storage-limit': 'File storage',
    cardcraft: 'Card crafting'
  };

export const BUILD_REVIEW_TYPE_ICONS: Record<BuildReviewRequestType, string> = {
  rewards: 'coins',
  'project-limit': 'copy',
  'storage-limit': 'folder-open',
  cardcraft: 'wand-magic-sparkles'
};

export type BuildReviewRowTone = 'action' | 'waiting' | 'done' | 'problem';

export type BuildReviewRowActionKind =
  | 'open-rewards'
  | 'request-project-limit'
  | 'request-storage-limit'
  | 'request-cardcraft';

export interface BuildReviewRow {
  type: BuildReviewRequestType;
  tone: BuildReviewRowTone;
  title: string;
  detail: string;
  action: {
    kind: BuildReviewRowActionKind;
    label: string;
    // request-project-limit: which limits to ask for.
    files?: boolean;
    size?: boolean;
    // request-storage-limit: the next storage step, chosen for the creator.
    bytes?: number;
  } | null;
}

// The server's unified item (list, show, chat card).
export interface BuildReviewRequestItem {
  ref: string;
  type: BuildReviewRequestType;
  typeLabel: string;
  id: number;
  status:
    | 'pending'
    | 'changes_offered'
    | 'approved'
    | 'rejected'
    | 'superseded'
    | 'revoked';
  buildId: number | null;
  appTitle: string | null;
  requesterId: number;
  requesterUsername: string | null;
  summary: string;
  reason: string;
  reviewReason: string;
  reviewerId: number | null;
  createdAt: number;
  decidedAt: number;
  publishesOnApproval: boolean;
  decisions: Array<'approve' | 'reject' | 'revoke'>;
  details: Record<string, any>;
  eventTimeMs: number;
  // Reward requests in the Management queue carry their own review payload.
  review?: any;
}

export function formatReviewBytes(value: number) {
  const bytes = Math.max(0, Math.floor(Number(value) || 0));
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${Number.isInteger(gb) ? gb : gb.toFixed(1)} GB`;
  const mb = bytes / (1024 * 1024);
  if (mb >= 1)
    return `${Number.isInteger(mb) || mb >= 10 ? Math.round(mb) : mb.toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

export function parseBuildReviewRequestRef(value: unknown) {
  const match = /^(rewards|project-limit|storage-limit|cardcraft):(\d+)$/.exec(
    String(value || '').trim()
  );
  if (!match) return null;
  const id = Number(match[2]);
  return id > 0 ? { type: match[1] as BuildReviewRequestType, id } : null;
}

// Newer canonical copies win (a socket push can race a load).
export function compareBuildReviewRequestVersions(
  a?: Partial<BuildReviewRequestItem> | null,
  b?: Partial<BuildReviewRequestItem> | null
) {
  return (
    Number(a?.eventTimeMs || 0) - Number(b?.eventTimeMs || 0) ||
    Number(a?.details?.revision || 0) - Number(b?.details?.revision || 0)
  );
}

interface ProjectLimitApprovalLike {
  isInherited?: boolean;
  canApproveDirectly?: boolean;
  canRequestFiles?: boolean;
  canRequestSize?: boolean;
  requestedMaxFiles?: number;
  requestedMaxProjectBytes?: number;
  latestRequest?: {
    status?: string;
    requestedMaxFiles?: number | null;
    requestedMaxProjectBytes?: number | null;
  } | null;
}

function nearLimit(used: number, limit: number) {
  return Number(used || 0) >= Math.max(1, Math.floor(Number(limit || 0) * 0.8));
}

// Project room: shown to the Main project's owner once the project is 80%
// full (or while a request waits). Mikey's own projects are approved at once.
export function projectLimitReviewRow({
  approval,
  usage,
  limits,
  isOwner
}: {
  approval?: ProjectLimitApprovalLike | null;
  usage?: { projectFileCount?: number; currentProjectBytes?: number } | null;
  limits?: { maxFilesPerProject?: number; maxProjectBytes?: number } | null;
  isOwner: boolean;
}): BuildReviewRow | null {
  if (!approval || !isOwner || approval.isInherited) return null;
  const requestFiles = Boolean(
    approval.canRequestFiles &&
      nearLimit(
        Number(usage?.projectFileCount || 0),
        Number(limits?.maxFilesPerProject || 0)
      )
  );
  const requestSize = Boolean(
    approval.canRequestSize &&
      nearLimit(
        Number(usage?.currentProjectBytes || 0),
        Number(limits?.maxProjectBytes || 0)
      )
  );
  const pending = approval.latestRequest?.status === 'pending';
  if (!pending && !requestFiles && !requestSize) return null;
  const direct = Boolean(approval.canApproveDirectly);
  const latest = approval.latestRequest || null;
  const selectedFiles = pending
    ? direct
      ? Boolean(
          approval.canRequestFiles && (requestFiles || latest?.requestedMaxFiles)
        )
      : requestFiles && !Number(latest?.requestedMaxFiles || 0)
    : requestFiles;
  const selectedSize = pending
    ? direct
      ? Boolean(
          approval.canRequestSize &&
            (requestSize || latest?.requestedMaxProjectBytes)
        )
      : requestSize && !Number(latest?.requestedMaxProjectBytes || 0)
    : requestSize;
  const canSend = selectedFiles || selectedSize;
  const labels = [
    selectedFiles ? `${approval.requestedMaxFiles || 500} files` : '',
    selectedSize
      ? formatReviewBytes(approval.requestedMaxProjectBytes || 5 * 1024 * 1024)
      : ''
  ].filter(Boolean);
  const action = canSend
    ? {
        kind: 'request-project-limit' as const,
        label: direct
          ? 'Approve more room'
          : pending
            ? 'Add to my request'
            : 'Ask Mikey',
        files: selectedFiles,
        size: selectedSize
      }
    : null;
  if (pending && !direct) {
    return {
      type: 'project-limit',
      tone: canSend ? 'action' : 'waiting',
      title: 'Waiting for Mikey',
      detail: canSend
        ? `This project is now also nearing ${labels.join(' and ')}. Add it to the same request.`
        : 'Your project keeps its current room until Mikey says yes. We’ll tell you in chat.',
      action
    };
  }
  return {
    type: 'project-limit',
    tone: 'action',
    title: direct ? 'Ready for your approval' : 'This project is getting full',
    detail: direct
      ? `Approve ${labels.join(' and ')} for this project. It changes right away.`
      : `Ask Mikey for ${labels.join(' and ')}. Nothing changes until he says yes.`,
    action
  };
}

interface StorageLimitApprovalLike {
  canApproveDirectly?: boolean;
  canRequest?: boolean;
  requestTiers?: number[];
  latestRequest?: {
    status?: string;
    requestedMaxRuntimeFileStorageBytes?: number;
    approvedMaxRuntimeFileStorageBytes?: number | null;
    reviewReason?: string;
    eventTimeMs?: number;
  } | null;
}

// Lumine file storage is shared by all of a creator's Builds, so it shows in
// every workspace they open once it is 80% full (or while a request waits).
export function storageLimitReviewRow({
  approval,
  usage,
  limits
}: {
  approval?: StorageLimitApprovalLike | null;
  usage?: { runtimeFileStorageBytes?: number } | null;
  limits?: { maxRuntimeFileStorageBytes?: number } | null;
}): BuildReviewRow | null {
  if (!approval) return null;
  const pending = approval.latestRequest?.status === 'pending';
  const nextTier = Number(approval.requestTiers?.[0] || 0);
  const pressure = nearLimit(
    Number(usage?.runtimeFileStorageBytes || 0),
    Number(limits?.maxRuntimeFileStorageBytes || 0)
  );
  const direct = Boolean(approval.canApproveDirectly);
  if (!pending && !(pressure && approval.canRequest && nextTier > 0))
    return null;
  if (pending && !direct) {
    return {
      type: 'storage-limit',
      tone: 'waiting',
      title: 'Waiting for Mikey',
      detail: `You asked for ${formatReviewBytes(
        Number(approval.latestRequest?.requestedMaxRuntimeFileStorageBytes || 0)
      )} of storage for all your Builds. Your uploads keep working until he says yes.`,
      action: null
    };
  }
  return {
    type: 'storage-limit',
    tone: 'action',
    title: direct ? 'Ready for your approval' : 'Your file storage is getting full',
    detail: direct
      ? `Approve ${formatReviewBytes(nextTier)} of storage for all your Builds. It changes right away.`
      : `Ask Mikey for ${formatReviewBytes(nextTier)} of storage for all your Builds. Nothing changes until he says yes.`,
    action:
      nextTier > 0
        ? {
            kind: 'request-storage-limit',
            label: direct ? 'Approve more storage' : 'Ask Mikey',
            bytes: nextTier
          }
        : null
  };
}

export interface CardCraftSettingsLike {
  state:
    | 'not_declared'
    | 'invalid'
    | 'approved'
    | 'pending'
    | 'needs_review'
    | 'approved_not_in_workspace';
  liveReviewId?: number | null;
  latestReview?: {
    id: number;
    status: string;
    reason?: string;
  } | null;
}

// Card crafting: the recipe (cardcraft.json) Lumine wrote needs Mikey's okay.
// Approval makes it work in the published app right away.
export function cardCraftReviewRow(
  settings: CardCraftSettingsLike | null,
  { hasUnsavedChanges = false }: { hasUnsavedChanges?: boolean } = {}
): BuildReviewRow | null {
  if (!settings || settings.state === 'not_declared') return null;
  const stillWorks = settings.liveReviewId
    ? ' Your approved recipe keeps working meanwhile.'
    : '';
  const note =
    settings.latestReview?.status === 'rejected' && settings.latestReview.reason
      ? ` Mikey’s note: “${settings.latestReview.reason}”`
      : '';
  if (settings.state === 'approved' && !hasUnsavedChanges) {
    return {
      type: 'cardcraft',
      tone: 'done',
      title: 'Approved and working',
      detail: 'Players can craft their cards in your published app.',
      action: null
    };
  }
  if (settings.state === 'pending' && !hasUnsavedChanges) {
    return {
      type: 'cardcraft',
      tone: 'waiting',
      title: 'Waiting for Mikey',
      detail: `Mikey will read your crafting recipe.${stillWorks} If you change it, you’ll need to ask again.`,
      action: null
    };
  }
  if (settings.state === 'invalid') {
    return {
      type: 'cardcraft',
      tone: 'problem',
      title: 'Your crafting recipe has a problem',
      detail: `Ask Lumine to fix cardcraft.json, then ask Mikey.${stillWorks}`,
      action: null
    };
  }
  if (settings.state === 'approved_not_in_workspace') {
    return {
      type: 'cardcraft',
      tone: 'done',
      title: 'Your approved recipe still works',
      detail:
        'This version no longer has a crafting recipe, so there is nothing to ask for.',
      action: null
    };
  }
  return {
    type: 'cardcraft',
    tone: 'action',
    title:
      settings.latestReview?.status === 'rejected'
        ? 'Not approved yet'
        : 'Your crafting recipe needs approval',
    detail: `Mikey checks every crafting recipe before players can use it.${note}${stillWorks}`,
    action: { kind: 'request-cardcraft', label: 'Ask Mikey' }
  };
}

// Chat card and Management copy for one request, reviewer's point of view.
export function buildReviewStatusLabel(item: Pick<BuildReviewRequestItem, 'status' | 'type'>) {
  switch (item.status) {
    case 'pending':
      return 'Waiting for review';
    case 'changes_offered':
      return 'Waiting for the creator';
    case 'approved':
      return item.type === 'rewards' ? 'Approved · live' : 'Approved';
    case 'rejected':
      return 'Declined';
    case 'revoked':
      return 'Revoked';
    default:
      return 'Closed';
  }
}

// Management deep links: reward requests keep their own detail view.
export function getBuildReviewRequestManagementPath(
  type: BuildReviewRequestType,
  id: number
) {
  const normalized = Math.floor(Number(id || 0));
  if (normalized <= 0) return '/management';
  return type === 'rewards'
    ? `/management?rewardReview=${normalized}`
    : `/management?review=${type}:${normalized}`;
}

export function parseBuildReviewRequestFocus(search: string) {
  try {
    const params = new URLSearchParams(search || '');
    const reward = Math.floor(Number(params.get('rewardReview') || 0));
    if (Number.isSafeInteger(reward) && reward > 0)
      return { type: 'rewards' as BuildReviewRequestType, id: reward };
    return parseBuildReviewRequestRef(params.get('review'));
  } catch {
    return null;
  }
}

// What the chat card's banner says, for the creator and for Mikey alike.
export function buildReviewCardBanner(item: Pick<BuildReviewRequestItem, 'type' | 'status'>) {
  const asked: Record<BuildReviewRequestType, string> = {
    rewards: 'Sent an app for XP & Coin review',
    'project-limit': 'Asked for more project room',
    'storage-limit': 'Asked for more file storage',
    cardcraft: 'Sent a card crafting recipe for review'
  };
  const approved: Record<BuildReviewRequestType, string> = {
    rewards: 'XP & Coin rewards approved',
    'project-limit': 'Project room approved',
    'storage-limit': 'File storage approved',
    cardcraft: 'Card crafting approved'
  };
  if (item.status === 'approved') return approved[item.type];
  if (item.status === 'rejected') return 'Request declined';
  if (item.status === 'revoked') return 'Approval withdrawn';
  if (item.status === 'superseded') return 'Request closed';
  return asked[item.type];
}
