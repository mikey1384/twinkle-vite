import React, { useMemo } from 'react';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import localize from '~/constants/localize';
import ErrorBoundary from '~/components/ErrorBoundary';
import { Color, wideBorderRadius } from '~/constants/css';
import { css } from '@emotion/css';

const forEveryStarYouAddLabel = localize('forEveryStarYouAddSubject');

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
        return localize('moderateEffort');
      case 4:
        return localize('aLotOfEffort');
      case 5:
        return localize('hugeEffort');
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
    if (SELECTED_LANGUAGE === 'kr') {
      return (
        <>
          선생님 유저분들의 추천을 받으려면 {rewardLevelExpectation}을 기울여야
          합니다
        </>
      );
    }
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
    border: 1px solid ${Color.borderGray(0.5)};
    border-radius: ${wideBorderRadius};
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
