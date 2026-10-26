import React, { useEffect, useState } from 'react';
import { css, cx } from '@emotion/css';
import Icon from '~/components/Icon';
import { useAppContext } from '~/contexts';
import { mobileMaxWidth } from '~/constants/css';
import { ARENA } from './theme';
import { arenaMediaURL } from './media';
import { BOSSES } from './bosses';
import League from './League';
import Records from './Records';
import CoverPage from './CoverPage';
import ArenaRewards from './Rewards';
import Rising from './Rising';
import { TodayArenaGoals } from './AIStory/Game/ArenaGoals';
import AskAgentButton from '~/components/Buttons/AskAgentButton';
import type { ArenaDifficulty, ArenaExamSummary, ArenaState } from './types';

// Arena: real battles only. Exam and boss names use their real Korean
// terms so a parent watching recognizes the exam (Mikey 10-24: an exception
// to the English-only UI rule); English sits beside them. Boss cards live
// in bosses.ts.

const MODE_LABEL: Record<ArenaDifficulty, string> = {
  easy: 'Easy',
  normal: 'Normal',
  hard: 'Hard'
};

const LENGTH_LABEL: Record<string, string> = {
  short: 'Short',
  medium: 'Medium',
  full: 'Full exam'
};

export default function Battles({
  onStart,
  recordsKey = '',
  onOpenRecords
}: {
  onStart: (battleId: number) => void;
  // Boss Records for this exam key, in place of the boss list
  recordsKey?: string;
  onOpenRecords: (examKey: string | null) => void;
}) {
  const loadArenaState = useAppContext((v) => v.requestHelpers.loadArenaState);
  const startArenaBattle = useAppContext(
    (v) => v.requestHelpers.startArenaBattle
  );
  const [state, setState] = useState<ArenaState | null>(null);
  const [error, setError] = useState('');
  const [reviewBattleId, setReviewBattleId] = useState(0);
  const [starting, setStarting] = useState('');
  // the booklet cover, read before the clock starts
  const [cover, setCover] = useState<{
    examKey: string;
    length: 'short' | 'medium' | 'full';
  } | null>(null);
  const coverExam = cover
    ? state?.exams.find((exam) => exam.key === cover.examKey)
    : null;
  // each boss's chosen mode; Normal (the real exam) unless picked
  const [modes, setModes] = useState<Record<string, ArenaDifficulty>>({});
  const openBattle = (state?.recent || []).find(
    (battle) => battle.status === 'open' && battle.mode === 'battle'
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await loadArenaState();
        if (!cancelled) setState(data);
      } catch {
        if (!cancelled)
          setError('The Arena could not be loaded. Please try again.');
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recordsExam = recordsKey
    ? state?.exams.find((exam) => exam.key === recordsKey)
    : null;
  if (recordsExam) {
    return (
      <div className={wrapCls}>
        <button
          type="button"
          className={recordsBackCls}
          onClick={() => onOpenRecords(null)}
        >
          <Icon icon="arrow-left" /> All bosses
        </button>
        <Records exam={recordsExam} />
      </div>
    );
  }

  return (
    <div className={wrapCls}>
      {/* Zero or Ciel, to go through the Arena together (Mikey 10-25) */}
      <div className={askBarCls}>
        <AskAgentButton
          label="Help me here"
          context={{
            kind: 'page',
            label: 'Arena battles',
            path: '/arena?mode=arena',
            excerpt: 'Arena: the bosses (real mock exams) by stage, modes and lengths, the Weekly League, Rising and Boss Records.'
          }}
        />
      </div>
      <div style={{ marginBottom: '1.8rem' }}>
        <TodayArenaGoals />
      </div>
      <League />
      <Rising />
      <p className={introCls}>
        Each boss is a real exam, with its real time limits and grading.
        {state
          ? ` Paid battles today: ${state.paidBattlesToday} of ${state.paidBattlesPerDay}.`
          : ''}
      </p>
      {error && <p className={errorCls}>{error}</p>}
      {reviewBattleId > 0 && (
        <p className={introCls}>
          You have already taken this paper.{' '}
          <button type="button" className={recordsBackCls} onClick={() => onStart(reviewBattleId)}>
            Review your answers
          </button>
        </p>
      )}
      {openBattle && (
        <button
          type="button"
          className={resumeCls}
          onClick={() => onStart(openBattle.id)}
        >
          You have a battle in progress:{' '}
          {state?.exams.find((e) => e.key === openBattle.examKey)?.name ||
            openBattle.examKey}
          . Resume it
        </button>
      )}
      {ladder(state?.exams || []).map((stage) => (
        <section key={stage.title} className={stageCls}>
          <h3 className={stageTitleCls}>{stage.title}</h3>
          <div className={gridCls}>
            {stage.exams.map((exam) => {
              const boss = BOSSES[exam.key];
              return (
                <div key={exam.key} className={cardCls}>
                  <div
                    className={faceCls}
                    style={{ background: boss?.color || ARENA.sky }}
                  >
                    {boss ? (
                      <>
                        <img
                          className={eraserCls}
                          src={arenaMediaURL(`img/bosses/${exam.key}.jpg`)}
                          alt={boss.name}
                        />
                        <span className={nameEnCls}>{boss.nameEn}</span>
                      </>
                    ) : (
                      <span className={nameCls}>{exam.name}</span>
                    )}
                  </div>
                  <div className={bodyCls}>
                    <div className={codeRowCls}>
                      <span className={codeCls}>
                        BOSS {exam.code}
                        {exam.codeLabel ? ` · ${exam.codeLabel}` : ''}
                      </span>
                      <button
                        type="button"
                        className={recordsLinkCls}
                        onClick={() => onOpenRecords(exam.key)}
                      >
                        <Icon icon="trophy" /> Records
                      </button>
                    </div>
                    <strong>
                      {exam.name}{exam.nameEn !== exam.name && <> <small>{exam.nameEn}</small></>}
                    </strong>
                    <div
                      className={modesCls}
                      role="radiogroup"
                      aria-label="Mode"
                    >
                      {exam.difficulties.map(({ difficulty, ready, slain }) => {
                        const on = (modes[exam.key] || 'normal') === difficulty;
                        return (
                          <button
                            key={difficulty}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            title={
                              slain
                                ? `Boss slain on ${MODE_LABEL[difficulty]}`
                                : ready
                                  ? undefined
                                  : 'Still training: no questions yet'
                            }
                            className={cx(
                              modeCls,
                              on && modeOnCls,
                              !ready && modeIdleCls
                            )}
                            onClick={() =>
                              setModes((prev) => ({
                                ...prev,
                                [exam.key]: difficulty
                              }))
                            }
                          >
                            {MODE_LABEL[difficulty]}
                            {slain && <span className={slainCls}> ★</span>}
                          </button>
                        );
                      })}
                    </div>
                    <div className={lengthsCls}>
                      {exam.lengths.map((option) => {
                        const key = `${exam.key}:${option.length}`;
                        return (
                          <button
                            key={option.length}
                            type="button"
                            className={lengthCls}
                            disabled={!!starting}
                            onClick={() =>
                              setCover({
                                examKey: exam.key,
                                length: option.length
                              })
                            }
                          >
                            <b>
                              {starting === key
                                ? 'Starting…'
                                : LENGTH_LABEL[option.length]}
                            </b>
                            <span>
                              {option.items} questions · {option.minutes} min
                            </span>
                            {option.rewards?.[modes[exam.key] || 'normal'] && (
                              <ArenaRewards
                                {...option.rewards[modes[exam.key] || 'normal']}
                                label="Up to"
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
      {cover && coverExam && (
        <CoverPage
          exam={coverExam}
          length={cover.length}
          difficulty={modes[cover.examKey] || 'normal'}
          starting={starting === `${cover.examKey}:${cover.length}`}
          onStart={() => handleStart(cover.examKey, cover.length)}
          onCancel={() => setCover(null)}
        />
      )}
    </div>
  );

  async function handleStart(
    examKey: string,
    length: 'short' | 'medium' | 'full'
  ) {
    setStarting(`${examKey}:${length}`);
    setError('');
    setReviewBattleId(0);
    try {
      const data = await startArenaBattle({
        examKey,
        length,
        difficulty: modes[examKey] || 'normal'
      });
      setCover(null);
      if (data.alreadyTaken && data.battle.status === 'finished') {
        setReviewBattleId(data.battle.id);
      } else {
        onStart(data.battle.id);
      }
    } catch (err: any) {
      setCover(null);
      setError(
        err?.code === 'ARENA_NOT_READY'
          ? 'This boss is still training. Its questions are not ready yet.'
          : 'The battle could not start. Please try again.'
      );
    } finally {
      setStarting('');
    }
  }
}

const wrapCls = css`
  max-width: 1100px;
  margin: 0 auto;
`;

const introCls = css`
  margin: 0 0 1.6rem;
  text-align: center;
  font-size: 1.5rem;
  color: ${ARENA.inkSoft};
`;

const errorCls = css`
  text-align: center;
  color: ${ARENA.accent};
  font-weight: 700;
`;

const gridCls = css`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.6rem;
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
  }
`;

const cardCls = css`
  border: 3px solid ${ARENA.line};
  border-radius: 12px;
  overflow: hidden;
  background: ${ARENA.paper};
  box-shadow: 4px 4px 0 ${ARENA.line};
`;

const faceCls = css`
  height: 21rem;
  display: flex;
  gap: 1.4rem;
  align-items: center;
  justify-content: center;
  padding: 0 1.2rem;
  border-bottom: 3px solid ${ARENA.line};
`;

// the card as a little eraser block: tilted, with a hard drop shadow
const eraserCls = css`
  height: 17.5rem;
  aspect-ratio: 3 / 4;
  object-fit: cover;
  border: 2px solid ${ARENA.line};
  border-radius: 4px;
  box-shadow: 4px 5px 0 ${ARENA.line};
  transform: rotate(-4deg);
  background: #fff;
`;

const nameCls = css`
  color: #fff;
  font-size: 2.4rem;
  font-weight: 900;
  text-shadow: 2px 2px 0 ${ARENA.line};
`;

const nameEnCls = css`
  max-width: 9rem;
  color: #fff;
  font-size: 1.6rem;
  font-weight: 900;
  line-height: 1.2;
  text-shadow: 2px 2px 0 ${ARENA.line};
`;

const bodyCls = css`
  padding: 1rem 1.2rem 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  strong {
    font-size: 1.6rem;
    small {
      font-size: 1.2rem;
      font-weight: 600;
      color: ${ARENA.inkSoft};
    }
  }
`;

const lengthsCls = css`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;

const lengthCls = css`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.7rem 1rem;
  border: 2px solid ${ARENA.line};
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  font: inherit;
  b {
    font-size: 1.4rem;
  }
  span {
    font-size: 1.2rem;
    color: ${ARENA.inkSoft};
  }
  &:hover:not(:disabled) {
    background: ${ARENA.background};
  }
  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
`;

const resumeCls = css`
  display: block;
  margin: 0 auto 1.6rem;
  padding: 0.9rem 1.6rem;
  border: 3px solid ${ARENA.line};
  border-radius: 10px;
  background: #fff6d6;
  font: inherit;
  font-size: 1.45rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 3px 3px 0 ${ARENA.line};
`;

const codeCls = css`
  align-self: flex-start;
  padding: 0.15rem 0.6rem;
  border: 2px solid ${ARENA.line};
  border-radius: 4px;
  background: ${ARENA.line};
  color: #fff;
  font-size: 1.15rem;
  font-weight: 900;
  letter-spacing: 0.06em;
`;

// Easy / Normal / Hard (Mikey 10-24): Normal is the real exam; Hard is the
// examiners on a bad day. A mode with no questions yet stays pickable but
// faded, and starting it says the boss is still training.
const modesCls = css`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
`;

const modeCls = css`
  padding: 0.45rem 0.4rem;
  border: 2px solid ${ARENA.line};
  border-radius: 8px;
  background: ${ARENA.paper};
  color: ${ARENA.ink};
  font-size: 1.25rem;
  font-weight: 800;
  cursor: pointer;
`;

const modeOnCls = css`
  background: ${ARENA.ink};
  color: #fff;
`;

const modeIdleCls = css`
  border-style: dashed;
  opacity: 0.55;
`;

const codeRowCls = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
`;

const recordsLinkCls = css`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.15rem 0.7rem;
  border: 2px solid ${ARENA.line};
  border-radius: 999px;
  background: #ffe08a;
  color: ${ARENA.ink};
  font-size: 1.15rem;
  font-weight: 900;
  cursor: pointer;
`;

const recordsBackCls = css`
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 1rem;
  border: none;
  background: none;
  color: ${ARENA.inkSoft};
  font-size: 1.4rem;
  font-weight: 800;
  cursor: pointer;
`;

// Boss slayer: a star on every mode of this boss you have won
const slainCls = css`
  color: #e0a100;
`;

// The ladder (Street Fighter's stage order): bosses grouped by codename
// world, 초등 → 중등 → 고등 → certificates → endgame. A display, never a lock:
// any member may take on any boss.
const STAGES: { world: string; title: string }[] = [
  { world: 'E', title: 'Elementary · 초등' },
  { world: 'M', title: 'Middle school · 중등' },
  { world: 'H', title: 'High school · 고등' },
  { world: 'C', title: 'Certificates' },
  { world: 'X', title: 'Endgame' }
];

function ladder(exams: ArenaExamSummary[]) {
  const level = (code: string) => Number(code.match(/^[A-Z](\d+)/)?.[1]) || 0;
  return STAGES.map((stage) => ({
    title: stage.title,
    exams: exams
      .filter((exam) => exam.code.startsWith(stage.world))
      .sort(
        (a, b) => level(a.code) - level(b.code) || a.code.localeCompare(b.code)
      )
  })).filter((stage) => stage.exams.length);
}

const stageCls = css`
  margin-top: 2rem;
`;

const stageTitleCls = css`
  margin: 0 0 1rem;
  font-size: 1.6rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${ARENA.inkSoft};
`;

const askBarCls = css`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;
`;
