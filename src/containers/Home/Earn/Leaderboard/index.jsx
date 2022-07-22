import React, { useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import localize from '~/constants/localize';
import CurrentMonth from './CurrentMonth';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import MonthItem from './MonthItem';
import { useAppContext, useHomeContext } from '~/contexts';
import { panel } from '../Styles';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

Leaderboard.propTypes = {
  style: PropTypes.object
};

const leaderboardLabel = localize('leaderboard');
const year = (() => {
  const dt = new Date();
  const yr = dt.getFullYear();
  return yr;
})();

export default function Leaderboard({ style }) {
  const loadMonthlyLeaderboards = useAppContext(
    (v) => v.requestHelpers.loadMonthlyLeaderboards
  );
  const onLoadMonthlyLeaderboards = useHomeContext(
    (v) => v.actions.onLoadMonthlyLeaderboards
  );
  const onSetLeaderboardsExpanded = useHomeContext(
    (v) => v.actions.onSetLeaderboardsExpanded
  );
  const leaderboardsObj = useHomeContext((v) => v.state.leaderboardsObj);
  useEffect(() => {
    if (!leaderboardsObj?.[year]?.loaded) {
      handleLoadMonthlyLeaderboards();
    }

    async function handleLoadMonthlyLeaderboards() {
      const leaderboards = await loadMonthlyLeaderboards();
      onLoadMonthlyLeaderboards({ leaderboards, year });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaderboardsObj]);

  const { expanded, leaderboards } = useMemo(() => {
    return leaderboardsObj?.[year] || {};
  }, [leaderboardsObj]);

  const showAllButtonShown = useMemo(() => {
    return (
      leaderboardsObj?.[year]?.loaded &&
      !leaderboardsObj?.[year]?.expanded &&
      leaderboards?.length > 0
    );
  }, [leaderboards?.length, leaderboardsObj]);

  return (
    <ErrorBoundary componentPath="Home/Earn/Leaderboard/index">
      <div style={style} className={panel}>
        <p>
          {year}
          {SELECTED_LANGUAGE === 'kr' ? '년' : ''} {leaderboardLabel}
        </p>
        <div style={{ marginTop: '2rem' }}>
          <CurrentMonth />
          {expanded
            ? leaderboards.map((leaderboard) => (
                <MonthItem
                  key={leaderboard.id}
                  style={{ marginTop: '1rem' }}
                  monthLabel={months[leaderboard.month - 1]}
                  yearLabel={String(leaderboard.year)}
                  top30={leaderboard.rankings}
                />
              ))
            : null}
          {showAllButtonShown && (
            <LoadMoreButton
              style={{ fontSize: '2rem', marginTop: '1rem' }}
              label="Show All"
              transparent
              onClick={() =>
                onSetLeaderboardsExpanded({ expanded: true, year })
              }
            />
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
