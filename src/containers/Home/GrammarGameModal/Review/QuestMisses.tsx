import React, { useEffect, useRef, useState } from 'react';
import { css, cx } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { useAppContext } from '~/contexts';
import { timeSince } from '~/helpers/timeStampHelpers';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import Loading from '~/components/Loading';
import NeonButton from '../ClassicArcade/NeonButton';
import { NEON, READ_FONT, rgba } from '../ClassicArcade/theme';
import { FORMAT_INFO } from '../Quest/FormatQuestion';
import type { QuestFormat } from '../Quest/types';
import ChallengeModal from './ChallengeModal';
import ReportQuestionButton from './ReportQuestionButton';
import {
  INK,
  PARCHMENT,
  challengeButton,
  reviewedButton,
  frame
} from '../Quest/pixelUi';
import useChallengeReviews from './useChallengeReviews';
import {
  challengeReviewLabel,
  isChallengeReviewSettled,
  getSavedChallengeReview,
  type SavedChallengeReview
} from './challengeReviews';

type QuestKind = 'stop' | 'fort' | 'castle' | 'nemesis';
export interface QuestMiss {
  questionId: number;
  questionVersion: number;
  runId: number;
  position: number;
  sourceIndex?: number;
  kind: QuestKind;
  nodeId: string;
  format: QuestFormat;
  counter?: boolean;
  questionText: string;
  answeredAt: number;
  forgiven?: boolean;
  // null: retired, or reviewed as another wording (a challenge says why)
  challenge: {
    questionId: number;
    checked: boolean;
    review?: SavedChallengeReview | null;
  } | null;
}

const KIND_LABEL: Record<QuestKind, string> = {
  stop: 'Practice',
  fort: 'Fort boss',
  castle: 'Castle boss',
  nemesis: 'Nemesis'
};

// Every Grammar Quest miss, newest first (audit 10-11: once a run's result
// screen was gone, its misses could never be challenged). Each opens
// Classic's Challenge with the run and position it was asked at.
export default function QuestMisses({
  look = 'classic'
}: {
  look?: 'classic' | 'quest';
}) {
  const loadMisses = useAppContext(
    (v) => v.requestHelpers.loadGrammarQuestMisses
  );
  const [items, setItems] = useState<QuestMiss[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState<QuestMiss | null>(null);
  const { reviews } = useChallengeReviews();
  const initialized = useRef(false);
  const loadingRef = useRef(false);
  const quest = look === 'quest';

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    void load(null);
    // once, on open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <Loading />;

  return (
    <div className={quest ? questListCls : undefined}>
      {items.map((it) => {
        const id = it.challenge?.questionId;
        const reportId = it.questionId || id;
        const review = id ? reviews[id] : undefined;
        const savedReview = getSavedChallengeReview(
          it.challenge?.checked,
          it.challenge?.review
        );
        const settled = isChallengeReviewSettled(review, savedReview);
        const world = /^w(\d+)/.exec(it.nodeId)?.[1];
        return (
          <article
            key={`${it.runId}:${it.position}:${it.sourceIndex ?? ''}`}
            className={cx(itemCls, quest && questItemCls)}
          >
            <div className={cx(metaCls, 'miss-meta')}>
              {[
                it.counter ? 'Counter' : FORMAT_INFO[it.format]?.name,
                KIND_LABEL[it.kind],
                world ? `World ${world}` : null,
                timeSince(it.answeredAt)
              ]
                .filter(Boolean)
                .join(' · ')}
            </div>
            <div className={cx(questionCls, 'miss-question')}>
              {it.questionText}
            </div>
            {it.forgiven && (
              <div className={cx(forgivenCls, 'miss-forgiven')}>
                {it.kind === 'fort' || it.kind === 'castle'
                  ? 'Free rematch earned'
                  : 'Doesn’t count — the question was at fault'}
              </div>
            )}
            {id == null ? (
              // retired, or reviewed as another wording since
              <div className={cx(metaCls, 'miss-meta')}>
                This question can’t be challenged anymore. You can still report
                a problem to Mikey.
              </div>
            ) : null}
            <div className={actionCls}>
              {/* Open challenges stand out; saved rulings remain readable. */}
              {id != null &&
                (quest ? (
                  <button
                    className={settled ? questReviewedCls : questChallengeCls}
                    onClick={() => setOpen(it)}
                  >
                    {challengeReviewLabel(review, savedReview)}
                  </button>
                ) : (
                  <GameCTAButton
                    arcade
                    icon={settled ? 'check' : 'flag'}
                    variant={settled ? 'neutral' : 'pink'}
                    size="sm"
                    onClick={() => setOpen(it)}
                  >
                    {challengeReviewLabel(review, savedReview)}
                  </GameCTAButton>
                ))}
              {reportId != null && (
                <ReportQuestionButton
                  quest={quest}
                  target={{
                    questionId: reportId,
                    questionVersion: it.questionVersion,
                    runId: it.runId,
                    position: it.position,
                    questionText: it.questionText
                  }}
                />
              )}
            </div>
          </article>
        );
      })}
      {error && (
        <div className={emptyCls}>
          {error}
          {!items.length && (
            <div className={moreCls}>
              {quest ? (
                <button className={questReviewedCls} onClick={() => load(null)}>
                  Try again
                </button>
              ) : (
                <NeonButton onClick={() => load(null)}>Try again</NeonButton>
              )}
            </div>
          )}
        </div>
      )}
      {next && (
        <div className={moreCls}>
          {quest ? (
            <button
              className={questReviewedCls}
              disabled={loadingMore}
              onClick={() => load(next)}
            >
              {loadingMore ? 'Loading…' : 'Load more'}
            </button>
          ) : (
            <NeonButton onClick={() => load(next)}>
              {loadingMore ? 'Loading…' : 'Load more'}
            </NeonButton>
          )}
        </div>
      )}
      {!items.length && !error && (
        <div className={emptyCls}>No Grammar Quest misses yet.</div>
      )}
      {open?.challenge && (
        <ChallengeModal
          isOpen
          onClose={() => setOpen(null)}
          questionId={open.challenge.questionId}
          questionText={open.questionText}
          savedReview={getSavedChallengeReview(
            open.challenge.checked,
            open.challenge.review
          )}
          questKind={open.kind}
          questRef={{ runId: open.runId, position: open.position }}
        />
      )}
    </div>
  );

  async function load(before: string | null) {
    if (loadingRef.current) return;
    loadingRef.current = true;
    if (before) setLoadingMore(true);
    else setLoading(true);
    setError('');
    try {
      const data = await loadMisses({ before, limit: 20 });
      setItems((prev) => [...(before ? prev : []), ...(data?.items || [])]);
      setNext(data?.next || null);
    } catch {
      setError('Could not load your Grammar Quest misses.');
    } finally {
      loadingRef.current = false;
      setLoading(false);
      setLoadingMore(false);
    }
  }
}

const itemCls = css`
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid ${rgba(NEON.violetRgb, 0.35)};
  padding: 1rem 1.3rem;
  margin-bottom: 1rem;
  font-family: ${READ_FONT};
  @media (max-width: ${mobileMaxWidth}) {
    padding: 0.9rem 1rem;
  }
`;
const metaCls = css`
  font-size: 1.2rem;
  color: ${NEON.inkSoft};
`;
const questionCls = css`
  margin: 0.5rem 0 0.6rem;
  font-size: 1.7rem;
  font-weight: 800;
  line-height: 1.35;
  color: ${NEON.ink};
  overflow-wrap: anywhere;
`;
const forgivenCls = css`
  margin-bottom: 0.6rem;
  font-size: 1.3rem;
  font-weight: 700;
  color: ${NEON.green};
`;
const actionCls = css`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1rem;
  justify-content: center;
`;
const moreCls = css`
  display: flex;
  justify-content: center;
  padding: 0.4rem 0 0.8rem;
`;
const emptyCls = css`
  padding: 4rem 1rem;
  text-align: center;
  font-size: 1.6rem;
  font-weight: 700;
  color: ${NEON.inkSoft};
`;
const questListCls = css`
  .miss-meta {
    color: #655139;
  }
  .miss-question {
    color: ${INK};
  }
  .miss-forgiven {
    color: #245c39;
  }
  .${emptyCls} {
    color: #655139;
  }
`;
const questItemCls = css`
  ${frame(PARCHMENT, 1)}
  padding: 1.2rem;
`;
const questChallengeCls = css`
  ${challengeButton()}
  min-height: 44px;
  font-size: 1.2rem;
  padding: 0.5rem 1rem;
`;
const questReviewedCls = css`
  ${reviewedButton()}
  min-height: 44px;
  font-size: 1.2rem;
  padding: 0.5rem 1rem;
`;
