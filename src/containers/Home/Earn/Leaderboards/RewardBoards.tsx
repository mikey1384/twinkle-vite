import React, { useMemo, useState } from 'react';
import { css } from '@emotion/css';
import ErrorBoundary from '~/components/ErrorBoundary';
import Loading from '~/components/Loading';
import Link from '~/components/Link';
import TopRanker from './YearItem/TopRanker';
import { homePanelClass } from '~/theme/homePanels';
import ScopedTheme from '~/theme/ScopedTheme';
import { useHomePanelVars } from '~/theme/hooks/useHomePanelVars';
import { useKeyContext } from '~/contexts';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { useEarnHub, type EarnHubPeriod } from '../Bounties/useEarnHub';

const PERIODS: Array<[EarnHubPeriod, string]> = [
  ['day', 'Today'],
  ['week', 'This week'],
  ['all', 'All time']
];

// Two boards fed by the reward ledger: who earned the most from apps, and
// whose apps paid the most. Both come from the server; nothing is computed
// from anything an app or a client submits.
export default function RewardBoards({ kind }: { kind: 'apps' | 'creators' }) {
  const [period, setPeriod] = useState<EarnHubPeriod>('week');
  const { hub, loading } = useEarnHub(period);
  const userId = useKeyContext((v) => v.myState.userId);
  const { panelVars, themeName } = useHomePanelVars(0.08, { neutralSurface: true });
  const title = kind === 'apps' ? 'Earned from apps' : 'Whose apps paid the most';
  const rows = useMemo(() => {
    if (!hub) return [];
    return kind === 'apps' ? hub.standings.entries : hub.creators.entries;
  }, [hub, kind]);
  const me = kind === 'apps' ? hub?.standings.me : null;
  const meVisible = !me || rows.some((row) => row.userId === me.userId);
  return (
    <ErrorBoundary componentPath="Home/Earn/Leaderboards/RewardBoards">
      <ScopedTheme
        theme={themeName}
        roles={['sectionPanel', 'sectionPanelText']}
        className={homePanelClass}
        style={panelVars}
      >
        <div className={headClass}>
          <p style={{ margin: 0 }}>{title}</p>
          <div className={periodsClass} role="tablist" aria-label="Period">
            {PERIODS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={period === key}
                className={`${periodClass} ${period === key ? 'on' : ''}`}
                onClick={() => setPeriod(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {loading && !hub ? (
          <Loading style={{ height: '8rem' }} />
        ) : !hub ? (
          <div className={emptyClass}>
            Standings could not be loaded right now. Try again in a moment.
          </div>
        ) : rows.length === 0 ? (
          <div className={emptyClass}>
            {kind === 'apps'
              ? period === 'day'
                ? 'Nobody has earned from an app yet today. Be the first.'
                : 'Nothing earned from apps yet. Open a bounty above to start the board.'
              : 'No apps have paid out yet. Build one and your name goes here.'}
          </div>
        ) : (
          <>
            {kind === 'apps' && (
              <div className={top3Class}>
                {(rows as any[]).slice(0, 3).map((row) => (
                  <TopRanker
                    key={row.userId}
                    userId={row.userId}
                    username={row.username || 'member'}
                    profilePicUrl={row.profilePicUrl || ''}
                    rank={row.rank}
                    style={{ width: '31%' }}
                  />
                ))}
              </div>
            )}
            <ol className={listClass}>
              {(rows as any[]).map((row) => (
                <Row key={row.userId} row={row} kind={kind} you={row.userId === userId} />
              ))}
              {me && !meVisible && (
                <>
                  <li className={gapClass}>…</li>
                  <Row row={{ ...me, username: me.username || 'You' }} kind="apps" you />
                </>
              )}
            </ol>
          </>
        )}
      </ScopedTheme>
    </ErrorBoundary>
  );
}

function Row({ row, kind, you }: { row: any; kind: 'apps' | 'creators'; you: boolean }) {
  const detail =
    kind === 'apps'
      ? `${row.claims} ${row.claims === 1 ? 'reward' : 'rewards'} from ${row.apps} ${row.apps === 1 ? 'app' : 'apps'}`
      : `${(row.apps || []).join(', ') || 'no app yet'} · ${row.players} ${row.players === 1 ? 'player' : 'players'} paid`;
  return (
    <li className={`${rowClass} ${you ? 'you' : ''}`}>
      <span className={rankClass}>#{row.rank}</span>
      <span className={whoClass}>
        {row.username ? (
          <Link to={`/users/${row.username}`} style={{ fontWeight: 700 }}>
            {row.username}
          </Link>
        ) : (
          <b>member</b>
        )}
        <small>{you ? `you · ${detail}` : detail}</small>
      </span>
      <span className={xpClass}>
        {addCommasToNumber(row.xp)} XP
        {row.coins ? ` · ${addCommasToNumber(row.coins)} Coins` : ''}
      </span>
    </li>
  );
}

const headClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
`;
const periodsClass = css`
  display: flex;
  gap: 0.4rem;
  background: rgba(15, 23, 42, 0.06);
  border-radius: 999px;
  padding: 0.3rem;
`;
const periodClass = css`
  border: 0;
  background: transparent;
  border-radius: 999px;
  padding: 0.6rem 1.2rem;
  font-size: 1.3rem;
  font-weight: 700;
  color: rgba(15, 23, 42, 0.6);
  cursor: pointer;
  &.on {
    background: #fff;
    color: ${Color.logoBlue()};
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  }
  &:focus-visible {
    outline: 2px solid ${Color.logoBlue()};
    outline-offset: 2px;
  }
`;
const emptyClass = css`
  text-align: center;
  font-weight: 700;
  padding: 2rem 1rem;
  font-size: 1.5rem;
`;
const top3Class = css`
  display: flex;
  justify-content: center;
  gap: 1.2rem;
  margin: 0.5rem 0 1rem;
`;
const listClass = css`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.6rem;
`;
const rowClass = css`
  display: flex;
  align-items: center;
  gap: 1.2rem;
  padding: 1rem 1.3rem;
  border: 1px solid var(--ui-border);
  border-radius: ${borderRadius};
  font-size: 1.4rem;
  background: rgba(255, 255, 255, 0.6);
  &.you {
    border-color: ${Color.logoBlue()};
    background: ${Color.logoBlue(0.08)};
  }
  @media (max-width: ${mobileMaxWidth}) {
    gap: 0.8rem;
    padding: 0.9rem 1rem;
  }
`;
const rankClass = css`
  min-width: 3.4rem;
  font-weight: 800;
  color: rgba(15, 23, 42, 0.55);
  font-variant-numeric: tabular-nums;
`;
const whoClass = css`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  > small {
    font-size: 1.15rem;
    color: rgba(15, 23, 42, 0.6);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;
const xpClass = css`
  font-weight: 800;
  color: #5a3d05;
  background: ${Color.gold(0.6)};
  border-radius: 999px;
  padding: 0.4rem 1rem;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
`;
const gapClass = css`
  text-align: center;
  color: rgba(15, 23, 42, 0.5);
`;
