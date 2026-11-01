import React, { useState } from 'react';
import { css, cx } from '@emotion/css';
import Icon from '~/components/Icon';
import { useAppContext } from '~/contexts';
import { mobileMaxWidth } from '~/constants/css';
import { gradeMark } from '~/components/ArenaChallengePanel';
import { arenaMediaURL } from './media';
import { ARENA } from './theme';
import { typeLabel } from './typeLabels';
import type { ArenaTrainPaper } from './types';

// A finished paper on Train's shelf (Mikey 11-01: taken papers stay useful,
// never paid twice). A cleared paper is a trophy: its stamp (수우미양가, or
// Perfect), the best rematch that beat the first attempt, mistakes fixed n/m,
// and its review, deck, drills and sharing. Any paper with misses offers a
// misses-only re-sit; a cleared one opens a rematch about two weeks on.
const LENGTH: Record<string, string> = { short: 'Short', medium: 'Medium', full: 'Full exam' };
const MODE: Record<string, string> = { easy: 'Easy', normal: 'Normal', hard: 'Hard' };

export default function TrophyCard({
  paper,
  onReview,
  onOpenDeck,
  onDrill,
  onOpenPractice,
  onOpenChallenge
}: {
  paper: ArenaTrainPaper;
  onReview: (battleId: number) => void;
  onOpenDeck: () => void;
  onDrill: (examKey: string, types: string[]) => void;
  onOpenPractice: (runId: number) => void;
  onOpenChallenge: (challengeId: number) => void;
}) {
  const startArenaPractice = useAppContext((v) => v.requestHelpers.startArenaPractice);
  const shareArenaBattle = useAppContext((v) => v.requestHelpers.shareArenaBattle);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [challengeId, setChallengeId] = useState(paper.share?.challengeId || 0);
  const mark = gradeMark(paper.raw, paper.max);
  const { resit, rematch } = paper;
  const left = resit ? Math.max(0, resit.misses - resit.fixed) : 0;
  const date = new Date(paper.finishedAt * 1000).toLocaleDateString();

  return (
    <article className={cx(cardCls, !paper.cleared && plainCardCls)} aria-label={`${paper.examName} ${paper.cleared ? 'trophy' : 'paper'}`}>
      {paper.cleared && (
        <img className={stampCls} src={arenaMediaURL(`img/stamps/${mark.file}.png`)} alt={`${mark.mark} stamp`} />
      )}
      <div className={headCls}>
        {paper.cleared && (
          <img className={eraserCls} src={arenaMediaURL(`img/bosses/${paper.examKey}.jpg`)} alt="" />
        )}
        <div className={textCls}>
          <span className={codeCls}>
            {paper.code ? `BOSS ${paper.code}${paper.codeLabel ? ` · ${paper.codeLabel}` : ''}` : 'Arena'}
          </span>
          <strong className={titleCls}>{paper.examName}</strong>
          <span className={metaCls}>
            {LENGTH[paper.length] || paper.length} · {MODE[paper.difficulty] || 'Normal'} · {date}
          </span>
          <span className={scoreCls}>
            {paper.raw} <small>/ {paper.max}</small>
            {paper.perfect && <span className={perfectCls}>Perfect</span>}
          </span>
          {paper.aiMarked && (
            <span className={metaCls}>
              {paper.markingPending
                ? 'Marking writing and speaking… this score can still go up'
                : 'Includes AI-estimated writing and speaking marks'}
            </span>
          )}
        </div>
      </div>

      {(resit || rematch?.best || (rematch && !rematch.unlocked)) && (
        <div className={chipsCls}>
          {resit && (
            <span className={chipCls} title="Mistakes fixed in re-sits">
              <Icon icon="check" /> Mistakes fixed {resit.fixed}/{resit.misses}
            </span>
          )}
          {rematch?.best && (
            <span className={cx(chipCls, bestChipCls)} title="Best rematch, against the first attempt on the same questions">
              <Icon icon="arrow-up" /> Best rematch {rematch.best.raw}/{rematch.best.max}
              <small> (first time {rematch.best.then})</small>
            </span>
          )}
          {rematch && !rematch.unlocked && !rematch.open && (
            <span className={cx(chipCls, lockedChipCls)}>
              <Icon icon="lock" /> Rematch opens {new Date(rematch.unlocksAt * 1000).toLocaleDateString()}
            </span>
          )}
        </div>
      )}

      <div className={actionsCls}>
        <button type="button" className={actionCls} onClick={() => onReview(paper.battleId)}>
          <Icon icon="book-open" /> Review
        </button>
        {resit && (resit.open || left > 0) && (
          <button
            type="button"
            className={cx(actionCls, primaryCls)}
            disabled={!!busy}
            onClick={() => (resit.open ? onOpenPractice(resit.open.id) : void start('resit'))}
          >
            <Icon icon={busy === 'resit' ? 'spinner' : 'redo'} pulse={busy === 'resit'} />
            {resit.open ? 'Continue re-sit' : `Re-sit mistakes · ${left}`}
          </button>
        )}
        {rematch?.open && (
          <button type="button" className={cx(actionCls, primaryCls)} onClick={() => onOpenPractice(rematch.open!.id)}>
            <Icon icon="trophy" /> Continue rematch
          </button>
        )}
        {rematch?.unlocked && !rematch.open && (
          <>
            <button type="button" className={cx(actionCls, rematchCls)} disabled={!!busy} onClick={() => void start('rematch', false)}>
              <Icon icon={busy === 'rematch' ? 'spinner' : 'redo'} pulse={busy === 'rematch'} /> Rematch · untimed
            </button>
            {rematch.minutes != null && (
              <button type="button" className={cx(actionCls, rematchCls)} disabled={!!busy} onClick={() => void start('rematch', true)}>
                <Icon icon={busy === 'timed' ? 'spinner' : 'clock'} pulse={busy === 'timed'} /> Rematch · {rematch.minutes} min
              </button>
            )}
          </>
        )}
        {resit && (
          <button type="button" className={actionCls} onClick={onOpenDeck}>
            <Icon icon="layer-group" /> Deck{paper.deckOpen ? ` · ${paper.deckOpen}` : ''}
          </button>
        )}
        {paper.weakTypes.length > 0 && (
          <button
            type="button"
            className={actionCls}
            title={`Drill ${paper.weakTypes.map(typeLabel).join(', ')}`}
            onClick={() => onDrill(paper.examKey, paper.weakTypes)}
          >
            <Icon icon="chart-line" /> Drill {typeLabel(paper.weakTypes[0])}
            {paper.weakTypes.length > 1 ? ` +${paper.weakTypes.length - 1}` : ''}
          </button>
        )}
        {paper.share && (
          <button
            type="button"
            className={actionCls}
            disabled={busy === 'share'}
            onClick={() => (challengeId ? onOpenChallenge(challengeId) : void share())}
          >
            <Icon icon={busy === 'share' ? 'spinner' : 'share'} pulse={busy === 'share'} />
            {challengeId ? 'See challenge' : 'Share as a challenge'}
          </button>
        )}
      </div>
      {rematch?.unlocked && !rematch.open && (
        <p className={hintCls}>A rematch is the whole paper again, to see your progress since {date}.</p>
      )}
      {error && <p className={errorCls} role="alert">{error}</p>}
    </article>
  );

  async function start(kind: 'resit' | 'rematch', timed = false) {
    setBusy(kind === 'rematch' && timed ? 'timed' : kind);
    setError('');
    try {
      const run = await startArenaPractice({ battleId: paper.battleId, kind, timed });
      if (run?.practice?.id) onOpenPractice(run.practice.id);
    } catch (err: any) {
      setError(err?.message || 'That could not start. Please try again.');
    } finally {
      setBusy('');
    }
  }

  async function share() {
    setBusy('share');
    setError('');
    try {
      const { challengeId: id } = await shareArenaBattle(paper.battleId);
      if (id) setChallengeId(id);
    } catch (err: any) {
      setError(err?.message || 'Sharing did not work. Please try again.');
    } finally {
      setBusy('');
    }
  }
}

const cardCls = css`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.4rem 1.6rem;
  background: ${ARENA.paper};
  border: 3px solid ${ARENA.line};
  border-radius: 12px;
  box-shadow: 4px 4px 0 ${ARENA.line};
  @media (max-width: ${mobileMaxWidth}) {
    padding: 1.2rem;
    gap: 0.9rem;
  }
`;

// a paper not cleared yet: the same row, quieter, no trophy
const plainCardCls = css`
  box-shadow: none;
  border-width: 2px;
  padding: 1rem 1.4rem;
`;

const headCls = css`
  display: flex;
  align-items: center;
  gap: 1.4rem;
  min-width: 0;
  padding-right: 6rem;
  @media (max-width: ${mobileMaxWidth}) {
    gap: 1rem;
    padding-right: 4.6rem;
  }
`;

const eraserCls = css`
  height: 9rem;
  aspect-ratio: 3 / 4;
  object-fit: cover;
  flex: none;
  border: 2px solid ${ARENA.line};
  border-radius: 4px;
  box-shadow: 3px 3px 0 ${ARENA.line};
  transform: rotate(-4deg);
  background: ${ARENA.background};
  @media (max-width: ${mobileMaxWidth}) {
    height: 7.4rem;
  }
`;

// stamped in the corner, a little crooked like a real one
const stampCls = css`
  position: absolute;
  top: 0.8rem;
  right: 1rem;
  width: 6rem;
  height: 6rem;
  transform: rotate(-12deg);
  pointer-events: none;
  @media (max-width: ${mobileMaxWidth}) {
    width: 4.8rem;
    height: 4.8rem;
    right: 0.6rem;
  }
`;

const textCls = css`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
`;

const codeCls = css`
  font-size: 1.1rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  color: ${ARENA.accent};
`;

const titleCls = css`
  font-size: 1.8rem;
  font-weight: 900;
  line-height: 1.25;
  overflow-wrap: anywhere;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.6rem;
  }
`;

const metaCls = css`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${ARENA.inkSoft};
`;

const scoreCls = css`
  display: inline-flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.2rem;
  font-size: 2.2rem;
  font-weight: 900;
  small {
    font-size: 1.4rem;
    color: ${ARENA.inkSoft};
  }
`;

const perfectCls = css`
  align-self: center;
  margin-left: 0.4rem;
  padding: 0.15rem 0.7rem;
  border: 2px solid ${ARENA.accent};
  border-radius: 4px;
  color: ${ARENA.accent};
  font-size: 1.1rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  transform: rotate(-3deg);
`;

const chipsCls = css`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
`;

const chipCls = css`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.9rem;
  border: 2px solid ${ARENA.line};
  border-radius: 999px;
  background: #fff;
  font-size: 1.25rem;
  font-weight: 800;
  small {
    font-weight: 600;
    color: ${ARENA.inkSoft};
  }
`;

const bestChipCls = css`
  background: #f2c14e;
`;

const lockedChipCls = css`
  border-style: dashed;
  color: ${ARENA.inkSoft};
`;

const actionsCls = css`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  @media (max-width: ${mobileMaxWidth}) {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
`;

const actionCls = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 3.6rem;
  padding: 0.5rem 1.1rem;
  border: 2px solid ${ARENA.line};
  border-radius: 8px;
  background: #fff;
  color: ${ARENA.ink};
  font: inherit;
  font-size: 1.3rem;
  font-weight: 800;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  &:hover:not(:disabled) {
    transform: translate(-1px, -1px);
  }
  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
`;

const primaryCls = css`
  background: ${ARENA.train};
  color: #fff;
`;

const rematchCls = css`
  background: ${ARENA.sky};
  color: #fff;
`;

const hintCls = css`
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: ${ARENA.inkSoft};
`;

const errorCls = css`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: ${ARENA.accent};
`;
