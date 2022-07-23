import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import localize from '~/constants/localize';
import ErrorBoundary from '~/components/ErrorBoundary';
import { Color } from '~/constants/css';

const forEveryStarYouAddLabel = localize('forEveryStarYouAddSubject');

Subject.propTypes = {
  rewardLevel: PropTypes.number,
  style: PropTypes.object
};

export default function Subject({ rewardLevel, style }) {
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

  return (
    <ErrorBoundary componentPath="RewardLevelExplainer/Subject" style={style}>
      {rewardLevelExpectation && (
        <div style={{ fontSize: '1.7rem', fontWeight: 'bold' }}>
          {rewardLevelDescription}
        </div>
      )}
      <div style={{ fontSize: '1.5rem' }}>{forEveryStarYouAddLabel}</div>
    </ErrorBoundary>
  );
}
