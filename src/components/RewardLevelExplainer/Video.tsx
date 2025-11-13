import React, { useMemo } from 'react';
import { Color, borderRadius } from '~/constants/css';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';

export default function Video({
  rewardLevel,
  style
}: {
  rewardLevel: number;
  style?: React.CSSProperties;
}) {
  const forEveryStarYouAddLabel =
    'For every star you add, the amount of XP viewers earn per minute rises.';
  const rewardLevelDescription = useMemo(() => {
    switch (rewardLevel) {
      case 3:
        return (
          <>
            This video is{' '}
            <span style={{ color: Color.pink() }}>
              purely for entertainment
            </span>
            , but {`it's`} good for English listening
          </>
        );
      case 4:
        return (
          <>
            This video is{' '}
            <span style={{ color: Color.green() }}>educational</span> and good
            for English listening
          </>
        );
      case 5:
        return (
          <>
            This video is{' '}
            <span style={{ color: Color.green() }}>educational</span>, good for
            English listening, and I want every single user to watch it
          </>
        );
      default:
        return '';
    }
  }, [rewardLevel]);

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
    <ErrorBoundary componentPath="RewardLevelExplainer/Video" style={style}>
      <div className={containerCss}>
        {rewardLevelDescription && (
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
