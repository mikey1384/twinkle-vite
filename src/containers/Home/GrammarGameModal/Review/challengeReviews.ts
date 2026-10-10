export interface ChallengeResult {
  justified: boolean;
  explanation: string;
  newBalance?: number;
}

export interface SavedChallengeReview {
  outcome: 'accepted' | 'rejected' | null;
  explanation: string;
}

// Older API responses still tell us a question is checked. Show that state
// without offering another paid review or inventing an accepted/rejected verdict.
export function getSavedChallengeReview(
  checked: boolean | undefined,
  savedReview?: SavedChallengeReview | null,
  explanation?: string | null
): SavedChallengeReview | null {
  return checked
    ? savedReview || { outcome: null, explanation: explanation || '' }
    : null;
}

export function challengeReviewLabel(
  review?: ChallengeReview,
  savedReview?: SavedChallengeReview | null
) {
  savedReview ||= review?.status === 'error' ? review.savedReview : null;
  const outcome =
    review?.status === 'complete'
      ? review.result.justified
        ? 'accepted'
        : 'rejected'
      : savedReview?.outcome;
  if (outcome === 'accepted') return 'Challenge accepted';
  if (outcome === 'rejected') return 'Challenge rejected';
  if (savedReview) return 'Already reviewed';
  if (review?.status === 'pending') return 'View progress';
  if (review?.status === 'error' && review.rewritten) return 'Reworded since';
  if (review) return 'Review status';
  return 'Challenge';
}

export type ChallengeReview =
  | { status: 'pending'; thought: string }
  | { status: 'complete'; result: ChallengeResult }
  | {
      status: 'error';
      message: string;
      canRetry: boolean;
      savedReview?: SavedChallengeReview;
      // a Quest miss met on a wording rewritten since: nothing to review,
      // and the message says why
      rewritten?: boolean;
    };

type Reviews = Readonly<Record<number, ChallengeReview>>;
const EMPTY: Reviews = Object.freeze({});

// A review belongs to the signed-in learner and question, not its dialog.
// Dismissing/reopening the dialog must not start another paid request or lose
// the result. This is only a tab-local cache of canonical server responses.
export function createChallengeReviewStore() {
  const byUser = new Map<number, Reviews>();
  const listeners = new Set<() => void>();

  function get(userId: number): Reviews {
    return byUser.get(userId) || EMPTY;
  }

  function publish(
    userId: number,
    questionId: number,
    review: ChallengeReview
  ) {
    byUser.set(userId, { ...get(userId), [questionId]: review });
    listeners.forEach((notify) => notify());
  }

  return {
    get,
    subscribe(notify: () => void) {
      listeners.add(notify);
      return () => listeners.delete(notify);
    },
    async start(
      userId: number,
      questionId: number,
      request: (
        onThought: (text: string, isDelta?: boolean) => void
      ) => Promise<ChallengeResult>
    ) {
      const existing = get(userId)[questionId];
      if (
        !userId ||
        !questionId ||
        existing?.status === 'pending' ||
        existing?.status === 'complete' ||
        (existing?.status === 'error' && !existing.canRetry)
      )
        return;
      publish(userId, questionId, { status: 'pending', thought: '' });
      try {
        const result = await request((text, isDelta) => {
          const current = get(userId)[questionId];
          if (current?.status !== 'pending') return;
          publish(userId, questionId, {
            status: 'pending',
            thought: isDelta ? current.thought + text : text
          });
        });
        if (typeof result?.justified !== 'boolean') {
          throw new Error('The review result did not reach us.');
        }
        publish(userId, questionId, { status: 'complete', result });
      } catch (error: any) {
        publish(userId, questionId, {
          status: 'error',
          message: error?.message || 'The review result did not reach us.',
          // A competing review can fail and release its server lock. Allow an
          // explicit retry; that lock and the checked-question guard prevent
          // duplicate work. Reopening this state never submits automatically.
          canRetry:
            error?.status !== 401 &&
            !error?.challengeReview &&
            !error?.rewritten,
          ...(error?.challengeReview
            ? { savedReview: error.challengeReview }
            : {}),
          ...(error?.rewritten ? { rewritten: true } : {})
        });
      }
    }
  };
}
