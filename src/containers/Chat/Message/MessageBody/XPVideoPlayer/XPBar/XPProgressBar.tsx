import React, { useMemo } from 'react';
import ProgressBar from '~/components/ProgressBar';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import RewardAmountInfo from '../../RewardAmountInfo';

export default function XPProgressBar({
  rewardLevel,
  reasonForDisable,
  started,
  startingPosition,
  userId,
  videoProgress
}: {
  rewardLevel: number;
  reasonForDisable: string;
  started: boolean;
  startingPosition: number;
  userId: number;
  videoProgress: number;
}) {
  const theme = useKeyContext((v) => v.theme);
  const xpLevelColor = useMemo(
    () => theme[`level${rewardLevel}`]?.color,
    [rewardLevel, theme]
  );
  if (!userId || !rewardLevel) {
    return null;
  }
  if (started) {
    return (
      <ProgressBar
        className={css`
          margin-top: 0;
          height: 2.7rem !important;
          margin-top: 0 !important;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1rem;
            height: 2rem !important;
            font-size: 0.8rem !important;
          }
        `}
        style={{ flexGrow: 1, width: undefined }}
        text={reasonForDisable}
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
