import React, { useEffect, useMemo, useRef, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import FilterBar from '~/components/FilterBar';
import { notiFilterBar } from '../../Styles';
import ThisMonth from './ThisMonth';
import AllTime from './AllTime';
import moment from 'moment';
import { useKeyContext, useNotiContext } from '~/contexts';
import Loading from '~/components/Loading';

const allTimeLabel = 'All Time';

export default function Rankings({ loadingFeeds }: { loadingFeeds: boolean }) {
  const userId = useKeyContext((v) => v.myState.userId);
  const { standardTimeStamp } = useNotiContext((v) => v.state.todayStats);
  const [thisMonthSelected, setThisMonthSelected] = useState(!!userId);
  const allRanks = useNotiContext((v) => v.state.allRanks);
  const top30s = useNotiContext((v) => v.state.top30s);
  const allMonthly = useNotiContext((v) => v.state.allMonthly);
  const top30sMonthly = useNotiContext((v) => v.state.top30sMonthly);
  const myMonthlyRank = useNotiContext((v) => v.state.myMonthlyRank);
  const myAllTimeRank = useNotiContext((v) => v.state.myAllTimeRank);
  const myMonthlyXP = useNotiContext((v) => v.state.myMonthlyXP);
  const myAllTimeXP = useNotiContext((v) => v.state.myAllTimeXP);
  const userChangedTab = useRef(false);
  const currentMonth = useMemo(
    () => moment.utc(standardTimeStamp || Date.now()).format('MMMM'),
    [standardTimeStamp]
  );
  const rankingsEmpty = Boolean(
    allRanks.length === 0 &&
      top30s.length === 0 &&
      allMonthly.length === 0 &&
      top30sMonthly.length === 0
  );

  useEffect(() => {
    setThisMonthSelected(!!userId);
  }, [userId]);

  return (
    <ErrorBoundary componentPath="Notification/MainFeeds/Ranking/index">
      {userId && (
        <FilterBar
          className={notiFilterBar}
          style={{
            height: '4.5rem',
            fontSize: '1.6rem'
          }}
        >
          <nav
            className={thisMonthSelected ? 'active' : ''}
            onClick={() => {
              userChangedTab.current = true;
              setThisMonthSelected(true);
            }}
          >
            {currentMonth}
          </nav>
          <nav
            className={thisMonthSelected ? '' : 'active'}
            onClick={() => {
              userChangedTab.current = true;
              setThisMonthSelected(false);
            }}
          >
            {allTimeLabel}
          </nav>
        </FilterBar>
      )}
      <div style={{ width: '100%' }}>
        {loadingFeeds && rankingsEmpty ? (
          <Loading />
        ) : thisMonthSelected ? (
          <ThisMonth
            allMonthly={allMonthly}
            loading={loadingFeeds}
            top30sMonthly={top30sMonthly}
            myMonthlyRank={myMonthlyRank}
            myMonthlyXP={myMonthlyXP}
            myId={userId}
          />
        ) : (
          <AllTime
            loading={loadingFeeds}
            allRanks={allRanks}
            top30s={top30s}
            myAllTimeRank={myAllTimeRank}
            myAllTimeXP={myAllTimeXP}
            myId={userId}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
