import React, { useMemo } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import Icon from '~/components/Icon';
import { addCommasToNumber } from '~/helpers/stringHelpers';
const continueLabel = 'Continue';
const perMinuteLabel = 'per minute';

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
  const shouldRender = Boolean(userId && rewardLevel);
  const safeLevelColor = useMemo(
    () => xpLevelColor || 'logoBlue',
    [xpLevelColor]
  );
  const progressPct = useMemo(
    () => Math.max(0, Math.min(100, started ? videoProgress : 0)),
    [started, videoProgress]
  );

  const trackCls = useMemo(
    () => css`
      width: 100%;
      min-width: 0;
      height: ${isChat ? '2rem' : '2.7rem'};
      border-radius: 9999px;
      position: relative;
      background: ${Color.white()};
      border: 1px solid ${Color[safeLevelColor](0.28)};
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      @media (max-width: ${mobileMaxWidth}) {
        height: ${isChat ? '2rem' : '2.7rem'};
        font-size: ${isChat ? '0.9rem' : '1.1rem'};
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
        border-left: 0;
      }
    `,
    [isChat, safeLevelColor]
  );

  const fillCls = useMemo(
    () => css`
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: ${progressPct}%;
      background: ${Color[safeLevelColor]()};
      border-radius: 9999px;
      transition: width 0.4s ease;
    `,
    [progressPct, safeLevelColor]
  );

  const labelCls = useMemo(
    () => css`
      position: relative;
      z-index: 1;
      font-weight: 700;
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
          & <Icon icon="coins" /> {coinRewardAmount}
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

  if (!shouldRender) return null;

  const contentKey = started ? 'progress' : 'reward';

  return (
    <ErrorBoundary componentPath="XPVideoPlayer/XPBar/Bar/Inner">
      <div className={trackCls}>
        <div className={fillCls} />
        <span className={labelCls} style={{ color: labelColor }}>
          <span key={contentKey}>{labelContent}</span>
        </span>
      </div>
    </ErrorBoundary>
  );
}
