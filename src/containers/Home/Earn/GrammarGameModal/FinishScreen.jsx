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

  const numLetterGrades = useMemo(() => {
    const resultObj = {};
    for (let score of scoreArray) {
      if (!resultObj[score]) {
        resultObj[score] = 1;
      } else {
        resultObj[score]++;
      }
    }
    return resultObj;
  }, [scoreArray]);

  return (
    <ErrorBoundary componentPath="Earn/GrammarGameModal/FinishScreen">
      <div>Game Finished</div>
      {Object.entries(numLetterGrades).map(([letter, num]) => (
        <div key={letter}>
          <span style={{ fontWeight: 'bold' }}>{letter}:</span> ×{num}
        </div>
      ))}
      <div>Your score is {score}</div>
    </ErrorBoundary>
  );
}
