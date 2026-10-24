import React, { useEffect, useState } from 'react';
import { css, cx } from '@emotion/css';
import Icon from '~/components/Icon';
import ProfilePic from '~/components/ProfilePic';
import { useAppContext } from '~/contexts';
import { mobileMaxWidth } from '~/constants/css';
import { ARENA } from './theme';

// Rising (Mikey 10-24, design: reports/Arena leaderboard and challenges.md):
// for the kids who aren't on top yet. Most improved in your league group
// this week ("4등급 → 3등급"), and showing up (5 battle days of 7 makes a
// steady hunter). Never raw standing, never anyone's misses.
interface RisingView {
  inGroup: boolean;
  improved: {
    rank: number;
    me: boolean;
    user: { id: number; username: string; profilePicUrl: string | null } | null;
    exam: string;
    from: string;
    to: string;
    climbed: number;
  }[];
  myDays: number;
  battledToday: boolean;
  steadyDays: number;
  steady: { id: number; username: string; profilePicUrl: string | null }[];
}

export default function Rising() {
  const loadArenaRising = useAppContext(
    (v) => v.requestHelpers.loadArenaRising
  );
  const [view, setView] = useState<RisingView | null>(null);

  useEffect(() => {
    let alive = true;
    loadArenaRising()
      .then((data: RisingView) => alive && setView(data))
      .catch(() => null);
    return () => {
      alive = false;
    };
  }, [loadArenaRising]);

  if (!view) {
    return (
      <section className={boardCls}>
        <p className={noteCls}>
          <Icon icon="spinner" pulse /> Loading Rising
        </p>
      </section>
    );
  }

  return (
    <section className={boardCls}>
      <header className={headCls}>
        <Icon icon="arrow-up" /> Rising this week
      </header>
      <div className={columnsCls}>
        <div className={columnCls}>
          <h4 className={columnHeadCls}>Most improved</h4>
          {view.improved.length ? (
            <ol className={listCls}>
              {view.improved.map((row) => (
                <li key={row.rank} className={cx(rowCls, row.me && meCls)}>
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
                    <small>{row.exam}</small>
                  </span>
                  <span className={climbCls}>
                    {row.climbed > 0 ? `${row.from} → ${row.to}` : 'climbing'}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className={noteCls}>
              {view.inGroup
                ? 'Nobody has climbed yet this week. A battle could put you here.'
                : 'Win a paid battle this week to join a group, then climb here.'}
            </p>
          )}
        </div>
        <div className={columnCls}>
          <h4 className={columnHeadCls}>Showing up</h4>
          <div className={daysCls} aria-label={`${view.myDays} of 7 days`}>
            {Array.from({ length: 7 }, (_, i) => (
              <span
                key={i}
                className={cx(dayCls, i < view.myDays && dayOnCls)}
              />
            ))}
          </div>
          <p className={daysTextCls}>
            {view.myDays >= view.steadyDays
              ? `${view.myDays} days this week: a steady hunter!`
              : `${view.myDays} of ${view.steadyDays} days for steady hunter${
                  view.battledToday ? '' : ' · battle today to add one'
                }`}
          </p>
          {view.steady.length > 0 && (
            <div className={steadyCls}>
              {view.steady.map((user) => (
                <span
                  key={user.id}
                  className={steadyPicCls}
                  title={user.username}
                >
                  <ProfilePic
                    style={{ width: '100%' }}
                    userId={user.id}
                    profilePicUrl={user.profilePicUrl || ''}
                  />
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

const boardCls = css`
  width: 100%;
  margin-bottom: 1.8rem;
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
  gap: 0.8rem;
  padding: 0.9rem 1.4rem;
  background: ${ARENA.train};
  color: #fff;
  border-bottom: 3px solid ${ARENA.line};
  font-size: 1.8rem;
  font-weight: 900;
  text-shadow: 1px 1px 0 ${ARENA.line};
`;

const columnsCls = css`
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
  }
`;

const columnCls = css`
  padding: 1rem 1.4rem 1.2rem;
  &:first-child {
    border-right: 2px dashed ${ARENA.inkSoft};
    @media (max-width: ${mobileMaxWidth}) {
      border-right: none;
      border-bottom: 2px dashed ${ARENA.inkSoft};
    }
  }
`;

const columnHeadCls = css`
  margin: 0 0 0.6rem;
  font-size: 1.4rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${ARENA.inkSoft};
`;

const listCls = css`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const rowCls = css`
  display: grid;
  grid-template-columns: 3rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.8rem;
  padding: 0.4rem 0.5rem;
  border-radius: 8px;
`;

const meCls = css`
  background: #fff1b8;
  box-shadow: inset 0 0 0 2px ${ARENA.line};
`;

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
  display: flex;
  flex-direction: column;
  font-size: 1.4rem;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  small {
    font-size: 1.1rem;
    font-weight: 600;
    color: ${ARENA.inkSoft};
  }
`;

const climbCls = css`
  font-size: 1.35rem;
  font-weight: 900;
  color: ${ARENA.train};
  white-space: nowrap;
`;

const daysCls = css`
  display: flex;
  gap: 0.5rem;
`;

const dayCls = css`
  width: 2.4rem;
  height: 2.4rem;
  border: 2px solid ${ARENA.line};
  border-radius: 50%;
  background: #fff;
`;

const dayOnCls = css`
  background: ${ARENA.train};
`;

const daysTextCls = css`
  margin: 0.6rem 0 0;
  font-size: 1.3rem;
  font-weight: 700;
`;

const steadyCls = css`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.8rem;
`;

const steadyPicCls = css`
  width: 2.8rem;
  display: inline-flex;
`;

const noteCls = css`
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.6rem 0;
  font-size: 1.3rem;
  color: ${ARENA.inkSoft};
`;
