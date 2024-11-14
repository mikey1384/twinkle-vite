import React, { memo, useMemo } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/Icon';
import { videoRewardHash } from '~/constants/defaultValues';
import { useContentState } from '~/helpers/hooks';
import { useKeyContext } from '~/contexts';
import { isMobile } from '~/helpers';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import Bar from './Bar';

const deviceIsMobile = isMobile(navigator);

function XPBar({
  isChat,
  rewardLevel = 0,
  started,
  startingPosition = 0,
  userId,
  reachedMaxWatchDuration,
  reachedDailyLimit,
  videoId
}: {
  isChat?: boolean;
  rewardLevel?: number;
  started?: boolean;
  startingPosition?: number;
  userId?: number;
  reachedMaxWatchDuration: boolean;
  reachedDailyLimit: boolean;
  videoId: number;
}) {
  const watching = startingPosition > 0;
  const { rewardBoostLvl } = useKeyContext((v) => v.myState);
  const theme = useKeyContext((v) => v.theme);
  const xpLevelColor = useMemo(
    () => theme[`level${rewardLevel}`]?.color,
    [rewardLevel, theme]
  );
  const xpRewardAmount = useMemo(
    () => rewardLevel * (videoRewardHash?.[rewardBoostLvl]?.xp || 20),
    [rewardBoostLvl, rewardLevel]
  );
  const coinRewardAmount = useMemo(
    () => videoRewardHash?.[rewardBoostLvl]?.coin || 2,
    [rewardBoostLvl]
  );
  const canEarnCoins = rewardLevel >= 3;
  const {
    videoProgress = 0,
    numCoinsEarned = 0,
    numXpEarned = 0
  } = useContentState({
    contentType: 'video',
    contentId: videoId
  });

  const numXpEarnedWithComma = useMemo(
    () => addCommasToNumber(numXpEarned),
    [numXpEarned]
  );
  const numCoinsEarnedWithComma = useMemo(
    () => addCommasToNumber(numCoinsEarned),
    [numCoinsEarned]
  );

  const continuingStatusShown = useMemo(
    () => watching && !started,
    [started, watching]
  );

  const reasonForDisable = useMemo(() => {
    if (reachedMaxWatchDuration) {
      return `Max XP and Coins earned for this video`;
    } else if (reachedDailyLimit) {
      return `Daily XP and Coin limit reached`;
    } else {
      return '';
    }
  }, [reachedDailyLimit, reachedMaxWatchDuration]);

  const isMaxReached = useMemo(
    () => reachedMaxWatchDuration || reachedDailyLimit,
    [reachedDailyLimit, reachedMaxWatchDuration]
  );

  const Stars = useMemo(
    () =>
      [...Array(rewardLevel)].map((elem, index) => (
        <Icon key={index} style={{ verticalAlign: 0 }} icon="star" />
      )),
    [rewardLevel]
  );

  return userId ? (
    <ErrorBoundary componentPath="XPVideoPlayer/XPBar">
      <div
        className={css`
          display: flex;
          margin-top: 1rem;
          align-items: center;
          position: relative;
          width: 100%;
          justify-content: space-between;
        `}
      >
        <ErrorBoundary componentPath="XPVideoPlayer/XPBar/Bar">
          <Bar
            userId={userId}
            rewardLevel={rewardLevel}
            started={started}
            isChat={isChat}
            reasonForDisable={reasonForDisable}
            videoProgress={videoProgress}
            xpLevelColor={xpLevelColor}
            continuingStatusShown={continuingStatusShown}
            xpRewardAmount={xpRewardAmount}
            coinRewardAmount={coinRewardAmount}
          />
        </ErrorBoundary>
        <ErrorBoundary componentPath="XPVideoPlayer/XPBar/EarnStatus">
          {rewardLevel ? (
            <div
              className={css`
                height: 2.7rem;
                min-width: ${canEarnCoins ? `1${rewardLevel - 1}rem` : '7rem'};
                margin-left: 1rem;
                display: flex;
                @media (max-width: ${mobileMaxWidth}) {
                  min-width: 0;
                  max-width: 8.5rem;
                  height: ${isChat ? '2rem' : '2.7rem'};
                }
              `}
            >
              <div
                className={css`
                  flex-grow: 1;
                `}
              >
                <div
                  className={css`
                    height: 100%;
                    width: 100%;
                    display: flex;
                    position: relative;
                    justify-content: center;
                    align-items: center;
                    color: #fff;
                    font-size: 1.3rem;
                    font-weight: bold;
                    background: ${Color[xpLevelColor](isMaxReached ? 0.3 : 1)};
                    cursor: default;
                    @media (max-width: ${mobileMaxWidth}) {
                      flex-grow: 0;
                      width: 5rem;
                      font-size: ${numXpEarned > 0 ? '0.7rem' : '1rem'};
                    }
                  `}
                >
                  {numXpEarned > 0 && !isMaxReached
                    ? `+ ${numXpEarnedWithComma}`
                    : deviceIsMobile
                    ? `${rewardLevel}-STAR`
                    : Stars}
                </div>
              </div>
              {canEarnCoins && (
                <div>
                  <div
                    className={css`
                      height: 100%;
                      position: relative;
                      min-width: 5rem;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      font-weight: bold;
                      color: #fff;
                      font-size: ${numCoinsEarned > 0 && !isMaxReached
                        ? '1.3rem'
                        : '1.5rem'};
                      background: ${Color.brownOrange(isMaxReached ? 0.3 : 1)};
                      @media (max-width: ${mobileMaxWidth}) {
                        flex-grow: 1;
                        min-width: 3.5rem;
                        font-size: ${numCoinsEarned > 0 && !isMaxReached
                          ? '0.7rem'
                          : '1.2rem'};
                      }
                    `}
                  >
                    {numCoinsEarned > 0 && !isMaxReached ? (
                      `+ ${numCoinsEarnedWithComma}`
                    ) : (
                      <Icon size="lg" icon={['far', 'badge-dollar']} />
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  ) : null;
}

export default memo(XPBar);
