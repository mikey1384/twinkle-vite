import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import ReactPlayer from 'react-player/youtube';
import ErrorBoundary from '~/components/ErrorBoundary';
import XPBar from './XPBar';
import Link from '~/components/Link';
import playButtonImg from '~/assets/play-button-image.png';
import { videoRewardHash, SELECTED_LANGUAGE } from '~/constants/defaultValues';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { useContentState } from '~/helpers/hooks';
import {
  useAppContext,
  useContentContext,
  useViewContext,
  useKeyContext
} from '~/contexts';

const intervalLength = 2000;

XPVideoPlayer.propTypes = {
  isChat: PropTypes.bool,
  isLink: PropTypes.bool,
  byUser: PropTypes.bool,
  minimized: PropTypes.bool,
  onPlay: PropTypes.func,
  rewardLevel: PropTypes.number,
  style: PropTypes.object,
  uploader: PropTypes.object.isRequired,
  videoCode: PropTypes.string.isRequired,
  videoId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
};

function XPVideoPlayer({
  isChat,
  isLink,
  byUser,
  rewardLevel,
  minimized,
  onPlay,
  style = {},
  uploader,
  videoCode,
  videoId
}) {
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const addVideoView = useAppContext((v) => v.requestHelpers.addVideoView);
  const checkCurrentlyWatchingAnotherVideo = useAppContext(
    (v) => v.requestHelpers.checkCurrentlyWatchingAnotherVideo
  );
  const finishWatchingVideo = useAppContext(
    (v) => v.requestHelpers.finishWatchingVideo
  );
  const loadVideoCurrentTime = useAppContext(
    (v) => v.requestHelpers.loadVideoCurrentTime
  );
  const updateCurrentlyWatching = useAppContext(
    (v) => v.requestHelpers.updateCurrentlyWatching
  );
  const updateUserCoins = useAppContext(
    (v) => v.requestHelpers.updateUserCoins
  );
  const updateUserXP = useAppContext((v) => v.requestHelpers.updateUserXP);
  const updateTotalViewDuration = useAppContext(
    (v) => v.requestHelpers.updateTotalViewDuration
  );

  const pageVisible = useViewContext((v) => v.state.pageVisible);
  const { rewardBoostLvl, userId, twinkleCoins } = useKeyContext(
    (v) => v.myState
  );
  const {
    byUserIndicator: {
      color: byUserIndicatorColor,
      opacity: byUserIndicatorOpacity
    },
    byUserIndicatorText: {
      color: byUserIndicatorTextColor,
      shadow: byUserIndicatorTextShadowColor
    }
  } = useKeyContext((v) => v.theme);
  const coinRewardAmount = useMemo(
    () => videoRewardHash?.[rewardBoostLvl]?.coin || 2,
    [rewardBoostLvl]
  );

  const coinRewardAmountRef = useRef(coinRewardAmount);
  useEffect(() => {
    coinRewardAmountRef.current = coinRewardAmount;
  }, [coinRewardAmount]);

  const xpRewardAmount = useMemo(
    () => (videoRewardHash?.[rewardBoostLvl]?.xp || 20) * rewardLevel,
    [rewardBoostLvl, rewardLevel]
  );
  const xpRewardAmountRef = useRef(xpRewardAmount);
  useEffect(() => {
    xpRewardAmountRef.current = xpRewardAmount;
  }, [xpRewardAmount]);
  const onIncreaseNumCoinsEarned = useContentContext(
    (v) => v.actions.onIncreaseNumCoinsEarned
  );
  const onIncreaseNumXpEarned = useContentContext(
    (v) => v.actions.onIncreaseNumXpEarned
  );
  const onSetVideoProgress = useContentContext(
    (v) => v.actions.onSetVideoProgress
  );
  const onSetMediaStarted = useContentContext(
    (v) => v.actions.onSetMediaStarted
  );
  const onSetTimeWatched = useContentContext((v) => v.actions.onSetTimeWatched);

  const {
    started,
    timeWatched: prevTimeWatched = 0,
    isEditing
  } = useContentState({
    contentType: 'video',
    contentId: videoId
  });

  const [playing, setPlaying] = useState(false);
  const [reachedMaxWatchDuration, setReachedMaxWatchDuration] = useState(false);
  const [startingPosition, setStartingPosition] = useState(0);
  const [myViewDuration, setMyViewDuration] = useState(0);
  const requiredDurationForCoin = 60;
  const PlayerRef = useRef(null);
  const timerRef = useRef(null);
  const timeWatchedRef = useRef(prevTimeWatched);
  const totalDurationRef = useRef(0);
  const userIdRef = useRef(userId);
  const watchCodeRef = useRef(Math.floor(Math.random() * 10_000));
  const rewardingCoin = useRef(false);
  const rewardingXP = useRef(false);
  const rewardLevelRef = useRef(0);
  const pageVisibleRef = useRef(pageVisible);
  const twinkleCoinsRef = useRef(twinkleCoins);

  useEffect(() => {
    pageVisibleRef.current = pageVisible;
  }, [pageVisible]);

  useEffect(() => {
    init();
    async function init() {
      if (userId) {
        const { currentTime, userViewDuration } = await loadVideoCurrentTime(
          videoId
        );
        if (currentTime) {
          setStartingPosition(currentTime);
        }
        if (userViewDuration) {
          setMyViewDuration(userViewDuration);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    twinkleCoinsRef.current = twinkleCoins;
  }, [twinkleCoins]);

  const handleVideoStop = useCallback(() => {
    setPlaying(false);
    clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    return function cleanUp() {
      handleVideoStop();
      onSetMediaStarted({
        contentType: 'video',
        contentId: videoId,
        started: false
      });
      clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  useEffect(() => {
    if (isEditing) {
      handleVideoStop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  useEffect(() => {
    userIdRef.current = userId;
    rewardLevelRef.current = rewardLevel;
    PlayerRef.current?.getInternalPlayer()?.pauseVideo?.();
  }, [userId, rewardLevel]);

  const videoUrl = useMemo(
    () =>
      `https://www.youtube.com/watch?v=${videoCode}${
        startingPosition > 0 ? `?t=${startingPosition}` : ''
      }`,
    [startingPosition, videoCode]
  );

  const onVideoReady = useCallback(() => {
    totalDurationRef.current = PlayerRef.current
      ?.getInternalPlayer?.()
      ?.getDuration?.();
    if (
      totalDurationRef.current > 180 &&
      myViewDuration > totalDurationRef.current * 1.5
    ) {
      setReachedMaxWatchDuration(true);
    }
  }, [myViewDuration]);

  const handleIncreaseMeter = useCallback(
    async ({ userId }) => {
      const timeAt = PlayerRef.current.getCurrentTime();
      if (!totalDurationRef.current) {
        onVideoReady();
      }
      checkAlreadyWatchingAnotherVideo();
      updateTotalViewDuration({
        videoId,
        currentTime: timeAt,
        totalTime: totalDurationRef.current
      });
      if (
        PlayerRef.current?.getInternalPlayer()?.isMuted?.() ||
        PlayerRef.current?.getInternalPlayer()?.getVolume?.() === 0
      ) {
        return;
      }
      if (timeWatchedRef.current >= requiredDurationForCoin && userId) {
        onSetTimeWatched({ videoId, timeWatched: 0 });
        timeWatchedRef.current = 0;
        onSetVideoProgress({
          videoId,
          progress: 0
        });
        if (
          twinkleCoinsRef.current <= 1000 &&
          rewardLevel > 2 &&
          !rewardingCoin.current
        ) {
          rewardingCoin.current = true;
          try {
            const coins = await updateUserCoins({
              action: 'watch',
              target: 'video',
              amount: coinRewardAmountRef.current,
              targetId: videoId,
              type: 'increase'
            });
            onSetUserState({ userId, newState: { twinkleCoins: coins } });
            rewardingCoin.current = false;
          } catch (error) {
            console.error(error.response || error);
            rewardingCoin.current = false;
          }
        }
        let rewarded = false;
        if (!rewardingXP.current && pageVisibleRef.current) {
          rewardingXP.current = true;
          try {
            const { xp, rank, alreadyDone } = await updateUserXP({
              action: 'watch',
              target: 'video',
              amount: xpRewardAmountRef.current,
              targetId: videoId,
              totalDuration: totalDurationRef.current,
              type: 'increase'
            });
            if (alreadyDone) {
              setReachedMaxWatchDuration(true);
            } else {
              onSetUserState({ userId, newState: { twinkleXP: xp, rank } });
            }
            rewardingXP.current = false;
            rewarded = true;
          } catch (error) {
            console.error(error.response || error);
            rewardingXP.current = false;
          }
        }
        if (rewarded) {
          onIncreaseNumXpEarned({
            videoId,
            amount: xpRewardAmountRef.current
          });
        }
        if (twinkleCoinsRef.current <= 1000 && rewardLevel > 2) {
          onIncreaseNumCoinsEarned({
            videoId,
            amount: coinRewardAmountRef.current
          });
        }
        return;
      }
      onSetTimeWatched({
        videoId,
        timeWatched: timeWatchedRef.current + intervalLength / 1000
      });
      timeWatchedRef.current = timeWatchedRef.current + intervalLength / 1000;
      onSetVideoProgress({
        videoId,
        progress: Math.floor(
          (Math.min(timeWatchedRef.current, requiredDurationForCoin) * 100) /
            requiredDurationForCoin
        )
      });

      async function checkAlreadyWatchingAnotherVideo() {
        if (rewardLevelRef.current) {
          const currentlyWatchingAnotherVideo =
            await checkCurrentlyWatchingAnotherVideo({
              rewardLevel: rewardLevelRef.current,
              watchCode: watchCodeRef.current
            });
          if (currentlyWatchingAnotherVideo) {
            PlayerRef.current?.getInternalPlayer()?.pauseVideo?.();
          }
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rewardLevel, videoId, pageVisible]
  );

  const onVideoPlay = useCallback(
    async ({ userId }) => {
      onSetMediaStarted({
        contentType: 'video',
        contentId: videoId,
        started: true
      });
      if (!playing) {
        await updateCurrentlyWatching({
          watchCode: watchCodeRef.current
        });
        setPlaying(true);
        const time = PlayerRef.current.getCurrentTime();
        if (Math.floor(time) === 0 && userId) {
          addVideoView({ videoId, userId });
        }
        clearInterval(timerRef.current);
        if (userId) {
          timerRef.current = setInterval(
            () => handleIncreaseMeter({ userId }),
            intervalLength
          );
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [handleIncreaseMeter, playing, videoId]
  );

  const thisVideoWasMadeByLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return <>{uploader?.username}님이 직접 제작한 동영상입니다</>;
    }
    return <>This video was made by {uploader?.username}</>;
  }, [uploader?.username]);

  return (
    <ErrorBoundary componentPath="XPVideoPlayer/index" style={style}>
      {byUser && !isChat && (
        <div
          className={css`
            background: ${Color[byUserIndicatorColor](byUserIndicatorOpacity)};
            display: flex;
            align-items: center;
            font-weight: bold;
            font-size: 1.5rem;
            color: ${Color[byUserIndicatorTextColor]()};
            text-shadow: ${byUserIndicatorTextShadowColor
              ? `0 0 1px ${Color[byUserIndicatorTextShadowColor]()}`
              : 'none'};
            justify-content: center;
            padding: 0.5rem;
            @media (max-width: ${mobileMaxWidth}) {
              padding: 0.3rem;
              font-size: ${isChat ? '1rem' : '1.5rem'};
            }
          `}
        >
          <div>
            {uploader.youtubeUrl ? (
              <a
                style={{
                  color: '#fff',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
                target="_blank"
                rel="noopener noreferrer"
                href={uploader.youtubeUrl}
              >
                {`Visit ${uploader.username}'s`} YouTube Channel
              </a>
            ) : (
              <span>{thisVideoWasMadeByLabel}</span>
            )}
          </div>
        </div>
      )}
      <div
        className={`${css`
          user-select: none;
          position: relative;
          padding-top: 56.25%;
        `}${minimized ? ' desktop' : ''}`}
        style={{
          display: minimized && !started && 'none',
          width: started && minimized && '39rem',
          paddingTop: started && minimized && '22rem',
          position: started && minimized && 'absolute',
          bottom: started && minimized && '1rem',
          right: started && minimized && '1rem',
          cursor: !isEditing && !started && 'pointer'
        }}
      >
        {isLink && (
          <Link to={`/videos/${videoId}`}>
            <div
              className={css`
                position: absolute;
                display: flex;
                justify-content: center;
                align-items: center;
                top: 0;
                left: 0;
                z-index: 1;
                width: 100%;
                height: 100%;
                background: url(https://img.youtube.com/vi/${videoCode}/mqdefault.jpg)
                  no-repeat center;
                background-size: 100% auto;
              `}
              alt="video_thumb"
            >
              <img
                style={{ width: '45px', height: '45px' }}
                src={playButtonImg}
              />
            </div>
          </Link>
        )}
        {!isLink && (
          <ReactPlayer
            ref={PlayerRef}
            className={css`
              position: absolute;
              top: 0;
              left: 0;
              z-index: 1;
            `}
            width="100%"
            height="100%"
            url={videoUrl}
            playing={playing}
            controls
            onReady={onVideoReady}
            onPlay={() => {
              onPlay?.();
              onVideoPlay({
                userId: userIdRef.current
              });
            }}
            onPause={handleVideoStop}
            onEnded={() => {
              handleVideoStop();
              if (userIdRef.current) {
                finishWatchingVideo(videoId);
              }
            }}
          />
        )}
      </div>
      {(!!rewardLevel || (startingPosition > 0 && !started)) && (
        <XPBar
          isChat={isChat}
          reachedMaxWatchDuration={reachedMaxWatchDuration}
          rewardLevel={rewardLevel}
          started={started}
          startingPosition={startingPosition}
          userId={userId}
          videoId={videoId}
        />
      )}
    </ErrorBoundary>
  );
}

export default memo(XPVideoPlayer);
