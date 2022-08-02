import { useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import CurrentMonth from './CurrentMonth';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import MonthItem from './MonthItem';
import localize from '~/constants/localize';
import { panel } from '../../Styles';
import { useAppContext, useHomeContext } from '~/contexts';
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
const leaderboardLabel = localize('leaderboard');

YearItem.propTypes = {
  style: PropTypes.object,
  year: PropTypes.number
};

export default function YearItem({ style, year }) {
  const loadMonthlyLeaderboards = useAppContext(
    (v) => v.requestHelpers.loadMonthlyLeaderboards
  );
  const onLoadMonthlyLeaderboards = useHomeContext(
    (v) => v.actions.onLoadMonthlyLeaderboards
  );
  const leaderboardsObj = useHomeContext((v) => v.state.leaderboardsObj);
  const onSetLeaderboardsExpanded = useHomeContext(
    (v) => v.actions.onSetLeaderboardsExpanded
  );
  useEffect(() => {
    if (!leaderboardsObj?.[year]?.loaded) {
      handleLoadMonthlyLeaderboards();
    }
    async function handleLoadMonthlyLeaderboards() {
      const leaderboards = await loadMonthlyLeaderboards(year);
      onLoadMonthlyLeaderboards({ leaderboards, year });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaderboardsObj]);

  const { expanded, leaderboards } = useMemo(() => {
    return leaderboardsObj?.[year] || {};
  }, [leaderboardsObj, year]);

  const showAllButtonShown = useMemo(() => {
    return (
      leaderboardsObj?.[year]?.loaded &&
      !leaderboardsObj?.[year]?.expanded &&
      leaderboards?.length > 0
    );
  }, [leaderboards?.length, leaderboardsObj, year]);

  return (
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
            onClick={() => onSetLeaderboardsExpanded({ expanded: true, year })}
          />
        )}
      </div>
    </div>
  );
}
