import React, { useEffect, useRef, useState } from 'react';
import AIDisabledNotice from '~/components/AIDisabledNotice';
import Modal from '~/components/Modal';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import {
  useAppContext,
  useKeyContext,
  useNotiContext,
  useViewContext
} from '~/contexts';
import { socket } from '~/constants/sockets/api';
import StreamingThoughtContent from '~/components/StreamingThoughtContent';

export default function ChallengeModal({
  isOpen,
  onClose,
  questionId,
  onAfterSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  questionId: number;
  onAfterSuccess: (args: {
    explanation: string;
    newBalance?: number;
    justified: boolean;
  }) => void;
}) {
  const AI_FEATURES_DISABLED = useViewContext(
    (v) => v.state.aiFeaturesDisabled
  );
  const challengeGrammarQuestion = useAppContext(
    (v) => v.requestHelpers.challengeGrammarQuestion
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const onUpdateTodayStats = useNotiContext(
    (v) => v.actions.onUpdateTodayStats
  );
  const userId = useKeyContext((v) => v.myState.userId);
  const [challenging, setChallenging] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [challengeError, setChallengeError] = useState('');
  const [streamingThought, setStreamingThought] = useState('');
  const thoughtRef = useRef('');
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;
    setAccepted(false);
    setChallengeError('');
    setStreamingThought('');
    thoughtRef.current = '';
  }, [isOpen, questionId]);

  useEffect(() => {
    if (AI_FEATURES_DISABLED) return;
    function handleThoughtStream({
      questionId: qid,
      thoughtContent
    }: {
      questionId: number;
      thoughtContent: string;
    }) {
      if (qid === questionId) {
        thoughtRef.current = thoughtContent;
        setStreamingThought(thoughtContent);
      }
    }
    socket.on('grammar_challenge_thought_streamed', handleThoughtStream);
    return () => {
      socket.off('grammar_challenge_thought_streamed', handleThoughtStream);
    };
  });

  return (
    <Modal
      modalKey="ChallengeModal"
      isOpen={isOpen}
      onClose={onClose}
      title={
        AI_FEATURES_DISABLED
          ? 'Challenge Unavailable'
          : accepted
            ? 'Challenge Accepted!'
            : 'Challenge Question'
      }
      size="md"
      footer={
        AI_FEATURES_DISABLED ? (
          <GameCTAButton
            icon="check"
            variant="success"
            size="sm"
            onClick={onClose}
          >
            Close
          </GameCTAButton>
        ) : accepted ? (
          <GameCTAButton
            icon="check"
            variant="success"
            size="sm"
            onClick={onClose}
          >
            Close
          </GameCTAButton>
        ) : (
          <>
            <GameCTAButton
              icon="times"
              variant="neutral"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </GameCTAButton>
            <GameCTAButton
              icon="bolt"
              variant="magenta"
              size="sm"
              loading={challenging}
              onClick={handleChallenge}
            >
              Challenge
            </GameCTAButton>
          </>
        )
      }
    >
      {AI_FEATURES_DISABLED ? (
        <AIDisabledNotice title="Grammarbles Challenge Unavailable" />
      ) : accepted ? (
        <div
          className={css`
            font-size: 1.5rem;
          `}
        >
          Congratulations! Your challenge was accepted and a better version of
          this question has been saved. You earned{' '}
          <b style={{ color: Color.gold() }}>50,000</b> coins.
        </div>
      ) : challenging ? (
        <div
          className={css`
            font-size: 1.5rem;
            width: 100%;
            display: flex;
            justify-content: flex-start;
          `}
        >
          <StreamingThoughtContent
            thoughtContent={streamingThought}
            scrollRef={scrollRef}
            isThinkingHard
          />
        </div>
      ) : (
        <div
          className={css`
            font-size: 1.5rem;
          `}
        >
          You can challenge this question’s correctness. We’ll verify that the
          marked answer is undoubtedly correct and others are undoubtedly wrong.
          If your challenge is justified, we’ll improve the question and reward
          you with 50,000 coins.
          {challengeError ? (
            <div
              className={css`
                color: ${Color.red()};
                font-size: 1.3rem;
                font-weight: bold;
                margin-top: 1.2rem;
              `}
            >
              {challengeError}
            </div>
          ) : null}
        </div>
      )}
    </Modal>
  );

  async function handleChallenge() {
    if (AI_FEATURES_DISABLED) return;
    if (!questionId) return;
    if (isSubmittingRef.current) return;
    try {
      isSubmittingRef.current = true;
      setChallenging(true);
      setChallengeError('');
      const { explanation, newBalance, justified, aiUsagePolicy } =
        await challengeGrammarQuestion({
          questionId
        });
      if (aiUsagePolicy) {
        onUpdateTodayStats({
          newStats: {
            aiUsagePolicy
          }
        });
      }
      onAfterSuccess({ explanation, newBalance, justified });
      if (typeof newBalance === 'number') {
        onSetUserState({ userId, newState: { twinkleCoins: newBalance } });
      }
      if (justified) {
        setAccepted(true);
      } else {
        onClose();
      }
    } catch (error: any) {
      if (error?.aiUsagePolicy) {
        onUpdateTodayStats({
          newStats: {
            aiUsagePolicy: error.aiUsagePolicy
          }
        });
      }
      setChallengeError(
        error?.message || 'Challenge failed. Please try again in a moment.'
      );
    } finally {
      setChallenging(false);
      isSubmittingRef.current = false;
    }
  }
}
