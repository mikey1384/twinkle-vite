import PropTypes from 'prop-types';
import { useMemo } from 'react';
import moment from 'moment';
import ErrorBoundary from '~/components/ErrorBoundary';
import YearItem from './YearItem';

Leaderboards.propTypes = {
  style: PropTypes.object
};

const firstYear = 2022;
const currentYear = moment().utc().year();

export default function Leaderboards({ style }) {
  const shownYears = useMemo(() => {
    const years = [];
    for (let i = currentYear; i >= firstYear; i--) {
      years.push(i);
    }
    return years;
  }, []);

  return (
    <ErrorBoundary componentPath="Home/Earn/Leaderboard/index">
      <div style={{ width: '100%', ...style }}>
        {shownYears.map((year) => (
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
