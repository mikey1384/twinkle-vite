import React, { useMemo, useState } from 'react';
import RankingsListItem from '~/components/RankingsListItem';import FilterBar from '~/components/FilterBar';
import MyRank from '~/components/MyRank';
import ErrorBoundary from '~/components/ErrorBoundary';
import Loading from '~/components/Loading';
import { css } from '@emotion/css';
import { borderRadius, mobileMaxWidth } from '~/constants/css';
import { notiFilterBar } from '../../Styles';
import LeaderboardList from '~/components/LeaderboardList';

const myRankingLabel = 'My Ranking';
const top30Label = 'Top 30';
const notRankedDescriptionLabel = 'Earn XP by completing missions, watching XP videos, or leaving comments to join the leaderboard';

export default function AllTime({
  allRanks,
  loading,
  myId,
  myAllTimeRank,
  myAllTimeXP,
  top30s
}: {
  allRanks: any[];
  loading: boolean;
  myId: number;
  myAllTimeRank: number;
  myAllTimeXP: number;
  top30s: any[];
}) {
  const [allSelected, setAllSelected] = useState(!!myId);
  const users = useMemo(() => {
    if (allSelected) {
      return allRanks;
    }
    return top30s;
  }, [allRanks, allSelected, top30s]);
  const loggedIn = !!myId;
  return (
    <ErrorBoundary componentPath="Notification/MainFeeds/Rankings/AllTime">
      {loggedIn && (
        <FilterBar
          className={notiFilterBar}
          style={{
            height: '4.5rem',
            fontSize: '1.6rem'
          }}
        >
          <nav
            className={allSelected ? 'active' : ''}
            onClick={() => {
              setAllSelected(true);
            }}
          >
            {myRankingLabel}
          </nav>
          <nav
            className={allSelected ? '' : 'active'}
            onClick={() => {
              setAllSelected(false);
            }}
          >
            {top30Label}
          </nav>
        </FilterBar>
      )}
      {loggedIn && allSelected && (
        <MyRank
          myId={myId}
          rank={myAllTimeRank}
          twinkleXP={myAllTimeXP}
          isNotification
        />
      )}
      {users?.length === 0 || (allSelected && loggedIn && myAllTimeXP === 0) ? (
        !myId ? (
          loading ? (
            <Loading />
          ) : null
        ) : (
          <div
            className={css`
              border-radius: ${borderRadius};
              border: none;
              background: #fff;
              padding: 1rem;
              @media (max-width: ${mobileMaxWidth}) {
                border-radius: 0;
              }
            `}
          >
            {notRankedDescriptionLabel}
          </div>
        )
      ) : (
        <LeaderboardList
          scrollable={false}
          padding="0"
          mobilePadding="0"
          bottomPadding="0"
        >
          {users?.map((user) => (
            <RankingsListItem
              key={user.id}
              user={user}
              myId={myId}
              activityContext="allTimeXP"
            />
          ))}
        </LeaderboardList>
      )}
    </ErrorBoundary>
  );
}
