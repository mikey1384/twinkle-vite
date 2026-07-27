import { useEffect, useRef } from 'react';
import {
  useAppContext,
  useContentContext,
  useKeyContext,
  useNotiContext
} from '~/contexts';
import {
  AI_ENERGY_SPONSOR_REVALIDATE_DELAY_MS,
  getAiEnergyPlaceholderSponsoredAt,
  getAiEnergyPlaceholderStatusToken,
  isAiEnergySponsorPollPhase,
  normalizeAiEnergySponsorState,
  resolveAiEnergySponsorPhase,
  type AiEnergySponsorPhase,
  type AiEnergySponsorState
} from '~/helpers/aiEnergySponsorship';

// Sponsorship progress belongs to the placeholder comment, not to whichever
// surface happens to render it. It is kept in the content context under the
// placeholder's own key so the home feed card, the content page panel, and the
// comment list all read one state, and so navigating away and back resumes
// where the sponsorship actually is instead of falling back to "Sponsor".
export default function useAiEnergySponsorship({ comment }: { comment: any }) {
  const commentId = Number(comment?.id || 0);
  const sponsorAiEnergyCommentReply = useAppContext(
    (v) => v.requestHelpers.sponsorAiEnergyCommentReply
  );
  const loadAiEnergyCommentReplySponsorStatus = useAppContext(
    (v) => v.requestHelpers.loadAiEnergyCommentReplySponsorStatus
  );
  const onEditContent = useContentContext((v) => v.actions.onEditContent);
  const onSetContentState = useContentContext(
    (v) => v.actions.onSetContentState
  );
  const onUpdateTodayStats = useNotiContext(
    (v) => v.actions.onUpdateTodayStats
  );
  const userId = useKeyContext((v) => v.myState.userId);
  const storedSponsorState = useContentContext(
    (v) => v.state[`comment${commentId}`]?.aiEnergySponsor
  );

  const sponsorState = normalizeAiEnergySponsorState(storedSponsorState);
  // The content context is memory only, so a reload — or anyone else's browser
  // — starts with no local phase. The placeholder itself carries the server's
  // in-flight stamp, which is what a client with no local record goes by.
  const sponsoredAt = getAiEnergyPlaceholderSponsoredAt(comment);
  const phase = resolveAiEnergySponsorPhase({ sponsoredAt, sponsorState });
  const statusToken =
    sponsorState.statusToken || getAiEnergyPlaceholderStatusToken(comment);
  const sponsorStateRef = useRef<AiEnergySponsorState>(sponsorState);
  sponsorStateRef.current = sponsorState;
  const sponsoredAtRef = useRef(sponsoredAt);
  sponsoredAtRef.current = sponsoredAt;

  // The status endpoint requires auth, so signed-out viewers just show the
  // in-flight state the placeholder itself carries rather than retrying a
  // request they can never complete.
  useEffect(() => {
    if (!commentId || !userId || !isAiEnergySponsorPollPhase(phase)) return;
    let canceled = false;
    let revalidateTimer: number | undefined;
    void revalidateSponsorStatus();

    return () => {
      canceled = true;
      if (revalidateTimer) {
        window.clearTimeout(revalidateTimer);
      }
    };

    function scheduleRevalidation() {
      revalidateTimer = window.setTimeout(() => {
        void revalidateSponsorStatus();
      }, AI_ENERGY_SPONSOR_REVALIDATE_DELAY_MS);
    }

    async function revalidateSponsorStatus() {
      try {
        const result = await loadAiEnergyCommentReplySponsorStatus({
          placeholderCommentId: commentId,
          statusToken
        });
        if (canceled) return;
        if (result?.status === 'retryable') {
          setSponsorPhase(phase === 'checkingExisting' ? 'finished' : 'idle');
          return;
        }
        if (result?.status === 'replaced') {
          if (result.comment) {
            onEditContent({
              contentType: 'comment',
              contentId: commentId,
              data: result.comment
            });
          }
          setSponsorPhase('finished');
          return;
        }
        if (phase === 'checkingExisting') {
          setSponsorPhase('finished');
          return;
        }
        scheduleRevalidation();
      } catch (error: any) {
        if (canceled) return;
        if (error?.status === 404) {
          setSponsorPhase('finished');
          return;
        }
        if (phase === 'checkingExisting') {
          setSponsorPhase('finished');
          return;
        }
        scheduleRevalidation();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commentId, phase, statusToken, userId]);

  return {
    message: sponsorState.message,
    phase,
    sponsor: handleSponsorReply
  };

  function updateSponsorState(patch: Partial<AiEnergySponsorState>) {
    if (!commentId) return;
    onSetContentState({
      contentId: commentId,
      contentType: 'comment',
      newState: {
        aiEnergySponsor: {
          ...sponsorStateRef.current,
          // Settle the server stamp on every write. Without this a poll that
          // hands the placeholder back to 'idle' would be re-derived as
          // 'replying' on the next render and poll forever.
          sponsoredAt: Math.max(
            sponsoredAtRef.current,
            sponsorStateRef.current.sponsoredAt
          ),
          ...patch
        }
      }
    });
  }

  function setSponsorPhase(nextPhase: AiEnergySponsorPhase) {
    updateSponsorState({ phase: nextPhase });
  }

  async function handleSponsorReply() {
    if (!commentId || phase !== 'idle') return;
    if (!userId) {
      updateSponsorState({ message: 'Sign in to sponsor this reply.' });
      return;
    }
    updateSponsorState({ message: '', phase: 'sponsoring' });
    try {
      const result = await sponsorAiEnergyCommentReply({
        placeholderCommentId: commentId
      });
      if (result?.aiUsagePolicy) {
        onUpdateTodayStats({
          newStats: {
            aiUsagePolicy: result.aiUsagePolicy
          }
        });
      }
      if (
        result?.status === 'accepted' ||
        result?.status === 'processing' ||
        result?.status === 'completed'
      ) {
        updateSponsorState({
          phase: 'replying',
          ...(result?.statusToken ? { statusToken: result.statusToken } : {})
        });
        return;
      }
      if (result?.status === 'already_generated') {
        updateSponsorState({
          phase: 'checkingExisting',
          ...(result?.statusToken ? { statusToken: result.statusToken } : {})
        });
        return;
      }
      updateSponsorState({
        phase: 'finished',
        ...(result?.statusToken ? { statusToken: result.statusToken } : {})
      });
    } catch (error: any) {
      updateSponsorState({
        message: error?.message || 'Unable to sponsor this reply.',
        phase: 'idle'
      });
      if (error?.aiUsagePolicy) {
        onUpdateTodayStats({
          newStats: {
            aiUsagePolicy: error.aiUsagePolicy
          }
        });
      }
    }
  }
}
