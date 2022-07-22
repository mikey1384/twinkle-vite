import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import { Color } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';

AttemptResult.propTypes = {
  attemptState: PropTypes.object,
  isSolved: PropTypes.bool,
  numGuesses: PropTypes.number,
  style: PropTypes.object
};

export default function AttemptResult({
  attemptState,
  isSolved,
  numGuesses,
  style
}) {
  const xpRewarded = useMemo(
    () => addCommasToNumber(attemptState.xpRewardAmount),
    [attemptState.xpRewardAmount]
  );
  const bonusLabel = useMemo(() => {
    if (numGuesses < 3) {
      return null;
    }
    return attemptState?.isStrict ? 'double reward bonus' : null;
  }, [attemptState?.isStrict, numGuesses]);

  return (
    <ErrorBoundary
      componentPath="WordleModal/OverviewModal/AttemptResult"
      style={{
        fontWeight: 'bold',
        textAlign: 'center',
        ...style
      }}
    >
      <div style={{ fontSize: '2rem' }}>
        {isSolved ? (
          <span style={{ color: Color.green() }}>Solved</span>
        ) : (
          <span style={{ color: Color.rose() }}>Failed</span>
        )}
      </div>
      {isSolved && (
        <div>
          <div>
            in {numGuesses} guess
            {numGuesses === 1
              ? '!!!'
              : numGuesses === 2
              ? 'es!!'
              : numGuesses === 3
              ? 'es!'
              : 'es'}
          </div>
          {bonusLabel && (
            <p
              style={{
                marginTop: '1rem',
                fontWeight: 'bold',
                color: Color.orange()
              }}
            >
              {bonusLabel}
            </p>
          )}
        </div>
      )}
      <div
        style={{
          fontSize: '1.7rem',
          marginTop: isSolved ? '2rem' : '1rem'
        }}
      >
        You earned {xpRewarded} XP{isSolved ? '' : ' for trying'}
      </div>
    </ErrorBoundary>
  );
}
