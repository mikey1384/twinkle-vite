export const AI_ENERGY_SPONSOR_PLACEHOLDER_KIND = 'zero_ciel_public_reply';
export const AI_ENERGY_SPONSOR_PLACEHOLDER_SUFFIX =
  'needs AI Energy to reply. Someone can sponsor this reply.';
export const AI_ENERGY_SPONSOR_REVALIDATE_DELAY_MS = 45 * 1000;

// Comment fields the server can replace after a comment is uploaded (an edit,
// or an AI Energy placeholder being swapped for the generated reply). Surfaces
// that render a comment from a feed payload snapshot overlay these from the
// content context, which is the copy socket broadcasts and request responses
// keep current.
export const LIVE_COMMENT_FIELDS = [
  'content',
  'fileName',
  'filePath',
  'fileSize',
  'isDeleted',
  'settings',
  'thumbUrl'
] as const;

export type AiEnergySponsorPhase =
  | 'checkingExisting'
  | 'finished'
  | 'idle'
  | 'replying'
  | 'sponsoring';

export interface AiEnergySponsorState {
  message: string;
  phase: AiEnergySponsorPhase;
  // The server's `sponsoredAt` stamp this client has already accounted for, so
  // a sponsorship it has settled is not re-detected as new.
  sponsoredAt: number;
  statusToken: string;
}

export const defaultAiEnergySponsorState: AiEnergySponsorState = {
  message: '',
  phase: 'idle',
  sponsoredAt: 0,
  statusToken: ''
};

export function parseCommentSettings(settings: any) {
  if (!settings) return {};
  if (typeof settings === 'object') return settings;
  if (typeof settings !== 'string') return {};
  try {
    return JSON.parse(settings);
  } catch {
    return {};
  }
}

export function getAiEnergySponsorPlaceholderMarker(comment?: any) {
  return parseCommentSettings(comment?.settings).aiEnergySponsorPlaceholder;
}

// Resolves the placeholder AI name for a comment already known to be authored
// by `aiName` (Zero or Ciel). Returns '' once the server has swapped the
// placeholder for the real reply, because the resolved marker carries
// `resolvedAt`.
export function resolveAiEnergyPlaceholderName({
  aiName,
  comment
}: {
  aiName: string;
  comment?: any;
}) {
  if (!aiName) return '';
  if (
    (comment?.content || '').trim() !==
    `${aiName} ${AI_ENERGY_SPONSOR_PLACEHOLDER_SUFFIX}`
  ) {
    return '';
  }
  const targetCommentId = Number(comment?.replyId || comment?.commentId || 0);
  if (!targetCommentId) return '';
  const marker = getAiEnergySponsorPlaceholderMarker(comment);
  if (
    marker?.kind !== AI_ENERGY_SPONSOR_PLACEHOLDER_KIND ||
    marker?.aiUsername !== aiName ||
    marker?.resolvedAt ||
    Number(marker?.targetCommentId || 0) !== targetCommentId
  ) {
    return '';
  }
  return aiName;
}

export function getAiEnergyPlaceholderStatusToken(comment?: any) {
  const marker = getAiEnergySponsorPlaceholderMarker(comment);
  return typeof marker?.statusToken === 'string' ? marker.statusToken : '';
}

// A placeholder is born with a `statusToken`, so only `sponsoredAt` says a
// reply is actually being written. The server stamps it when a sponsorship is
// accepted and clears it if the generation fails.
export function getAiEnergyPlaceholderSponsoredAt(comment?: any) {
  return Number(getAiEnergySponsorPlaceholderMarker(comment)?.sponsoredAt || 0);
}

// Phase a client should show for a sponsorship it has no local record of. A
// newer `sponsoredAt` than the one already settled means someone (possibly on
// another device, or this user before a reload) has a reply in flight; the
// status poll that follows confirms it or hands the placeholder back.
export function resolveAiEnergySponsorPhase({
  sponsoredAt,
  sponsorState
}: {
  sponsoredAt: number;
  sponsorState: AiEnergySponsorState;
}): AiEnergySponsorPhase {
  if (sponsoredAt > sponsorState.sponsoredAt) return 'replying';
  return sponsorState.phase;
}

export function normalizeAiEnergySponsorState(
  sponsorState?: Partial<AiEnergySponsorState> | null
): AiEnergySponsorState {
  return {
    ...defaultAiEnergySponsorState,
    ...(sponsorState || {})
  };
}

export function isAiEnergySponsorPollPhase(phase: AiEnergySponsorPhase) {
  return phase === 'replying' || phase === 'checkingExisting';
}

// Overlays the canonical (content context) copy of a comment onto a snapshot
// copy. Only fields the canonical entry actually carries are applied, so an
// entry that exists purely to hold sponsorship state never blanks out the
// snapshot's content.
export function mergeLiveCommentState(comment: any, liveContentState: any) {
  if (!comment || !liveContentState) return comment;
  const livePatch: Record<string, any> = {};
  for (const field of LIVE_COMMENT_FIELDS) {
    if (liveContentState[field] !== undefined) {
      livePatch[field] = liveContentState[field];
    }
  }
  if (!Object.keys(livePatch).length) return comment;
  return { ...comment, ...livePatch };
}
