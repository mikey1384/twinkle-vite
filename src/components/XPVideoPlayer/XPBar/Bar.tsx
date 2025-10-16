import React, { useMemo } from 'react';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import Icon from '~/components/Icon';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import localize from '~/constants/localize';

const continueLabel = localize('continue');
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
  if (!userId || !rewardLevel) return null;

  const trackCls = useMemo(
    () => css`
      width: 100%;
      min-width: 0;
      height: ${isChat ? '2rem' : '2.7rem'};
      border-radius: 9999px;
      position: relative;
      background: ${Color.white()};
      border: 1px solid ${Color[xpLevelColor](0.28)};
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      @media (max-width: ${mobileMaxWidth}) {
        height: ${isChat ? '2rem' : '2.7rem'};
        font-size: ${isChat ? '0.9rem' : '1.1rem'};
      }
    `,
    [isChat, xpLevelColor]
  );

  const fillCls = useMemo(
    () => css`
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: ${Math.max(0, Math.min(100, started ? videoProgress : 0))}%;
      background: ${Color[xpLevelColor]()};
      border-radius: 9999px;
      transition: width 0.4s ease;
    `,
    [started, videoProgress, xpLevelColor]
  );

  const labelCls = useMemo(
    () => css`
      position: relative;
      z-index: 1;
      font-weight: 700;
      text-shadow: 0 1px 1px rgba(0, 0, 0, 0.25);
      white-space: nowrap;
      padding: 0 0.75rem;
      font-size: ${isChat ? '1rem' : '1.2rem'};
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    `,
    [isChat]
  );

  const labelColor = useMemo(
    () =>
      started && Math.round(videoProgress) >= 50 ? '#fff' : Color.darkGray(),
    [started, videoProgress]
  );

  const labelContent = useMemo(() => {
    if (started) {
      return reasonForDisable || `${Math.round(videoProgress)}%`;
    }
    const xpText = `${addCommasToNumber(xpRewardAmount)} XP`;
    const coinFrag =
      rewardLevel > 2 ? (
        <>
          & <Icon icon={['far', 'badge-dollar']} /> {coinRewardAmount}
        </>
      ) : null;
    const prefix = continuingStatusShown ? `${continueLabel} · ` : '';
    return (
      <>
        {prefix}
        {xpText} {coinFrag} <span>&nbsp;{perMinuteLabel}</span>
      </>
    );
  }, [
    started,
    reasonForDisable,
    videoProgress,
    xpRewardAmount,
    rewardLevel,
    coinRewardAmount,
    continuingStatusShown
  ]);

  return (
    <div className={trackCls}>
      <div className={fillCls} />
      <span className={labelCls} style={{ color: labelColor }}>
        {labelContent}
      </span>
    </div>
  );
}
