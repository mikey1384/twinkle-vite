import { useMemo } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import PropTypes from 'prop-types';
import { scoreTable, perfectScore } from './constants';

FinishScreen.propTypes = {
  scoreArray: PropTypes.array
};

export default function FinishScreen({ scoreArray }) {
  const score = useMemo(() => {
    if (!scoreArray) return 0;
    const sum = scoreArray.reduce((acc, cur) => acc + scoreTable[cur], 0);
    if (sum === scoreTable.S * 10) {
      return perfectScore;
    }
    return sum;
  }, [scoreArray]);

  return (
    <ErrorBoundary componentPath="Earn/GrammarGameModal/FinishScreen">
      <div>Game Finished</div>
      <div>Your score is {score}</div>
    </ErrorBoundary>
  );
}
