import React from 'react';
import Button from '~/components/Button';
import useScopedRead from '~/helpers/hooks/useScopedRead';
import FilterBar from '~/components/FilterBar';
import RankingsListItem from '~/components/RankingsListItem';
import Loading from '~/components/Loading';
import { useAppContext, useKeyContext } from '~/contexts';
import LeaderboardList from '~/components/LeaderboardList';
import { css } from '@emotion/css';

const myRankingLabel = 'My Ranking';
const top30Label = 'Top 30';

export default function Rankings({
  channelId,
  rankingsTab,
  onSetRankingsTab
}: {
  channelId: number;
  onSetRankingsTab: (arg0: string) => void;
  rankingsTab: string;
}) {
  const loadWordleRankings = useAppContext(
    (v) => v.requestHelpers.loadWordleRankings
  );
  const myId = useKeyContext((v) => v.myState.userId);
  const { data, loading, error, retry } = useScopedRead(
    `${myId}:${channelId}`,
    async () => {
      const response = await loadWordleRankings(channelId);
      if (
        ![response?.all, response?.top30s].every(
          (rows) =>
            Array.isArray(rows) &&
            rows.every(
              (user) =>
                Number.isSafeInteger(Number(user?.id)) && Number(user.id) > 0
            )
        )
      )
        throw new Error('Invalid rankings');
      return response;
    }
  );
  const myRank = data?.myRank;
  const users = (rankingsTab === 'all' ? data?.all : data?.top30s) || [];
  const desktopPaddingTop = myRank ? '2rem' : '1.2rem';
  const mobilePaddingTop = myRank ? '1.5rem' : '1rem';

  const containerClass = css`
    height: calc(100vh - 30rem);
    width: 100%;
    display: flex;
    align-items: center;
    flex-direction: column;
    .nav-section > nav {
      padding: 0;
    }
    .nav-section > nav > button {
      border: 0;
      background: transparent;
      color: inherit;
      font: inherit;
      width: 100%;
      min-height: 44px;
      padding: 8px;
      cursor: pointer;
    }
    button:focus-visible {
      outline: 2px solid currentColor;
      outline-offset: -3px;
    }
  `;

  return loading ? (
    <Loading className={containerClass} />
  ) : error ? (
    <div className={containerClass} role="alert" style={{ fontSize: 16 }}>
      <p>Could not load Top Scorers.</p>
      <Button
        variant="ghost"
        style={{ minHeight: 44, fontSize: 14 }}
        onClick={retry}
      >
        Try again
      </Button>
    </div>
  ) : (
    <div className={containerClass}>
      {!!myRank && (
        <FilterBar
          style={{
            width: '100%',
            height: '4.5rem',
            fontSize: '1.6rem',
            marginBottom: 0
          }}
        >
          <nav className={rankingsTab === 'all' ? 'active' : ''}>
            <button
              type="button"
              aria-pressed={rankingsTab === 'all'}
              onClick={() => onSetRankingsTab('all')}
            >
              {myRankingLabel}
            </button>
          </nav>
          <nav className={rankingsTab === 'top30' ? 'active' : ''}>
            <button
              type="button"
              aria-pressed={rankingsTab === 'top30'}
              onClick={() => onSetRankingsTab('top30')}
            >
              {top30Label}
            </button>
          </nav>
        </FilterBar>
      )}
      <LeaderboardList
        height="100%"
        width="35rem"
        padding={`${desktopPaddingTop} 1rem 3.5rem`}
        mobilePadding={`${mobilePaddingTop} 0.75rem 3rem`}
      >
        {!users.length && (
          <p role="status" style={{ fontSize: 16 }}>
            No scores yet.
          </p>
        )}
        {(users || []).map((user: { id: number }) => (
          <RankingsListItem
            small
            key={user.id}
            user={user}
            myId={myId}
            target="xpEarned"
            activityContext="wordleXP"
          />
        ))}
      </LeaderboardList>
    </div>
  );
}
