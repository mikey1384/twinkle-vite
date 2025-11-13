import React, { useMemo } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { Color, borderRadius } from '~/constants/css';
import { css } from '@emotion/css';

const forEveryStarYouAddLabel = 'For every star you add, the maximum amount of XP that could be rewarded to each participant of this subject rises by 2,000 XP.';

export default function Subject({
  rewardLevel,
  style
}: {
  rewardLevel: number;
  style?: React.CSSProperties;
}) {
  const rewardLevelExpectation = useMemo(() => {
    switch (rewardLevel) {
      case 3:
        return 'Moderate Effort';
      case 4:
        return 'A Lot of Effort';
      case 5:
        return 'Huge Effort';
      default:
        return '';
    }
  }, [rewardLevel]);
  const effortColor = useMemo(() => {
    if (rewardLevel === 3) {
      return Color.pink();
    }
    if (rewardLevel === 4) {
      return Color.orange();
    }
    if (rewardLevel === 5) {
      return Color.rose();
    }
  }, [rewardLevel]);
  const rewardLevelDescription = useMemo(() => {
    return (
      <>
        Users are expected to put{' '}
        <b style={{ color: effortColor }}>
          {rewardLevelExpectation.toLowerCase()}
        </b>{' '}
        into their responses
      </>
    );
  }, [effortColor, rewardLevelExpectation]);

  const containerCss = css`
    background: #fff;
    border: 1px solid var(--ui-border);
    border-radius: ${borderRadius};
    width: calc(100% - 1.2rem);
    margin: 0.6rem;
    padding: 0.8rem 1rem;
    color: ${Color.darkBlueGray()};
    line-height: 1.4;
  `;

  return (
    <ErrorBoundary componentPath="RewardLevelExplainer/Subject" style={style}>
      <div className={containerCss}>
        {rewardLevelExpectation && (
          <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>
            <span style={{ opacity: 0.8 }}>Level {rewardLevel}:</span>{' '}
            {rewardLevelDescription}
          </div>
        )}
        <div style={{ fontSize: '1.3rem', marginTop: '0.4rem' }}>
          {forEveryStarYouAddLabel}
        </div>
      </div>
    </ErrorBoundary>
  );
}
