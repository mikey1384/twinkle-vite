import { useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import CurrentMonth from './CurrentMonth';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import MonthItem from './MonthItem';
import localize from '~/constants/localize';
import moment from 'moment';
import Loading from '~/components/Loading';
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
const currentMonth = Number(moment().utc().format('M'));

YearItem.propTypes = {
  currentYear: PropTypes.number,
  style: PropTypes.object,
  year: PropTypes.number
};

export default function YearItem({ style, year, currentYear }) {
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

  const displayedLeaderBoards = useMemo(() => {
    if (!leaderboards) return [];
    if (year === currentYear) {
      return expanded
        ? leaderboards.filter(
            (leaderboard) => leaderboard.month !== currentMonth
          )
        : [];
    }
    return expanded ? leaderboards : [leaderboards[0]];
  }, [currentYear, expanded, leaderboards, year]);

  const showAllButtonShown = useMemo(() => {
    return (
      leaderboardsObj?.[year]?.loaded &&
      !leaderboardsObj?.[year]?.expanded &&
      leaderboards?.length > 1
    );
  }, [leaderboards?.length, leaderboardsObj, year]);

  return (
    <div style={style} className={panel}>
      <p>
        {year}
        {SELECTED_LANGUAGE === 'kr' ? '년' : ''} {leaderboardLabel}
      </p>
      {year === currentYear || leaderboardsObj?.[year]?.loaded ? (
        <div style={{ marginTop: '2rem', position: 'relative' }}>
          {year === currentYear ? <CurrentMonth /> : null}
          {displayedLeaderBoards.map((leaderboard) => (
            <MonthItem
              key={leaderboard.id}
              style={{ marginTop: '1rem' }}
              monthLabel={months[leaderboard.month - 1]}
              yearLabel={String(leaderboard.year)}
              top30={leaderboard.rankings}
            />
          ))}
          {!leaderboardsObj?.[year]?.loaded && (
            <Loading style={{ position: 'absolute', height: '3rem' }} />
          )}
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
      ) : (
        <Loading />
      )}
    </div>
  );
}
