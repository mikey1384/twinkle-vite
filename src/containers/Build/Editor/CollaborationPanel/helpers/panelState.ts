import type { BuildForumActivityPosition } from '../types';

export function normalizePanelScrollTop(value: unknown) {
  const scrollTop = Number(value || 0);
  if (!Number.isFinite(scrollTop)) return 0;
  return Math.max(0, Math.floor(scrollTop));
}

export function normalizePanelForumThreadId(value: unknown) {
  const threadId = Number(value || 0);
  if (!Number.isFinite(threadId)) return 0;
  return Math.max(0, Math.floor(threadId));
}

export function parseBuildForumActivityPosition(
  value: unknown
): BuildForumActivityPosition | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const rawPosition = value as Partial<BuildForumActivityPosition>;
  const activitySeq = normalizeNonNegativeInteger(rawPosition.activitySeq);
  return { activitySeq };
}

export function compareBuildForumActivityPositions(
  left: BuildForumActivityPosition,
  right: BuildForumActivityPosition
) {
  return left.activitySeq - right.activitySeq;
}

function normalizeNonNegativeInteger(value: unknown) {
  const numericValue = Math.floor(Number(value) || 0);
  if (!Number.isFinite(numericValue)) return 0;
  return Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, numericValue));
}
