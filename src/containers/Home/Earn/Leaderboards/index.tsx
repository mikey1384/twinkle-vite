import React, { useMemo } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import YearItem from './YearItem';
import moment from 'moment';
import { useNotiContext } from '~/contexts';

const firstYear = 2022;

export default function Leaderboards({
  style
}: {
  style?: React.CSSProperties;
}) {
  const { standardTimeStamp } = useNotiContext((v) => v.state.todayStats);
  const currentYear = useMemo(() => {
    return moment.utc(standardTimeStamp || Date.now()).year();
  }, [standardTimeStamp]);
  const shownYears = useMemo(() => {
    const years = [];
    for (let i = currentYear; i >= firstYear; i--) {
      years.push(i);
    }
    return years;
  }, [currentYear]);

  return (
    <ErrorBoundary componentPath="Home/Earn/Leaderboard/index">
      <div style={{ width: '100%', ...style }}>
        {(shownYears || []).map((year) => (
          <YearItem
            key={year}
            year={year}
            currentYear={currentYear}
            style={{ marginTop: year !== currentYear ? '3rem' : 0 }}
          />
        ))}
      </div>
    </ErrorBoundary>
  );
}
