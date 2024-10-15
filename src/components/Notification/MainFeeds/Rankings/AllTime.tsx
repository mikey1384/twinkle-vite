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
const notRankedDescriptionLabel = localize('notRankedDescription');

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
        <MyRank myId={myId} rank={myAllTimeRank} twinkleXP={myAllTimeXP} />
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
            {notRankedDescriptionLabel}
          </div>
        )
      ) : (
        <RoundList style={{ marginTop: 0 }}>
          {users.map((user) => (
            <RankingsListItem key={user.id} user={user} myId={myId} />
          ))}
        </RoundList>
      )}
    </ErrorBoundary>
  );
}
