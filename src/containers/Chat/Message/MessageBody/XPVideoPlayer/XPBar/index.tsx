import React, { memo, useMemo } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import XPProgressBar from './XPProgressBar';
import RewardLevelInfo from '../../RewardLevelInfo';
import { useContentState } from '~/helpers/hooks';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import Link from '~/components/Link';

function XPBar({
  loaded,
  playing,
  rewardLevel,
  started,
  startingPosition,
  userId,
  reachedDailyLimit,
  reachedMaxWatchDuration,
  videoId
}: {
  loaded: boolean;
  playing: boolean;
  rewardLevel: number;
  started: boolean;
  startingPosition: number;
  userId: number;
  reachedDailyLimit: boolean;
  reachedMaxWatchDuration: boolean;
  videoId: number;
}) {
  const { videoProgress = 0 } = useContentState({
    contentType: 'video',
    contentId: videoId
  });

  const reasonForDisable = useMemo(() => {
    if (reachedMaxWatchDuration) {
      return `You have earned all the XP and Coins you can earn from this video`;
    } else if (reachedDailyLimit) {
      return `You have reached your daily limit for earning XP and Coins from videos`;
    } else {
      return '';
    }
  }, [reachedDailyLimit, reachedMaxWatchDuration]);
  const isMaxReached = useMemo(
    () => reachedMaxWatchDuration || reachedDailyLimit,
    [reachedDailyLimit, reachedMaxWatchDuration]
  );

  return (
    <ErrorBoundary componentPath="Message/XPVideoPlayer/XPBar/index">
      <div
        style={{ marginTop: '1rem' }}
        className={css`
          font-size: 1.7rem;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1rem;
          }
        `}
      >
        <div
          className={css`
            display: flex;
            align-items: center;
            width: 100%;
            justify-content: space-between;
          `}
        >
          <XPProgressBar
            reasonForDisable={reasonForDisable}
            started={started}
            startingPosition={startingPosition}
            userId={userId}
            rewardLevel={rewardLevel}
            videoProgress={videoProgress}
          />
          <RewardLevelInfo
            playing={playing}
            isMaxReached={isMaxReached}
            reasonForDisable={reasonForDisable}
            rewardLevel={rewardLevel}
            videoId={videoId}
          />
        </div>
        {loaded && (
          <div
            style={{
              marginTop: '0.5rem',
              width: '100%',
              textAlign: 'center'
            }}
          >
            <Link
              className={css`
                font-weight: bold;
                font-size: 1.7rem;
                @media (max-width: ${mobileMaxWidth}) {
                  font-size: 1.3rem;
                }
              `}
              to={`/videos/${videoId}`}
            >
              Comment or post subjects about this video
            </Link>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default memo(XPBar);
