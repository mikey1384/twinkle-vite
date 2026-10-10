import React, { useEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
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
import useChallengeReviews from './useChallengeReviews';
import {
  challengeReviewLabel,
  getSavedChallengeReview,
  type SavedChallengeReview
} from './challengeReviews';

type QuestKind = 'stop' | 'fort' | 'castle' | 'nemesis';
export interface QuestMiss {
  runId: number;
  position: number;
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
export default function QuestMisses() {
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

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    void load(null);
    // once, on open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <Loading />;

  return (
    <>
      {items.map((it) => {
        const id = it.challenge?.questionId;
        const review = id ? reviews[id] : undefined;
        const savedReview = getSavedChallengeReview(
          it.challenge?.checked,
          it.challenge?.review
        );
        const world = /^w(\d+)/.exec(it.nodeId)?.[1];
        return (
          <div key={`${it.runId}:${it.position}`} className={itemCls}>
            <div className={metaCls}>
              {[
                it.counter ? 'Counter' : FORMAT_INFO[it.format]?.name,
                KIND_LABEL[it.kind],
                world ? `World ${world}` : null,
                timeSince(it.answeredAt)
              ]
                .filter(Boolean)
                .join(' · ')}
            </div>
            <div className={questionCls}>{it.questionText}</div>
            {it.forgiven && (
              <div className={forgivenCls}>
                {it.kind === 'fort' || it.kind === 'castle'
                  ? 'Free rematch earned'
                  : 'Doesn’t count — the question was at fault'}
              </div>
            )}
            {id == null ? (
              // retired, or reviewed as another wording since
              <div className={metaCls}>
                This question can’t be challenged anymore.
              </div>
            ) : (
              <div className={actionCls}>
                <GameCTAButton
                  arcade
                  icon="exclamation-circle"
                  variant="logoBlue"
                  size="sm"
                  onClick={() => setOpen(it)}
                >
                  {challengeReviewLabel(review, savedReview)}
                </GameCTAButton>
              </div>
            )}
          </div>
        );
      })}
      {error && (
        <div className={emptyCls}>
          {error}
          {!items.length && (
            <div className={moreCls}>
              <NeonButton onClick={() => load(null)}>Try again</NeonButton>
            </div>
          )}
        </div>
      )}
      {next && (
        <div className={moreCls}>
          <NeonButton onClick={() => load(next)}>
            {loadingMore ? 'Loading…' : 'Load more'}
          </NeonButton>
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
    </>
  );

  async function load(before: string | null) {
    if (before && loadingMore) return;
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
