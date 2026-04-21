export const INACTIVITY_LIMIT = 10;
export const MIN_RESPONSE_LENGTH = 50;
export const PROGRESS_TICK_MS = 80;
export const PROGRESS_MILESTONE_HOLD = 0.8;
export const QUESTION_PROGRESS_DURATIONS = {
  early: 45000,
  middle: 30000,
  late: 35000
} as const;
export const GRADING_DURATION_MULTIPLIER = 1.25;
export const MIN_GRADING_DURATION_MS = 12000;
export const STREAK_REPAIR_COST = 100000;
export const DAILY_QUESTION_PENDING_SUBMISSION_STORAGE_KEY =
  'dailyQuestionPending';
export const DAILY_QUESTION_RECOVERY_POLL_MS = 2000;
export const DAILY_QUESTION_RECOVERY_MAX_ATTEMPTS = 30;
export const DAILY_QUESTION_RECOVERY_NOT_FOUND_RETRY_LIMIT = 3;
export const DAILY_QUESTION_DRAFT_RESTORED_NOTICE =
  "We couldn't confirm your previous submission. Your draft is restored. Start again to resubmit.";
export const DAILY_QUESTION_DRAFT_SAVED_NOTICE =
  "We couldn't restore your submission right now. Your draft is saved. Start again when you're ready to resubmit.";
