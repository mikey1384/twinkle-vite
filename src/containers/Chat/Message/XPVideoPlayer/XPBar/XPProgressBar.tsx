import React, { useMemo } from 'react';
import ProgressBar from '~/components/ProgressBar';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import RewardAmountInfo from '../../RewardAmountInfo';
import localize from '~/constants/localize';

const notGainXPLabel = localize('notGainXP');

export default function XPProgressBar({
  playing,
  rewardLevel,
  started,
  startingPosition,
  userId,
  videoProgress,
  xpWarningShown
}: {
  playing: boolean;
  rewardLevel: number;
  started: boolean;
  startingPosition: number;
  userId: number;
  videoProgress: number;
  xpWarningShown: boolean;
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
