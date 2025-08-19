import React, { useEffect, useMemo, useRef, useState } from 'react';
import NewModal from '~/components/NewModal';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { useAppContext, useKeyContext } from '~/contexts';
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
  const challengeGrammarQuestion = useAppContext(
    (v) => v.requestHelpers.challengeGrammarQuestion
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const userId = useKeyContext((v) => v.myState.userId);
  const twinkleCoins = useKeyContext((v) => v.myState.twinkleCoins);
  const cannotAfford = useMemo(
    () => (typeof twinkleCoins === 'number' ? twinkleCoins < 5000 : true),
    [twinkleCoins]
  );
  const [challenging, setChallenging] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [streamingThought, setStreamingThought] = useState('');
  const thoughtRef = useRef('');
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
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
    <NewModal
      isOpen={isOpen}
      onClose={onClose}
      title={accepted ? 'Challenge Accepted!' : 'Challenge Question'}
      size="md"
      footer={
        accepted ? (
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
              disabled={cannotAfford}
              onClick={handleChallenge}
            >
              Pay 5,000 coins and Challenge
            </GameCTAButton>
          </>
        )
      }
    >
      {accepted ? (
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
          You can challenge this question’s correctness for 5,000 coins. We’ll
          verify that the marked answer is undoubtedly correct and others are
          undoubtedly wrong. If your challenge is justified, we’ll improve the
          question and reward you with 50,000 coins.
        </div>
      )}
    </NewModal>
  );

  async function handleChallenge() {
    if (!questionId) return;
    if (isSubmittingRef.current) return;
    try {
      isSubmittingRef.current = true;
      setChallenging(true);
      const { explanation, newBalance, justified } =
        await challengeGrammarQuestion({
          questionId
        });
      onAfterSuccess({ explanation, newBalance, justified });
      if (typeof newBalance === 'number') {
        onSetUserState({ userId, newState: { twinkleCoins: newBalance } });
      }
      if (justified) {
        setAccepted(true);
      } else {
        onClose();
      }
    } finally {
      setChallenging(false);
      isSubmittingRef.current = false;
    }
  }
}
