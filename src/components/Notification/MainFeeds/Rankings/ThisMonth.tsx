import React, { useMemo, useState } from 'react';
import RoundList from '~/components/RoundList';
import RankingsListItem from '~/components/RankingsListItem';
import localize from '~/constants/localize';
import FilterBar from '~/components/FilterBar';
import MyRank from '~/components/MyRank';
import ErrorBoundary from '~/components/ErrorBoundary';
import Loading from '~/components/Loading';
import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';

const myRankingLabel = localize('myRanking');
const top30Label = localize('top30');

export default function ThisMonth({
  allMonthly,
  loading,
  top30sMonthly,
  myId,
  myMonthlyRank,
  myMonthlyXP
}: {
  allMonthly: any[];
  loading: boolean;
  top30sMonthly: any[];
  myId: number;
  myMonthlyRank: number;
  myMonthlyXP: number;
}) {
  const [allSelected, setAllSelected] = useState(!!myId);
  const users = useMemo(() => {
    if (allSelected) {
      return allMonthly || [];
    }
    return top30sMonthly || [];
  }, [allMonthly, allSelected, top30sMonthly]);
  const loggedIn = !!myId;
  return (
    <ErrorBoundary componentPath="Notification/MainFeeds/Rankings/ThisMonth">
      {loggedIn && (
        <FilterBar
          bordered
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
        <MyRank myId={myId} rank={myMonthlyRank} twinkleXP={myMonthlyXP} />
      )}
      {!myId ? (
        loading ? (
          <Loading />
        ) : null
      ) : users?.length === 0 || (allSelected && myMonthlyXP === 0) ? (
        <div
          className={css`
            border-radius: ${borderRadius};
            border: 1px solid ${Color.borderGray()};
            background: #fff;
            padding: 1rem;
            @media (max-width: ${mobileMaxWidth}) {
              border-radius: 0;
              border-left: none;
              border-right: none;
            }
          `}
        >
          {myMonthlyXP === 0
            ? "Earn XP by completing missions, watching XP videos, or leaving comments to join this month's leaderboard"
            : "Be the first to join this month's leaderboard by earning XP"}
        </div>
      ) : (
        <RoundList style={{ marginTop: 0 }}>
          {users.map((user) => (
            <RankingsListItem
              key={user.id}
              user={user}
              myId={myId}
              activityContext="monthlyXP"
            />
          ))}
        </RoundList>
      )}
    </ErrorBoundary>
  );
}
