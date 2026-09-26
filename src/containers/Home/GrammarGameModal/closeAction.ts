// What closing Grammarbles mid-round does to the server's attempt. A finished
// round is never cancelled: its result is still uploading or waiting to be
// resent, and cancelling it would record the played level as a blank fail.
// Only an attempt this session actually started can be cancelled, and only by
// its own attempt number.
export type GrammarCloseAction =
  | { type: 'none' }
  | { type: 'resend' }
  | { type: 'cancel'; attemptNumber: number; answeredCount: number };

export function resolveGrammarCloseAction({
  uploadInFlight,
  hasUnsavedResult,
  startedAttemptNumber,
  answeredCount
}: {
  uploadInFlight: boolean;
  hasUnsavedResult: boolean;
  startedAttemptNumber: number | null;
  answeredCount: number;
}): GrammarCloseAction {
  if (uploadInFlight) return { type: 'none' };
  if (hasUnsavedResult) return { type: 'resend' };
  if (startedAttemptNumber) {
    return {
      type: 'cancel',
      attemptNumber: startedAttemptNumber,
      answeredCount
    };
  }
  return { type: 'none' };
}

// A question counts as answered once any choice was picked, right or wrong, so
// quitting after a wrong pick still counts as a failed level.
export function countAnsweredGrammarQuestions(
  questionIds: any[],
  questionObj: Record<number, any> | null | undefined
) {
  return (questionIds || []).filter((id) => {
    const question = questionObj?.[id];
    return (
      !!question?.score ||
      !!question?.wasWrong ||
      typeof question?.selectedChoiceIndex === 'number'
    );
  }).length;
}
