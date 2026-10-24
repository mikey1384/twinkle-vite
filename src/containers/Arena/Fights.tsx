import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import { useAppContext } from '~/contexts';
import { mobileMaxWidth } from '~/constants/css';
import { ARENA } from './theme';
import type { ArenaState } from './types';

// Arena: real fights only. Exam and fighter names use their real Korean
// terms so a parent watching recognizes the exam (Mikey 10-24: an exception
// to the English-only UI rule); English sits beside them.
const FIGHTERS: Record<string, { name: string; nameEn: string; color: string }> = {
  'suneung-eng': { name: '수능 감독관', nameEn: 'The CSAT Proctor', color: ARENA.violet },
  'suneung-khist': { name: '한국사 강사', nameEn: 'The History Lecturer', color: ARENA.coral }
};

const LENGTH_LABEL: Record<string, string> = {
  short: 'Short',
  medium: 'Medium',
  full: 'Full exam'
};

export default function Fights({
  onStart
}: {
  onStart: (fightId: number) => void;
}) {
  const loadArenaState = useAppContext((v) => v.requestHelpers.loadArenaState);
  const startArenaFight = useAppContext((v) => v.requestHelpers.startArenaFight);
  const [state, setState] = useState<ArenaState | null>(null);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState('');
  const openFight = (state?.recent || []).find(
    (fight) => fight.status === 'open' && fight.mode === 'fight'
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await loadArenaState();
        if (!cancelled) setState(data);
      } catch {
        if (!cancelled) setError('The Arena could not be loaded. Please try again.');
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={wrapCls}>
      <p className={introCls}>
        Each fighter is a real exam, with its real time limits and grading.
        {state
          ? ` Paid fights today: ${state.paidFightsToday} of ${state.paidFightsPerDay}.`
          : ''}
      </p>
      {error && <p className={errorCls}>{error}</p>}
      {openFight && (
        <button
          type="button"
          className={resumeCls}
          onClick={() => onStart(openFight.id)}
        >
          You have a fight in progress:{' '}
          {state?.exams.find((e) => e.key === openFight.examKey)?.name ||
            openFight.examKey}
          . Resume it
        </button>
      )}
      <div className={gridCls}>
        {(state?.exams || []).map((exam) => {
          const fighter = FIGHTERS[exam.key];
          return (
            <div key={exam.key} className={cardCls}>
              <div
                className={faceCls}
                style={{ background: fighter?.color || ARENA.sky }}
              >
                <span className={nameCls}>{fighter?.name || exam.name}</span>
                <span className={nameEnCls}>{fighter?.nameEn || exam.nameEn}</span>
              </div>
              <div className={bodyCls}>
                <strong>
                  {exam.name} <small>{exam.nameEn}</small>
                </strong>
                <div className={lengthsCls}>
                  {exam.lengths.map((option) => {
                    const key = `${exam.key}:${option.length}`;
                    return (
                      <button
                        key={option.length}
                        type="button"
                        className={lengthCls}
                        disabled={!!starting}
                        onClick={() => handleStart(exam.key, option.length)}
                      >
                        <b>{starting === key ? 'Starting…' : LENGTH_LABEL[option.length]}</b>
                        <span>
                          {option.items} questions · {option.minutes} min
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  async function handleStart(examKey: string, length: 'short' | 'medium' | 'full') {
    setStarting(`${examKey}:${length}`);
    setError('');
    try {
      const data = await startArenaFight({ examKey, length });
      onStart(data.fight.id);
    } catch (err: any) {
      setError(
        err?.code === 'ARENA_NOT_READY'
          ? 'This fighter is still training. Its questions are not ready yet.'
          : 'The fight could not start. Please try again.'
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
  height: 12rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  align-items: center;
  justify-content: center;
  border-bottom: 3px solid ${ARENA.line};
`;

const nameCls = css`
  color: #fff;
  font-size: 2.4rem;
  font-weight: 900;
  text-shadow: 2px 2px 0 ${ARENA.line};
`;

const nameEnCls = css`
  color: #fff;
  font-size: 1.3rem;
  font-weight: 700;
  opacity: 0.9;
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
