import React, { useState } from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { useAppContext } from '~/contexts';
import { mobileMaxWidth } from '~/constants/css';
import ArenaButton from './ArenaButton';
import { ARENA } from './theme';
import type { ArenaBattle } from './types';

// The top of a submitted Train re-sit or rematch (Mikey 11-01), above the
// same paper with its keys. A re-sit shows what it fixed and what is left; a
// rematch shows then vs. now against the first attempt. Neither pays or
// ranks, so there is no reward line here.
export default function PracticeResult({
  data,
  onOpenPractice,
  onExit
}: {
  data: ArenaBattle;
  onOpenPractice?: (runId: number) => void;
  onExit: () => void;
}) {
  const practice = data.practice!;
  const startArenaPractice = useAppContext((v) => v.requestHelpers.startArenaPractice);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const label = (no: number) => {
    const item = data.items.find((i) => i.no === no);
    return item?.display || String(no);
  };
  const right = data.items.filter((item) => item.correct).length;

  if (practice.kind === 'resit') {
    const misses = practice.misses || 0;
    const fixed = practice.fixed || 0;
    const left = Math.max(0, misses - fixed);
    return (
      <div className={bandCls} role="region" aria-label="Re-sit results" tabIndex={0}>
        <div className={statCls}>
          <span className={labelCls}>This re-sit</span>
          <strong>
            {right} / {data.items.length} right
          </strong>
        </div>
        <div className={statCls}>
          <span className={labelCls}>Mistakes fixed on this paper</span>
          <strong>
            {fixed} / {misses}
          </strong>
          <span className={barCls} aria-hidden="true">
            <span style={{ transform: `scaleX(${misses ? fixed / misses : 0})` }} />
          </span>
        </div>
        {practice.deckReviews > 0 && (
          <p className={noteCls}>
            {practice.deckReviews === 1
              ? '1 of these was due in your missed-question deck, so it counts as today’s review of that card.'
              : `${practice.deckReviews} of these were due in your missed-question deck, so they count as today’s reviews of those cards.`}
          </p>
        )}
        <div className={actionsCls}>
          {left > 0 ? (
            <ArenaButton tone="paper" size="md" loading={starting} onClick={handleResitAgain}>
              <Icon icon="redo" /> Re-sit the {left} left
            </ArenaButton>
          ) : (
            <span className={doneCls}>
              <Icon icon="check" /> Every mistake on this paper is fixed
            </span>
          )}
          <ArenaButton tone="ink" size="md" onClick={onExit}>
            Back to Train
          </ArenaButton>
        </div>
        {error && <p className={noteCls} role="alert">{error}</p>}
      </div>
    );
  }

  const then = practice.then;
  const now = practice.now || { raw: 0, max: then.max };
  const change = Math.round((now.raw - then.raw) * 100) / 100;
  const gained = data.items.filter((item) => item.correct && item.then && !item.then.correct).map((item) => label(item.no));
  const slipped = data.items.filter((item) => !item.correct && item.then?.correct).map((item) => label(item.no));
  const firstDate = new Date(practice.source.finishedAt * 1000).toLocaleDateString();
  return (
    <div className={bandCls} role="region" aria-label="Rematch results" tabIndex={0}>
      <div className={compareCls}>
        <div className={statCls}>
          <span className={labelCls}>Then · {firstDate}</span>
          <strong>
            {then.raw} / {then.max}
          </strong>
        </div>
        <Icon icon="arrow-right" />
        <div className={statCls}>
          <span className={labelCls}>Now{practice.timed ? ' · timed' : ' · untimed'}</span>
          <strong>
            {now.raw} / {now.max}
          </strong>
        </div>
        <span className={changeCls}>
          {change > 0 ? `+${change}` : change < 0 ? `${change}` : 'Same score'}
        </span>
      </div>
      <p className={noteCls}>
        {gained.length ? `Right now, missed then: ${gained.join(', ')}. ` : ''}
        {slipped.length ? `Right then, missed now: ${slipped.join(', ')}. ` : ''}
        {!gained.length && !slipped.length ? 'Every question went the same way as the first time. ' : ''}
        A rematch is for seeing your progress.
        {practice.leftOut > 0 ? ' Writing and speaking tasks are left out, so both scores cover the same questions.' : ''}
      </p>
      <div className={actionsCls}>
        <ArenaButton tone="ink" size="md" onClick={onExit}>
          Back to Train
        </ArenaButton>
      </div>
    </div>
  );

  async function handleResitAgain() {
    setStarting(true);
    setError('');
    try {
      const run = await startArenaPractice({ battleId: practice.sourceBattleId, kind: 'resit' });
      if (run?.practice?.id) onOpenPractice?.(run.practice.id);
    } catch (err: any) {
      setError(err?.message || 'The re-sit could not start. Please try again.');
    } finally {
      setStarting(false);
    }
  }
}

const bandCls = css`
  /* leaves room to read the paper below on short screens (BattleRunner's Result) */
  flex-shrink: 0;
  max-height: 40%;
  overflow-y: auto;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 1.2rem 3rem;
  padding: 1rem 1.2rem;
  background: ${ARENA.train};
  color: #fff;
  border-bottom: 3px solid ${ARENA.line};
  @media (max-width: ${mobileMaxWidth}) {
    gap: 0.8rem 1.6rem;
    padding: 0.8rem;
  }
`;

const statCls = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  strong {
    font-size: 2rem;
    font-weight: 900;
  }
  @media (max-width: ${mobileMaxWidth}) {
    strong {
      font-size: 1.6rem;
    }
  }
`;

const compareCls = css`
  display: flex;
  align-items: center;
  gap: 1.6rem;
  font-size: 1.6rem;
  @media (max-width: ${mobileMaxWidth}) {
    gap: 1rem;
  }
`;

const labelCls = css`
  font-size: 1.1rem;
  font-weight: 800;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const changeCls = css`
  padding: 0.3rem 0.9rem;
  border: 2px solid ${ARENA.line};
  border-radius: 999px;
  background: ${ARENA.paper};
  color: ${ARENA.ink};
  font-size: 1.4rem;
  font-weight: 900;
`;

const barCls = css`
  width: 12rem;
  height: 0.8rem;
  border: 2px solid ${ARENA.line};
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.35);
  overflow: hidden;
  span {
    display: block;
    height: 100%;
    background: #f2c14e;
    transform-origin: left center;
  }
`;

const noteCls = css`
  flex-basis: 100%;
  margin: 0;
  text-align: center;
  font-size: 1.3rem;
  font-weight: 700;
  line-height: 1.45;
`;

const actionsCls = css`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.6rem;
`;

const doneCls = css`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.4rem;
  font-weight: 900;
`;
