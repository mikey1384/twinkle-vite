import React, { useMemo } from 'react';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import ProgressBar from '~/components/ProgressBar';
import Icon from '~/components/Icon';
import { isMobile } from '~/helpers';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import localize from '~/constants/localize';

const deviceIsMobile = isMobile(navigator);
const continueLabel = localize('continue');
const watchingLabel = localize('watching');
const perMinuteLabel = localize('perMinute');

interface BarProps {
  userId: number | undefined;
  rewardLevel: number;
  started?: boolean;
  isChat?: boolean;
  reasonForDisable: string;
  videoProgress: number;
  xpLevelColor: string;
  continuingStatusShown: boolean;
  xpRewardAmount: number;
  coinRewardAmount: number;
}

export default function Bar({
  userId,
  rewardLevel,
  started,
  isChat,
  reasonForDisable,
  videoProgress,
  xpLevelColor,
  continuingStatusShown,
  xpRewardAmount,
  coinRewardAmount
}: BarProps) {
  if (!userId || !rewardLevel) {
    return null;
  }

  const progressBarStyles = useMemo(
    () => css`
      margin-top: 0;
      height: 2.7rem !important;
      margin-top: 0 !important;
      @media (max-width: ${mobileMaxWidth}) {
        font-size: ${isChat ? '1rem' : '1.2rem'};
        height: ${isChat ? '2rem' : '2.7rem'} !important;
        font-size: ${isChat ? '0.8rem' : '1.2rem'}!important;
      }
    `,
    [isChat]
  );

  const containerStyles = useMemo(
    () => css`
      height: 2.7rem;
      font-size: 1.3rem;
      @media (max-width: ${mobileMaxWidth}) {
        font-size: 1rem;
        height: ${isChat ? '2rem' : '2.7rem'};
      }
    `,
    [isChat]
  );

  const containerStyleProps = useMemo(
    () => ({
      background: continuingStatusShown
        ? Color.darkBlue()
        : Color[xpLevelColor](),
      color: '#fff',
      fontWeight: 'bold',
      display: 'flex',
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'center'
    }),
    [continuingStatusShown, xpLevelColor]
  );

  const rewardContent = useMemo(
    () => (
      <div style={{ marginLeft: '0.7rem' }}>
        {continuingStatusShown && (
          <span>
            {continueLabel}
            {deviceIsMobile && isChat ? '' : ` ${watchingLabel}`} (
          </span>
        )}
        <span>{addCommasToNumber(xpRewardAmount)} XP</span>
        {rewardLevel > 2 ? (
          <>
            {' '}
            <span>&</span>
            <Icon
              style={{ marginLeft: '0.5rem' }}
              icon={['far', 'badge-dollar']}
            />
            <span style={{ marginLeft: '0.2rem' }}>{coinRewardAmount}</span>
          </>
        ) : (
          ''
        )}
        {continuingStatusShown ? (
          <span>{`)`}</span>
        ) : (
          <span> {perMinuteLabel}</span>
        )}
      </div>
    ),
    [
      continuingStatusShown,
      xpRewardAmount,
      rewardLevel,
      coinRewardAmount,
      isChat
    ]
  );

  if (started) {
    return (
      <ProgressBar
        className={progressBarStyles}
        style={{ flexGrow: 1, width: undefined }}
        text={reasonForDisable}
        progress={videoProgress}
        color={Color[xpLevelColor]()}
        noBorderRadius
      />
    );
  }

  return (
    <div className={containerStyles} style={containerStyleProps}>
      {rewardContent}
    </div>
  );
}
