import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import YearItem from './YearItem';

Leaderboards.propTypes = {
  style: PropTypes.object
};

const year = (() => {
  const dt = new Date();
  const yr = dt.getFullYear();
  return yr;
})();

export default function Leaderboards({ style }) {
  return (
    <ErrorBoundary componentPath="Home/Earn/Leaderboard/index">
      <div style={{ width: '100%', ...style }}>
        <YearItem year={year} />
      </div>
    </ErrorBoundary>
  );
}
