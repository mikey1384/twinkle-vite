import React, { memo } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import XPProgressBar from './XPProgressBar';
import RewardLevelInfo from '../../RewardLevelInfo';
import { useContentState } from '~/helpers/hooks';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import Link from '~/components/Link';

function XPBar({
  countdownNumber,
  loaded,
  playing,
  rewardLevel,
  started,
  startingPosition,
  userId,
  reachedMaxWatchDuration,
  videoId,
  xpWarningShown
}: {
  countdownNumber: number;
  loaded: boolean;
  playing: boolean;
  rewardLevel: number;
  started: boolean;
  startingPosition: number;
  userId: number;
  reachedMaxWatchDuration: boolean;
  videoId: number;
  xpWarningShown: boolean;
}) {
  const { videoProgress = 0 } = useContentState({
    contentType: 'video',
    contentId: videoId
  });

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
            playing={playing}
            started={started}
            startingPosition={startingPosition}
            userId={userId}
            rewardLevel={rewardLevel}
            videoProgress={videoProgress}
            xpWarningShown={xpWarningShown}
            countdownNumber={countdownNumber}
          />
          <RewardLevelInfo
            playing={playing}
            xpWarningShown={xpWarningShown}
            reachedMaxWatchDuration={reachedMaxWatchDuration}
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
