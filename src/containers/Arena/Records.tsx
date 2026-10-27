import React, { useEffect, useState } from 'react';
import { css, cx } from '@emotion/css';
import Icon from '~/components/Icon';
import ProfilePic from '~/components/ProfilePic';
import { useAppContext } from '~/contexts';
import { mobileMaxWidth } from '~/constants/css';
import { arenaMediaURL } from './media';
import { ARENA } from './theme';
import BoardVisibility from './BoardVisibility';
import type { ArenaExamSummary } from './types';

// Boss Records (Mikey 10-24, design: reports/Arena leaderboard and
// challenges.md): the best first-try battles on one boss, by length and mode,
// this week / this season / all time, and by grade band, so the strongest
// kids get a stage and a kid can hold a narrow record without being the best
// at everything. Top 10 and you; Hide me shows "Hidden hunter".
interface RecordsView {
  total: number;
  // essay or spoken answers: the scores include AI-estimated marks
  aiMarked?: boolean;
  myRank: number | null;
  rows: {
    rank: number;
    raw: number;
    max: number;
    seconds: number;
    me: boolean;
    user: { id: number; username: string; profilePicUrl: string | null } | null;
  }[];
}

const LENGTH: Record<string, string> = {
  short: 'Short',
  medium: 'Medium',
  full: 'Full exam'
};
const MODES = [
  ['easy', 'Easy'],
  ['normal', 'Normal'],
  ['hard', 'Hard']
] as const;
const PERIODS = [
  ['week', 'This week'],
  ['season', 'This season'],
  ['all', 'All time']
] as const;
// grade bands (Mikey 10-24): 초등 / 중1–2 / 중3–고1 / 고2–3
const BANDS = [
  ['', 'All'],
  ['elementary', '초등'],
  ['m12', '중1–2'],
  ['m3h1', '중3–고1'],
  ['h23', '고2–3']
] as const;

export default function Records({ exam }: { exam: ArenaExamSummary }) {
  const loadArenaRecords = useAppContext(
    (v) => v.requestHelpers.loadArenaRecords
  );
  const [length, setLength] = useState(
    exam.lengths[exam.lengths.length - 1]?.length || 'full'
  );
  const [difficulty, setDifficulty] = useState('normal');
  const [period, setPeriod] = useState('week');
  const [band, setBand] = useState('');
  const [view, setView] = useState<RecordsView | null>(null);

  useEffect(() => {
    let alive = true;
    setView(null);
    loadArenaRecords({ examKey: exam.key, length, difficulty, period, band })
      .then((data: RecordsView) => alive && setView(data))
      .catch(() => alive && setView({ total: 0, myRank: null, rows: [] }));
    return () => {
      alive = false;
    };
    // Request helpers are provided by the application context.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam.key, length, difficulty, period, band]);

  return (
    <section className={cardCls}>
      <header className={headCls}>
        <img
          className={eraserCls}
          src={arenaMediaURL(`img/bosses/${exam.key}.jpg`)}
          alt={exam.name}
        />
        <div className={headTextCls}>
          <span className={codeCls}>
            BOSS {exam.code}
            {exam.codeLabel ? ` · ${exam.codeLabel}` : ''}
          </span>
          <strong>Boss Records</strong>
          <span>{exam.name} · best first tries</span>
        </div>
      </header>

      <div className={filtersCls}>
        <Chips
          value={length}
          onChange={setLength}
          options={exam.lengths.map(
            (l) => [l.length, LENGTH[l.length]] as const
          )}
        />
        <Chips value={difficulty} onChange={setDifficulty} options={MODES} />
        <Chips value={period} onChange={setPeriod} options={PERIODS} />
        <Chips value={band} onChange={setBand} options={BANDS} />
      </div>

      {!view ? (
        <p className={noteCls}>
          <Icon icon="spinner" pulse /> Loading records
        </p>
      ) : view.rows.length === 0 ? (
        <p className={noteCls}>No records here yet. The first win sets it.</p>
      ) : (
        <ol className={rowsCls}>
          {view.aiMarked && (
            <li className={noteCls}>
              Scores include AI-estimated marks for essays and spoken answers.
            </li>
          )}
          {view.rows.map((row, i) => (
            <React.Fragment key={`${row.rank}-${row.user?.id || i}`}>
              {i > 0 && row.rank - view.rows[i - 1].rank > 1 && (
                <li className={gapCls}>⋯</li>
              )}
              <li className={cx(rowCls, row.me && meCls)}>
                <span
                  className={cx(rankCls, row.rank <= 3 && PODIUM[row.rank - 1])}
                >
                  {row.rank}
                </span>
                <span className={picCls}>
                  {row.user ? (
                    <ProfilePic
                      style={{ width: '100%' }}
                      userId={row.user.id}
                      profilePicUrl={row.user.profilePicUrl || ''}
                    />
                  ) : (
                    <span className={hiddenPicCls}>
                      <Icon icon="user-secret" />
                    </span>
                  )}
                </span>
                <span className={nameCls}>
                  {row.user ? row.user.username || 'Hunter' : 'Hidden hunter'}
                  {row.me && ' (you)'}
                </span>
                <span className={pointsCls}>
                  {row.raw} / {row.max}
                  <small> · {clock(row.seconds)}</small>
                </span>
              </li>
            </React.Fragment>
          ))}
        </ol>
      )}
      <BoardVisibility />
    </section>
  );
}

function Chips<T extends string>({
  value,
  onChange,
  options
}: {
  value: T;
  onChange: (value: T) => void;
  options: readonly (readonly [T, string])[];
}) {
  return (
    <div className={chipsCls} role="radiogroup">
      {options.map(([key, label]) => (
        <button
          key={key || 'all'}
          type="button"
          role="radio"
          aria-checked={value === key}
          className={cx(chipCls, value === key && chipOnCls)}
          onClick={() => onChange(key)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function clock(seconds: number) {
  const m = Math.floor(seconds / 60);
  return `${m}:${String(seconds % 60).padStart(2, '0')}`;
}

const cardCls = css`
  width: 100%;
  max-width: 72rem;
  margin: 0 auto;
  background: ${ARENA.paper};
  color: ${ARENA.ink};
  border: 3px solid ${ARENA.line};
  border-radius: 12px;
  box-shadow: 4px 4px 0 ${ARENA.line};
  overflow: hidden;
`;

const headCls = css`
  display: flex;
  align-items: center;
  gap: 1.6rem;
  padding: 1.2rem 1.6rem;
  background: ${ARENA.ink};
  color: #fff;
  border-bottom: 3px solid ${ARENA.line};
`;

const eraserCls = css`
  height: 9rem;
  aspect-ratio: 3 / 4;
  object-fit: cover;
  border: 2px solid #fff;
  border-radius: 4px;
  transform: rotate(-4deg);
`;

const headTextCls = css`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  strong {
    font-size: 2rem;
    font-weight: 900;
  }
  span {
    font-size: 1.3rem;
  }
`;

const codeCls = css`
  align-self: flex-start;
  padding: 0.1rem 0.6rem;
  border-radius: 4px;
  background: #fff;
  color: ${ARENA.ink};
  font-size: 1.1rem !important;
  font-weight: 900;
  letter-spacing: 0.06em;
`;

const filtersCls = css`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 1.2rem 1.6rem;
  border-bottom: 2px dashed ${ARENA.inkSoft};
  @media (max-width: ${mobileMaxWidth}) {
    padding: 1rem;
  }
`;

const chipsCls = css`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const chipCls = css`
  padding: 0.35rem 0.9rem;
  border: 2px solid ${ARENA.line};
  border-radius: 999px;
  background: ${ARENA.paper};
  color: ${ARENA.ink};
  font-size: 1.25rem;
  font-weight: 800;
  cursor: pointer;
`;

const chipOnCls = css`
  background: ${ARENA.ink};
  color: #fff;
`;

const noteCls = css`
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  padding: 2.4rem 1.6rem;
  font-size: 1.4rem;
  color: ${ARENA.inkSoft};
`;

const rowsCls = css`
  list-style: none;
  margin: 0;
  padding: 0.8rem 1.2rem 1.4rem;
`;

const rowCls = css`
  display: grid;
  grid-template-columns: 3rem 3rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.9rem;
  padding: 0.5rem 0.6rem;
  border-radius: 8px;
`;

const meCls = css`
  background: #fff1b8;
  box-shadow: inset 0 0 0 2px ${ARENA.line};
  font-weight: 800;
`;

const rankCls = css`
  width: 2.8rem;
  height: 2.8rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 2px solid ${ARENA.line};
  border-radius: 50%;
  background: #fff;
  font-size: 1.25rem;
  font-weight: 900;
`;

const PODIUM = ['#ffe08a', '#e6e9ef', '#f6c9a4'].map(
  (color) => css`
    background: ${color};
  `
);

const picCls = css`
  width: 3rem;
  display: inline-flex;
`;

const hiddenPicCls = css`
  width: 3rem;
  height: 3rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: ${ARENA.background};
  color: ${ARENA.inkSoft};
`;

const nameCls = css`
  min-width: 0;
  font-size: 1.45rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const pointsCls = css`
  font-size: 1.45rem;
  font-weight: 900;
  white-space: nowrap;
  small {
    font-size: 1.15rem;
    color: ${ARENA.inkSoft};
  }
`;

const gapCls = css`
  text-align: center;
  color: ${ARENA.inkSoft};
  font-weight: 900;
  letter-spacing: 0.2em;
`;
