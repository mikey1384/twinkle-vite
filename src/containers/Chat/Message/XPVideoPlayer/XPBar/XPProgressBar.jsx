import { useMemo } from 'react';
import PropTypes from 'prop-types';
import ProgressBar from '~/components/ProgressBar';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import RewardAmountInfo from '../../RewardAmountInfo';
import localize from '~/constants/localize';

const notGainXPLabel = localize('notGainXP');

XPProgressBar.propTypes = {
  playing: PropTypes.bool,
  rewardLevel: PropTypes.number,
  started: PropTypes.bool,
  startingPosition: PropTypes.number,
  userId: PropTypes.number,
  xpWarningShown: PropTypes.bool,
  videoProgress: PropTypes.number
};

export default function XPProgressBar({
  playing,
  rewardLevel,
  started,
  startingPosition,
  userId,
  videoProgress,
  xpWarningShown
}) {
  const theme = useKeyContext((v) => v.theme);
  const xpLevelColor = useMemo(
    () => theme[`level${rewardLevel}`]?.color,
    [rewardLevel, theme]
  );
  const warningColor = useMemo(() => theme.fail?.color, [theme]);
  if (!userId || !rewardLevel) {
    return null;
  }
  if (started) {
    return playing && xpWarningShown ? (
      <div
        className={css`
          height: 2.7rem;
          font-size: 1.3rem;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1rem;
            height: 2.7rem;
          }
        `}
        style={{
          background: Color[warningColor](),
          color: '#fff',
          fontWeight: 'bold',
          display: 'flex',
          flexGrow: 1,
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div style={{ marginLeft: '0.7rem' }}>{notGainXPLabel}</div>
      </div>
    ) : (
      <ProgressBar
        className={css`
          margin-top: 0;
          flex-grow: 1;
          height: 2.7rem !important;
          margin-top: 0 !important;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1rem;
            height: 2rem !important;
            font-size: 0.8rem !important;
          }
        `}
        progress={videoProgress}
        color={Color[xpLevelColor]()}
        noBorderRadius
      />
    );
  } else {
    return (
      <RewardAmountInfo
        rewardLevel={rewardLevel}
        startingPosition={startingPosition}
      />
    );
  }
}
