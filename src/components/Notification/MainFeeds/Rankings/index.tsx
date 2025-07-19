import React, { useEffect, useMemo, useRef, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import FilterBar from '~/components/FilterBar';
import ThisMonth from './ThisMonth';
import AllTime from './AllTime';
import localize from '~/constants/localize';
import moment from 'moment';
import { useKeyContext, useNotiContext } from '~/contexts';

const allTimeLabel = localize('allTime');

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

  useEffect(() => {
    setThisMonthSelected(!!userId);
  }, [userId]);

  return (
    <ErrorBoundary componentPath="Notification/MainFeeds/Ranking/index">
      {userId && (
        <FilterBar
          bordered
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
        {thisMonthSelected ? (
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
