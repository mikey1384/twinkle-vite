import { useSyncExternalStore } from 'react';
import { useAppContext, useKeyContext, useNotiContext } from '~/contexts';
import { socket } from '~/constants/sockets/api';
import { getStoredItem } from '~/helpers/userDataHelpers';
import { createChallengeReviewStore } from './challengeReviews';

const store = createChallengeReviewStore();

export default function useChallengeReviews() {
  const userId = useKeyContext((v) => v.myState.userId);
  const challengeQuestion = useAppContext(
    (v) => v.requestHelpers.challengeGrammarQuestion
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const onUpdateTodayStats = useNotiContext(
    (v) => v.actions.onUpdateTodayStats
  );
  const reviews = useSyncExternalStore(store.subscribe, () =>
    store.get(userId)
  );

  return { reviews, startReview };

  function startReview(
    questionId: number,
    quest?: { runId: number; position: number }
  ) {
    return store.start(userId, questionId, async (onThought) => {
      // A result can arrive after the dialog closes or the learner signs out.
      // Keep its review in the right account, and never replace another
      // account's balance or Energy with this response.
      const isCurrentUser = () => Number(getStoredItem('userId')) === userId;
      const handleThought = (event: {
        questionId: number;
        thoughtContent: string;
        isDelta?: boolean;
      }) => {
        if (event.questionId === questionId && isCurrentUser()) {
          onThought(event.thoughtContent, event.isDelta);
        }
      };
      socket.on('grammar_challenge_thought_streamed', handleThought);
      try {
        const response = await challengeQuestion({ questionId, quest });
        if (isCurrentUser()) {
          if (response.aiUsagePolicy) {
            onUpdateTodayStats({
              newStats: { aiUsagePolicy: response.aiUsagePolicy }
            });
          }
          if (typeof response.newBalance === 'number') {
            onSetUserState({
              userId,
              newState: { twinkleCoins: response.newBalance }
            });
          }
        }
        return response;
      } catch (error: any) {
        if (isCurrentUser() && error?.aiUsagePolicy) {
          onUpdateTodayStats({
            newStats: { aiUsagePolicy: error.aiUsagePolicy }
          });
        }
        throw error;
      } finally {
        socket.off('grammar_challenge_thought_streamed', handleThought);
      }
    });
  }
}
