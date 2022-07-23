import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import { useKeyContext } from '~/contexts';
import localize from '~/constants/localize';

RewardLevelExpectation.propTypes = {
  rewardLevel: PropTypes.number.isRequired
};

export default function RewardLevelExpectation({ rewardLevel }) {
  const theme = useKeyContext((v) => v.theme);
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
  const rewardLevelExpectationLabel = useMemo(() => {
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
        Put {rewardLevelExpectation} Into Your Response to Get Recommendations
      </>
    );
  }, [rewardLevelExpectation]);
  const rewardColor = useMemo(() => {
    const appliedRewardLevel = Math.max(3, rewardLevel);
    return Color[theme[`level${appliedRewardLevel}`]?.color]();
  }, [rewardLevel, theme]);
  const rewardLevelExplanation = useMemo(() => {
    if (rewardLevelExpectation === '') {
      return '';
    }
    return (
      <div
        className={css`
          font-size: 1.5rem;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1.2rem;
          }
        `}
      >
        <b style={{ color: rewardColor }}>Lvl {rewardLevel}:</b>{' '}
        <span style={{ color: '#fff' }}>{rewardLevelExpectationLabel}</span>
      </div>
    );
  }, [
    rewardLevelExpectation,
    rewardColor,
    rewardLevel,
    rewardLevelExpectationLabel
  ]);

  if (!rewardLevelExpectation) return null;
  return (
    <div
      className={css`
        padding: 1rem;
        font-size: 1.5rem;
        font-weight: bold;
        background: ${rewardLevel === 5 ? Color.black() : Color.darkerGray()};
        margin-bottom: 1rem;
        margin-left: CALC(-1rem - 1px);
        margin-right: CALC(-1rem - 1px);
        @media (max-width: ${mobileMaxWidth}) {
          margin-left: -1rem;
          margin-right: -1rem;
        }
      `}
    >
      {rewardLevelExplanation}
    </div>
  );
}
