import React, { useId, useRef } from 'react';
import { css } from '@emotion/css';
import AIDisabledNotice from '~/components/AIDisabledNotice';
import Modal from '~/components/Modal';
import ModalFooter from '~/components/Modal/Footer';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import StreamingThoughtContent from '~/components/StreamingThoughtContent';
import { useViewContext } from '~/contexts';
import { useAgentScreenState } from '~/helpers/websiteAgentScreenState';
import PixelIcon from '../Quest/PixelIcon';
import {
  BLUE,
  GOLD,
  INK,
  PARCHMENT,
  PIXEL_FONT,
  button,
  frame
} from '../Quest/pixelUi';
import useChallengeReviews from './useChallengeReviews';
import type { SavedChallengeReview } from './challengeReviews';

export default function ChallengeModal({
  isOpen,
  onClose,
  questionId,
  questionText,
  savedReview,
  questKind,
  questRef,
  returnLabel = 'Back to review',
  continueLabel,
  onContinue,
  portalTarget
}: {
  isOpen: boolean;
  portalTarget?: HTMLElement;
  onClose: () => void;
  questionId: number;
  questionText?: string;
  savedReview?: SavedChallengeReview | null;
  questKind?: 'stop' | 'fort' | 'castle' | 'nemesis';
  // where Quest asked it, so the review sees the question as the learner did
  questRef?: { runId: number; position: number };
  returnLabel?: string;
  continueLabel?: string;
  onContinue?: () => void;
}) {
  const aiUnavailable = useViewContext((v) => v.state.aiFeaturesDisabled);
  const { reviews, startReview } = useChallengeReviews();
  const review = reviews[questionId];
  const pending = review?.status === 'pending';
  const completed = review?.status === 'complete' ? review.result : null;
  const previous = !completed
    ? savedReview || (review?.status === 'error' ? review.savedReview : null)
    : null;
  const reviewed = completed || previous;
  const outcome = completed
    ? completed.justified
      ? 'accepted'
      : 'rejected'
    : previous?.outcome;
  const failure = review?.status === 'error' ? review : null;
  const quest = !!questKind;
  const titleId = useId();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const title = reviewed
    ? outcome === 'accepted'
      ? previous
        ? 'Question corrected'
        : 'Good catch!'
      : outcome === 'rejected'
        ? 'The answer checks out'
        : 'Already reviewed'
    : pending
      ? 'Checking the question…'
      : failure
        ? 'No review result yet'
        : aiUnavailable
          ? 'Review unavailable'
          : 'Think this question is wrong?';

  useAgentScreenState(
    'grammarblesChallenge',
    isOpen
      ? {
          questionId,
          aiUnavailable: !!aiUnavailable,
          challenging: pending,
          accepted: !!completed?.justified,
          outcome: reviewed ? outcome || 'reviewed' : review?.status || 'ready',
          explanation: reviewed?.explanation?.slice(0, 1000) || null,
          error: failure?.message.slice(0, 500) || null
        }
      : null
  );

  const primaryLabel = reviewed
    ? continueLabel || returnLabel
    : pending || aiUnavailable || (failure && !failure.canRetry)
      ? returnLabel
      : failure
        ? 'Try review again'
        : 'Start review';
  const primaryAction = reviewed
    ? onContinue || onClose
    : pending || aiUnavailable || (failure && !failure.canRetry)
      ? onClose
      : () => {
          void startReview(questionId, questRef);
        };

  return (
    <Modal
      modalKey="ChallengeModal"
      isOpen={isOpen}
      portalTarget={portalTarget}
      onClose={onClose}
      hasHeader={false}
      showCloseButton={false}
      className={quest ? questModalCls : modalCls}
      bodyPadding={0}
      aria-labelledby={titleId}
      xpActivity
      size="md"
    >
      <div className={contentCls}>
        <div className={headingCls}>
          <div>
            <div className={quest ? questEyebrowCls : eyebrowCls}>
              {quest ? 'QUEST · QUESTION REVIEW' : 'QUESTION REVIEW'}
            </div>
            <h2 id={titleId} className={titleCls}>
              {title}
            </h2>
          </div>
          <button
            className={closeCls}
            aria-label={returnLabel}
            onClick={onClose}
          >
            ×
          </button>
        </div>
        {questionText && (
          <blockquote className={questionCls}>{questionText}</blockquote>
        )}
        <div aria-live="polite" aria-atomic="true">
          {reviewed ? (
            <>
              <div className={outcomeCls}>
                <PixelIcon
                  name={outcome === 'accepted' ? 'flag' : 'check'}
                  scale={3}
                />
                <div>
                  <b>
                    {outcome === 'accepted'
                      ? 'Challenge accepted · question fixed'
                      : outcome === 'rejected'
                        ? 'Challenge rejected · answer confirmed'
                        : 'Already reviewed'}
                  </b>
                  <p>
                    {outcome === 'accepted'
                      ? previous
                        ? 'An earlier challenge found a problem, and the question was corrected.'
                        : 'Thanks for helping improve Grammarbles.'
                      : outcome === 'rejected'
                        ? 'The reviewer found the question and its answer correct. Here’s why.'
                        : 'This question was checked previously. Its saved explanation is below.'}
                  </p>
                </div>
              </div>
              {previous && (
                <p className={smallCls}>
                  Already reviewed questions can’t be challenged again. Reading
                  this explanation uses no AI Energy.
                </p>
              )}
              {completed?.justified &&
              typeof completed.newBalance === 'number' ? (
                <div className={rewardCls}>
                  <PixelIcon name="coin" scale={3} /> 50,000 Coins earned
                </div>
              ) : completed && !completed.justified ? (
                <p className={smallCls}>
                  No Coins awarded. The review used AI Energy.
                </p>
              ) : null}
              <div className={explanationCls}>
                <h3>Reviewer’s explanation</h3>
                <p>
                  {reviewed.explanation ||
                    'No explanation was saved for this earlier review.'}
                </p>
              </div>
              {completed?.justified && questKind && (
                <p className={nextStepCls}>
                  {questKind === 'stop'
                    ? 'In practice, an accepted challenge forgives the miss. Keep going with the corrected question.'
                    : questKind === 'fort' || questKind === 'castle'
                      ? 'An accepted boss challenge earns a free rematch with full rewards. Find it on the map.'
                      : 'The question is fixed for future attempts. Your Nemesis result stays the same.'}
                </p>
              )}
            </>
          ) : pending ? (
            <>
              <div className={outcomeCls}>
                <PixelIcon name="flag" scale={3} />
                <div>
                  <b>Your review is in progress</b>
                  <p>
                    The AI is checking the question and all four answers. This
                    can take a few minutes.
                  </p>
                </div>
              </div>
              <p>
                You can go back while it works. Open <b>View progress</b> on
                this question to return here. Closing this panel won’t cancel
                the review.
              </p>
              <p className={smallCls}>
                Keep Grammarbles open so the result can reach you.
              </p>
            </>
          ) : failure ? (
            <>
              <p role="alert" className={errorCls}>
                {failure.message}
              </p>
              <p>
                We haven’t received a completed review. If the connection
                dropped, it may still be running.
              </p>
              <div className={energyCls}>
                <b>About AI Energy</b>
                <p>
                  AI Energy may already have been used.{' '}
                  {failure.canRetry
                    ? 'Trying again can use more Energy.'
                    : 'Go back and check the question again later.'}
                </p>
              </div>
            </>
          ) : aiUnavailable ? (
            <AIDisabledNotice title="Question review unavailable" />
          ) : (
            <>
              <p>
                Challenge it if you think the question or marked answer needs
                fixing. The AI will check all four choices.
              </p>
              <div className={energyCls}>
                <b>Uses AI Energy</b>
                <p>
                  The review uses Energy even if the answer is correct. The
                  amount depends on how much checking is needed.
                </p>
              </div>
              <div className={rewardCls}>
                <PixelIcon name="coin" scale={3} />
                <span>
                  If a problem is found and fixed, you earn <b>50,000 Coins</b>.
                </span>
              </div>
              <p className={smallCls}>
                This is optional. You can keep playing without challenging.
              </p>
            </>
          )}
        </div>
        {pending && review.status === 'pending' && review.thought && (
          <details className={thoughtCls}>
            <summary>See the review in progress</summary>
            <StreamingThoughtContent
              thoughtContent={review.thought}
              scrollRef={scrollRef}
              isThinkingHard
              label="Reviewing…"
            />
          </details>
        )}
      </div>
      <ModalFooter className={quest ? questFooterCls : footerCls}>
        {!pending &&
          !aiUnavailable &&
          !(failure && !failure.canRetry) &&
          (!completed || onContinue) &&
          (quest ? (
            <button className={secondaryCls} onClick={onClose}>
              {returnLabel}
            </button>
          ) : (
            <GameCTAButton variant="neutral" size="sm" onClick={onClose}>
              {returnLabel}
            </GameCTAButton>
          ))}
        {quest ? (
          <button className={primaryCls} onClick={primaryAction}>
            {primaryLabel}
          </button>
        ) : (
          <GameCTAButton
            variant={completed ? 'success' : 'magenta'}
            size="sm"
            onClick={primaryAction}
          >
            {primaryLabel}
          </GameCTAButton>
        )}
      </ModalFooter>
    </Modal>
  );
}

const modalCls = css`
  width: min(
    60rem,
    calc(100vw - 2rem - env(safe-area-inset-left) - env(safe-area-inset-right))
  );
  max-width: 100%;
  min-height: 0;
  /* Respect both the browser bars and the shared modal's keyboard inset. */
  max-height: min(calc(100% - 2rem), calc(100vh - 2rem));
  max-height: min(
    calc(100% - 2rem),
    calc(100dvh - 2rem - env(safe-area-inset-top) - env(safe-area-inset-bottom))
  );
`;
const questModalCls = css`
  ${modalCls}
  ${frame(PARCHMENT, 3)}
  color: ${INK};
  border-radius: 0;
`;
const contentCls = css`
  width: 100%;
  min-width: 0;
  padding: min(1.8rem, 24px);
  font-size: 1.5rem;
  line-height: 1.55;
  overflow-wrap: anywhere;
  p {
    margin: 0.7rem 0;
  }
  @media (max-width: 480px) {
    padding: min(1.2rem, 16px);
  }
`;
const headingCls = css`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: min(1rem, 12px);
  > div {
    min-width: 0;
  }
`;
const eyebrowCls = css`
  font-size: 1.1rem;
  font-weight: 800;
  color: #68502c;
`;
const questEyebrowCls = css`
  ${eyebrowCls}
  font-family: ${PIXEL_FONT};
  font-size: 1rem;
  line-height: 1.8;
`;
const titleCls = css`
  font-size: 2.2rem;
  line-height: 1.3;
  margin: 0.7rem 0 1.2rem;
`;
const closeCls = css`
  flex: none;
  width: 44px;
  height: 44px;
  border: 2px solid #b59a64;
  background: transparent;
  color: #513d23;
  font-size: 24px;
  cursor: pointer;
`;
const questionCls = css`
  margin: 0 0 1.4rem;
  padding: 1rem 1.2rem;
  border-left: 4px solid #b28c41;
  background: rgba(255, 255, 255, 0.42);
  font-weight: 700;
  line-height: 1.5;
`;
const energyCls = css`
  padding: 1.1rem 1.3rem;
  margin: 1.3rem 0;
  border: 2px solid #bb9550;
  background: #fff2ce;
  color: #573f17;
  p {
    margin-bottom: 0;
  }
`;
const rewardCls = css`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1.4rem 0;
  font-size: 1.5rem;
  color: #654307;
`;
const smallCls = css`
  font-size: 1.3rem;
  color: #665438;
`;
const outcomeCls = css`
  display: flex;
  align-items: flex-start;
  gap: 1.2rem;
  margin: 1.4rem 0 0.6rem;
  img {
    margin-top: 0.4rem;
  }
`;
const explanationCls = css`
  padding: 1.2rem;
  margin-top: 1.4rem;
  border: 1px solid #c5ac7a;
  background: rgba(255, 255, 255, 0.5);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  h3 {
    font-size: 1.4rem;
    margin: 0;
  }
`;
const nextStepCls = css`
  font-weight: 700;
  color: #31553b;
`;
const errorCls = css`
  font-weight: 700;
  color: #8e233d;
`;
const thoughtCls = css`
  margin-top: 1.2rem;
  summary {
    cursor: pointer;
    padding: 1rem 0;
  }
`;
const footerCls = css`
  padding: min(1.2rem, 16px);
  gap: min(1rem, 12px);
  > button {
    min-width: 0;
    max-width: 100%;
    white-space: normal;
  }
`;
const questFooterCls = css`
  ${footerCls}
  background: #ead5a7;
  border-top: 2px solid #cfb271;
  border-radius: 0 !important;
  flex-wrap: wrap;
  align-items: stretch;
  > button {
    flex: 1 1 12rem;
    font-size: 1.1rem;
    overflow-wrap: anywhere;
  }
`;
const primaryCls = css`
  ${button(GOLD, '#8a5200')}
  min-height: 48px;
  margin-bottom: 4px;
  padding: min(0.7rem, 10px) min(1.1rem, 14px);
`;
const secondaryCls = css`
  ${button(BLUE, '#2a5fb0', '#ffffff')}
  min-height: 48px;
  margin-bottom: 4px;
  padding: min(0.7rem, 10px) min(1.1rem, 14px);
`;
