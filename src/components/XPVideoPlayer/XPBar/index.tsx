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
  const rewardBoostLvl = useKeyContext((v) => v.myState.rewardBoostLvl);
  const xpLevelColor = useKeyContext(
    (v) => v.theme[`level${rewardLevel}`]?.color
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
        data-video-xp-bar={isChat ? 'chat' : undefined}
        className={css`
          display: flex;
          margin-top: 1rem;
          align-items: center;
          position: relative;
          width: 100%;
          justify-content: flex-start;
          gap: 0.75rem;
          overflow: hidden;
          min-width: 0;
          &[data-video-xp-bar='chat'] {
            flex-wrap: wrap;
            gap: 6px;
            overflow: visible;
            [data-video-reward-track] {
              flex: 1 1 240px;
              width: auto;
              min-height: 26px;
              height: auto;
              border-radius: 999px;
              border: 1px solid ${Color[xpLevelColor || 'logoBlue'](0.28)};
            }
            [data-video-reward-label] {
              white-space: normal;
              text-align: center;
              padding: 3px 8px;
              font-size: 12px;
              line-height: 1.4;
            }
            [data-video-earned] {
              min-width: 0;
              max-width: 100%;
              height: 26px;
              margin-left: auto;
            }
            [data-video-earned-xp],
            [data-video-earned-coins] {
              width: auto;
              min-width: 40px;
              padding: 0 8px;
              font-size: 12px;
              color: #334155;
            }
            [data-video-earned-xp] {
              background: ${Color[xpLevelColor || 'logoBlue'](0.12)};
              border-color: ${Color[xpLevelColor || 'logoBlue'](0.25)};
            }
            [data-video-earned-coins] {
              background: ${Color.brownOrange(0.12)};
              border: 1px solid ${Color.brownOrange(0.25)};
              border-left: 0;
              border-radius: 0 999px 999px 0;
            }
          }
        `}
      >
        <ErrorBoundary componentPath="XPVideoPlayer/XPBar/Bar/Outer">
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
              data-video-earned
              className={css`
                height: 2.7rem;
                min-width: ${canEarnCoins ? '10rem' : '7rem'};
                margin-left: 0;
                display: flex;
                flex: 0 0 auto;
                @media (max-width: ${mobileMaxWidth}) {
                  min-width: 0;
                  max-width: 8.5rem;
                  height: ${isChat ? '2rem' : '2.7rem'};
                }
              `}
            >
              <div
                className={css`
                  flex: 1 1 auto;
                  min-width: 0;
                `}
              >
                <div
                  data-video-earned-xp
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
                    padding: 0 1rem;
                    background: ${Color[xpLevelColor]()};
                    border: 1px solid ${Color[xpLevelColor]()};
                    border-top-left-radius: 9999px;
                    border-bottom-left-radius: 9999px;
                    ${!canEarnCoins
                      ? `border-top-right-radius: 9999px; border-bottom-right-radius: 9999px;`
                      : ''}
                    /* flattened: no shadow on white containers */
                    cursor: default;
                    @media (max-width: ${mobileMaxWidth}) {
                      padding: 0;
                      flex: 0 0 auto;
                      width: 5rem;
                      font-size: 1.1rem;
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
                    data-video-earned-coins
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
                      background: ${Color.brownOrange(
                        isMaxReached ? 0.7 : 0.6
                      )};
                      border: 1px solid
                        ${Color.brownOrange(isMaxReached ? 0.85 : 0.75)};
                      border-top-right-radius: 9999px;
                      border-bottom-right-radius: 9999px;
                      @media (max-width: ${mobileMaxWidth}) {
                        flex: 0 0 auto;
                        min-width: 3.5rem;
                        font-size: ${numCoinsEarned > 0 && !isMaxReached
                          ? '0.7rem'
                          : '1.2rem'};
                        border-top-right-radius: 0;
                        border-bottom-right-radius: 0;
                        border-right: 0;
                      }
                    `}
                  >
                    {numCoinsEarned > 0 && !isMaxReached ? (
                      `+ ${numCoinsEarnedWithComma}`
                    ) : (
                      <Icon size="lg" icon="coins" />
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
