import { LimitProgressItem } from './types';

const BUILD_ASSISTANT_PLACEHOLDER_TEXT =
  'Would you like me to continue working on this?';

const STATUS_LABEL_MAP: Record<string, string> = {
  thinking: 'Thinking',
  thinking_hard: 'Thinking hard',
  analyzing_code: 'Analyzing code',
  responding: 'Writing response',
  searching_web: 'Searching the web',
  reading_file: 'Reading files',
  retrieving_memory: 'Remembering',
  saving_file: 'Saving file',
  reading: 'Reading and thinking',
  recalling: 'Recalling memories'
};

export function isBuildAssistantPlaceholderContent(
  content: string | null | undefined
) {
  const normalizedContent = String(content || '').trim();
  return (
    !normalizedContent ||
    normalizedContent === BUILD_ASSISTANT_PLACEHOLDER_TEXT
  );
}

export function formatScaledRem(baseRem: number, scale: number) {
  return `${(baseRem * scale).toFixed(3)}rem`;
}

export function formatStepLabel(status: string): string {
  if (STATUS_LABEL_MAP[status]) return STATUS_LABEL_MAP[status];
  if (status.includes(' ')) return status.replace(/\.+$/, '');
  return status;
}

export function findLastIndex<T>(
  arr: T[],
  predicate: (item: T) => boolean
): number {
  for (let i = arr.length - 1; i >= 0; i -= 1) {
    if (predicate(arr[i])) return i;
  }
  return -1;
}

export function looksLikeCompletedCodeChangeClaim(content: string) {
  if (!content || typeof content !== 'string') return false;

  const normalized = content.replace(/[’]/g, "'").toLowerCase();
  if (
    /(can't|cannot|unable|couldn't|could not|won't|didn't|did not|not possible|cannot do)/.test(
      normalized
    )
  ) {
    return false;
  }

  return [
    /\b(i|we)\s+(have|ve|did|just)?\s*(added|updated|fixed|implemented|wired|hooked|changed|created|built|patched|refactored)\b/,
    /\b(here('s| is)\s+(it|the updated version)|it('s| is)\s+(done|fixed|updated))\b/,
    /\b(wired up|changes?\s+(are in|applied|made)|updated code|follow\/unfollow buttons)\b/
  ].some((pattern) => pattern.test(normalized));
}

export function formatTokenCount(value: number) {
  const safeValue = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
  return new Intl.NumberFormat('en-US').format(safeValue);
}

export function formatBytes(value: number) {
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
  if (safeValue >= 1024 * 1024) {
    return `${(safeValue / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (safeValue >= 1024) {
    return `${(safeValue / 1024).toFixed(1)} KB`;
  }
  return `${Math.round(safeValue)} B`;
}

export function buildLimitProgressItem({
  id,
  label,
  used,
  limit,
  text,
  caption,
  color
}: {
  id: string;
  label: string;
  used: number;
  limit: number;
  text: string;
  caption?: string;
  color?: string;
}): LimitProgressItem | null {
  if (!Number.isFinite(limit) || limit <= 0) return null;
  return {
    id,
    label,
    progress: Math.max(0, Math.min(100, (used / limit) * 100)),
    text,
    caption,
    color
  };
}
