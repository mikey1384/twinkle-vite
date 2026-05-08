export type Screen = 'loading' | 'start' | 'writing' | 'grading' | 'result';

export interface TypingMetadata {
  startTime: number;
  keystrokeTimestamps: number[];
}

export type PendingDailyQuestionRecoveryState = 'pending' | 'draft';

export interface PendingDailyQuestionSubmission {
  userId: number;
  questionId: number;
  clientRequestId: string;
  response: string;
  createdAt: number;
  recoveryState: PendingDailyQuestionRecoveryState;
  typingMetadata?: TypingMetadata | null;
}

export interface RecoverPendingSubmissionArgs {
  questionId: number;
  clientRequestId: string;
  responseText: string;
  attempt?: number;
}

export interface DailyQuestionSubmitResult {
  isThoughtful: boolean;
  grade?: string;
  masterpieceType?: 'heart' | 'mind' | 'heart_and_mind' | null;
  originalResponse?: string;
  xpAwarded?: number;
  newXP?: number;
  feedback?: string;
  rejectionReason?: string;
  responseId?: number;
  sharedResponse?: string | null;
  streak?: number;
  streakMultiplier?: number;
  usedRepair?: boolean;
}

export interface DailyQuestionGradingResultState {
  grade: string;
  masterpieceType?: 'heart' | 'mind' | 'heart_and_mind' | null;
  xpAwarded: number;
  feedback: string;
  responseId: number;
  isShared: boolean;
  sharedWithZero: boolean;
  sharedWithCiel: boolean;
  originalResponse: string;
  sharedResponse: string | null;
  streak?: number;
  streakMultiplier?: number;
  usedRepair?: boolean;
}
