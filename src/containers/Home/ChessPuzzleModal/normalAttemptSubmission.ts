import type { PuzzleResult } from '~/types/chess';

export type NormalAttemptSubmissionState =
  | { status: 'idle' }
  | { status: 'submitting'; result: PuzzleResult }
  | { status: 'failed'; result: PuzzleResult; message: string };

export function areNormalAttemptTransitionsLocked(
  state: NormalAttemptSubmissionState
) {
  return state.status !== 'idle';
}

export function getChessAttemptRequestStatus(error: unknown) {
  if (typeof error !== 'object' || error === null || !('status' in error)) {
    return null;
  }
  const status = Number(error.status);
  return Number.isInteger(status) ? status : null;
}

export function getChessAttemptRequestMessage(error: unknown) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string' &&
    error.message
  ) {
    return error.message;
  }
  return 'Your result could not be saved. Check your connection and retry.';
}
