import React, { useEffect, useState } from 'react';
import { css, cx } from '@emotion/css';
import Icon from '~/components/Icon';
import ProfilePic from '~/components/ProfilePic';
import { useAppContext } from '~/contexts';
import { mobileMaxWidth } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { ARENA } from './theme';
import type { ArenaLeague } from './types';

// The Weekly League board (Mikey 10-24, design: reports/Arena leaderboard
// and challenges.md): your group of ~30 hunters at your level this week,
// shown as its top 3 and you with your neighbours, the promotion and
// demotion lines between them. The bottom of the group is never listed.
const TIER_COLOR: Record<string, string> = {
  E: '#9a948a',
  D: ARENA.train,
  C: ARENA.sky,
  B: ARENA.violet,
  A: ARENA.coral,
  S: '#f2c14e'
};

export default function League() {
  const loadArenaLeague = useAppContext(
    (v) => v.requestHelpers.loadArenaLeague
  );
  const setArenaLeagueHidden = useAppContext(
    (v) => v.requestHelpers.setArenaLeagueHidden
  );
  const markArenaLeagueResultSeen = useAppContext(
    (v) => v.requestHelpers.markArenaLeagueResultSeen
  );
  const [league, setLeague] = useState<ArenaLeague | null>(null);
  const [savingHidden, setSavingHidden] = useState(false);

  useEffect(() => {
    let alive = true;
    loadArenaLeague()
      .then((data: ArenaLeague) => alive && setLeague(data))
      .catch(() => null);
    return () => {
      alive = false;
    };
  }, [loadArenaLeague]);

  if (!league) {
    return (
      <section className={boardCls}>
        <div className={loadingCls}>
          <Icon icon="spinner" pulse /> Loading your league
        </div>
      </section>
    );
  }

  const color = TIER_COLOR[league.tierName] || ARENA.ink;
  return (
    <section className={boardCls}>
      <header className={headCls} style={{ background: color }}>
        <span className={tierCls}>{league.tierName}</span>
        <div className={headTextCls}>
          <strong>{league.tierName} League · Weekly</strong>
          <span>Ends in {timeLeft(league.endsAt)}</span>
        </div>
        {league.shielded && (
          <span
            className={shieldCls}
            title="Promoted last week: no demotion this week"
          >
            <Icon icon="shield-alt" /> Shield
          </span>
        )}
      </header>

      {league.lastResult && (
        <div className={resultCls}>
          <span>
            Last week: <b>{ordinal(league.lastResult.rank)}</b> in{' '}
            {league.lastResult.tierName} League
            {league.lastResult.outcome === 'up'
              ? ' · promoted!'
              : league.lastResult.outcome === 'down'
                ? ' · moved down a league'
                : ''}
            {league.lastResult.xp > 0 &&
              ` · +${addCommasToNumber(league.lastResult.xp)} XP`}
          </span>
          <button type="button" className={linkButtonCls} onClick={handleSeen}>
            Got it
          </button>
        </div>
      )}

      {!league.joined ? (
        <p className={emptyCls}>
          Win a paid battle this week to join a {league.tierName} League group
          of hunters at your level. The top 7 move up on Monday.
        </p>
      ) : (
        <>
          <p className={statusCls}>{statusLine(league)}</p>
          <ol className={rowsCls}>
            {league.rows.map((row, i) => {
              const gap = i > 0 && row.rank - league.rows[i - 1].rank > 1;
              return (
                <React.Fragment key={row.rank}>
                  {gap && <li className={gapCls}>⋯</li>}
                  {league.downFrom > 0 && row.rank === league.downFrom && (
                    <li className={cx(lineCls, downLineCls)}>
                      ▼ demotion zone
                    </li>
                  )}
                  <li className={cx(rowCls, row.me && meCls)}>
                    <span className={rankCls}>{row.rank}</span>
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
                      {row.user
                        ? row.user.username || 'Hunter'
                        : 'Hidden hunter'}
                      {row.me && ' (you)'}
                    </span>
                    <span className={lpCls}>
                      {addCommasToNumber(row.lp)}
                      <small> LP</small>
                    </span>
                  </li>
                  {league.upTo > 0 && row.rank === league.upTo && (
                    <li className={cx(lineCls, upLineCls)}>▲ promotion line</li>
                  )}
                </React.Fragment>
              );
            })}
          </ol>
        </>
      )}

      <label className={hideCls}>
        <input
          type="checkbox"
          checked={league.hidden}
          disabled={savingHidden}
          onChange={(e) => handleHidden(e.target.checked)}
        />
        Hide me from other hunters&apos; boards (you still see your own rank)
      </label>
    </section>
  );

  async function handleHidden(hidden: boolean) {
    setSavingHidden(true);
    try {
      await setArenaLeagueHidden(hidden);
      setLeague((prev) => (prev ? { ...prev, hidden } : prev));
    } finally {
      setSavingHidden(false);
    }
  }

  async function handleSeen() {
    if (!league?.lastResult) return;
    const week = league.lastResult.week;
    setLeague((prev) => (prev ? { ...prev, lastResult: null } : prev));
    await markArenaLeagueResultSeen(week).catch(() => null);
  }
}

// What the member is told about where they stand
function statusLine(league: ArenaLeague) {
  const rank = league.myRank || 0;
  if (league.upTo && rank <= league.upTo) {
    return `You're ${ordinal(rank)}: in the promotion zone. Hold it until Monday!`;
  }
  if (league.upTo) {
    const gap = rank - league.upTo;
    return `You're ${ordinal(rank)}: ${gap} place${gap === 1 ? '' : 's'} from the promotion line.`;
  }
  if (league.tierName === 'S')
    return `You're ${ordinal(rank)} in the top league.`;
  // a group too small for lines yet (it fills as hunters battle this week)
  return `You're ${ordinal(rank)} so far. Your group fills up as more hunters battle this week.`;
}

function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function timeLeft(endsAt: number) {
  const seconds = Math.max(0, endsAt - Math.floor(Date.now() / 1000));
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return days > 0
    ? `${days}d ${hours}h`
    : `${hours}h ${Math.floor((seconds % 3600) / 60)}m`;
}

const boardCls = css`
  width: 100%;
  margin-bottom: 1.8rem;
  background: ${ARENA.paper};
  border: 3px solid ${ARENA.line};
  border-radius: 12px;
  box-shadow: 4px 4px 0 ${ARENA.line};
  overflow: hidden;
  color: ${ARENA.ink};
`;

const loadingCls = css`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.6rem;
  font-size: 1.5rem;
  font-weight: 800;
  color: ${ARENA.inkSoft};
`;

const headCls = css`
  display: flex;
  align-items: center;
  gap: 1.2rem;
  padding: 1rem 1.4rem;
  border-bottom: 3px solid ${ARENA.line};
  color: #fff;
  text-shadow: 1px 1px 0 ${ARENA.line};
`;

const tierCls = css`
  width: 4.4rem;
  height: 4.4rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 3px solid ${ARENA.line};
  border-radius: 10px;
  background: ${ARENA.paper};
  color: ${ARENA.ink};
  box-shadow: 3px 3px 0 ${ARENA.line};
  font-size: 2.6rem;
  font-weight: 900;
  text-shadow: none;
`;

const headTextCls = css`
  display: flex;
  flex-direction: column;
  strong {
    font-size: 1.9rem;
    font-weight: 900;
  }
  span {
    font-size: 1.25rem;
    font-weight: 700;
  }
`;

const shieldCls = css`
  margin-left: auto;
  padding: 0.2rem 0.8rem;
  border: 2px solid ${ARENA.line};
  border-radius: 999px;
  background: ${ARENA.paper};
  color: ${ARENA.ink};
  font-size: 1.2rem;
  font-weight: 800;
  text-shadow: none;
`;

const resultCls = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.8rem 1.4rem;
  background: #fff1b8;
  border-bottom: 2px dashed ${ARENA.inkSoft};
  font-size: 1.4rem;
`;

const linkButtonCls = css`
  border: none;
  background: none;
  font-size: 1.3rem;
  font-weight: 800;
  text-decoration: underline;
  cursor: pointer;
  color: ${ARENA.ink};
`;

const emptyCls = css`
  margin: 0;
  padding: 1.4rem;
  font-size: 1.45rem;
  line-height: 1.5;
  color: ${ARENA.inkSoft};
`;

const statusCls = css`
  margin: 0;
  padding: 1rem 1.4rem 0.4rem;
  font-size: 1.45rem;
  font-weight: 800;
`;

const rowsCls = css`
  list-style: none;
  margin: 0;
  padding: 0.4rem 1rem 0.8rem;
`;

const rowCls = css`
  display: grid;
  grid-template-columns: 3rem 3rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.9rem;
  padding: 0.5rem 0.6rem;
  border-radius: 8px;
`;

// your row reads like a highlighter mark, the same as a picked answer
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

const lpCls = css`
  font-size: 1.45rem;
  font-weight: 900;
  small {
    font-size: 1.05rem;
    color: ${ARENA.inkSoft};
  }
`;

const gapCls = css`
  text-align: center;
  color: ${ARENA.inkSoft};
  font-weight: 900;
  letter-spacing: 0.2em;
`;

const lineCls = css`
  margin: 0.3rem 0;
  padding: 0.2rem 0.6rem;
  font-size: 1.1rem;
  font-weight: 900;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  border-top: 2px dashed;
`;

const upLineCls = css`
  color: ${ARENA.train};
  border-color: ${ARENA.train};
`;

const downLineCls = css`
  color: ${ARENA.accent};
  border-color: ${ARENA.accent};
`;

const hideCls = css`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.8rem 1.4rem 1rem;
  border-top: 2px dashed ${ARENA.inkSoft};
  font-size: 1.25rem;
  color: ${ARENA.inkSoft};
  cursor: pointer;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.15rem;
  }
`;
