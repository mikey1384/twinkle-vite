import {
  DAILY_QUESTION_PENDING_SUBMISSION_STORAGE_KEY
} from './constants';
import type {
  PendingDailyQuestionRecoveryState,
  PendingDailyQuestionSubmission,
  TypingMetadata
} from './types';

export function createEmptyTypingMetadata(): TypingMetadata {
  return {
    startTime: 0,
    keystrokeTimestamps: []
  };
}

export function normalizeTypingMetadata(
  value: unknown
): TypingMetadata | null {
  const parsed = value as Partial<TypingMetadata> | null;
  if (!parsed || typeof parsed !== 'object') return null;

  const startTime = Number(parsed.startTime);
  if (!Number.isFinite(startTime) || startTime <= 0) {
    return null;
  }

  if (!Array.isArray(parsed.keystrokeTimestamps)) {
    return null;
  }

  const keystrokeTimestamps = parsed.keystrokeTimestamps
    .map((timestamp) => Number(timestamp))
    .filter((timestamp) => Number.isFinite(timestamp) && timestamp > 0)
    .map((timestamp) => Math.floor(timestamp))
    .slice(-5000);

  if (keystrokeTimestamps.length === 0) {
    return null;
  }

  return {
    startTime: Math.floor(startTime),
    keystrokeTimestamps
  };
}

export function cloneTypingMetadata(
  metadata: TypingMetadata | null | undefined
) {
  if (!metadata) {
    return createEmptyTypingMetadata();
  }

  return {
    startTime: metadata.startTime,
    keystrokeTimestamps: [...metadata.keystrokeTimestamps]
  };
}

export function isDeletionOnlyChange(
  previousText: string,
  nextText: string
): boolean {
  if (nextText.length >= previousText.length) return false;

  let nextIndex = 0;
  for (
    let previousIndex = 0;
    previousIndex < previousText.length && nextIndex < nextText.length;
    previousIndex++
  ) {
    if (previousText[previousIndex] === nextText[nextIndex]) {
      nextIndex++;
    }
  }

  return nextIndex === nextText.length;
}

export function normalizeSelectionArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

export function createDailyQuestionClientRequestId() {
  return typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getPendingSubmissionStorageKey(userId: number) {
  return `${DAILY_QUESTION_PENDING_SUBMISSION_STORAGE_KEY}:${userId}`;
}

function normalizePendingSubmissionRecoveryState(
  value: unknown
): PendingDailyQuestionRecoveryState {
  return value === 'draft' ? 'draft' : 'pending';
}

export function loadPendingDailyQuestionSubmission(userId: number) {
  if (
    typeof window === 'undefined' ||
    typeof window.sessionStorage === 'undefined'
  ) {
    return null;
  }

  try {
    const rawValue = window.sessionStorage.getItem(
      getPendingSubmissionStorageKey(userId)
    );
    if (!rawValue) return null;

    const parsed = JSON.parse(
      rawValue
    ) as Partial<PendingDailyQuestionSubmission>;
    if (
      Number(parsed?.userId) !== userId ||
      !Number.isFinite(Number(parsed?.questionId)) ||
      Number(parsed?.questionId) <= 0 ||
      typeof parsed?.clientRequestId !== 'string' ||
      !parsed.clientRequestId ||
      typeof parsed?.response !== 'string'
    ) {
      return null;
    }

    return {
      userId,
      questionId: Number(parsed.questionId),
      clientRequestId: parsed.clientRequestId,
      response: parsed.response,
      createdAt: Number(parsed.createdAt) || 0,
      recoveryState: normalizePendingSubmissionRecoveryState(
        parsed?.recoveryState
      ),
      typingMetadata: normalizeTypingMetadata(parsed?.typingMetadata)
    };
  } catch {
    return null;
  }
}

export function savePendingDailyQuestionSubmission({
  userId,
  questionId,
  clientRequestId,
  response,
  createdAt,
  recoveryState,
  typingMetadata
}: PendingDailyQuestionSubmission) {
  if (
    typeof window === 'undefined' ||
    typeof window.sessionStorage === 'undefined'
  ) {
    return;
  }

  try {
    window.sessionStorage.setItem(
      getPendingSubmissionStorageKey(userId),
      JSON.stringify({
        userId,
        questionId,
        clientRequestId,
        response,
        createdAt,
        recoveryState,
        typingMetadata: normalizeTypingMetadata(typingMetadata)
      })
    );
  } catch {}
}

export function clearPendingDailyQuestionSubmission(userId: number) {
  if (
    typeof window === 'undefined' ||
    typeof window.sessionStorage === 'undefined'
  ) {
    return;
  }

  try {
    window.sessionStorage.removeItem(getPendingSubmissionStorageKey(userId));
  } catch {}
}
