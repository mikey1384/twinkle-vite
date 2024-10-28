import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import VideoPlayer from '~/components/VideoPlayer';
import ErrorBoundary from '~/components/ErrorBoundary';
import XPBar from './XPBar';
import Link from '~/components/Link';
import playButtonImg from '~/assets/play-button-image.png';
import { videoRewardHash, SELECTED_LANGUAGE } from '~/constants/defaultValues';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { useContentState } from '~/helpers/hooks';
import { useAppContext, useContentContext, useKeyContext } from '~/contexts';
import { isMobile } from '~/helpers';

const intervalLength = 2000;
const deviceIsMobile = isMobile(navigator);

function XPVideoPlayer({
  isChat,
  isLink,
  byUser,
  rewardLevel = 0,
  minimized,
  onPlay,
  onVideoEnd,
  style = {},
  uploader,
  videoCode,
  videoId
}: {
  isChat?: boolean;
  isLink?: boolean;
  byUser?: boolean;
  rewardLevel?: number;
  minimized?: boolean;
  onPlay?: () => void;
  onVideoEnd?: () => void;
  style?: any;
  uploader?: any;
  videoCode?: string;
  videoId: number;
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

  const { rewardBoostLvl, userId } = useKeyContext((v) => v.myState);
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
  const youtubePlayerRef = useRef<any>(null);
  const playerStateRef = useRef<{
    getCurrentTime: () => number;
    getDuration: () => number;
    getInternalPlayer: () => any;
  }>({
    getCurrentTime: () => youtubePlayerRef.current?.getCurrentTime() || 0,
    getDuration: () => youtubePlayerRef.current?.getDuration() || 0,
    getInternalPlayer: () => youtubePlayerRef.current
  });
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

  // Update the initial playing state to match autoPlay prop
  const [playing, setPlaying] = useState(false);

  const [reachedDailyLimit, setReachedDailyLimit] = useState(false);
  const [reachedMaxWatchDuration, setReachedMaxWatchDuration] = useState(false);
  const [startingPosition, setStartingPosition] = useState(0);
  const [myViewDuration, setMyViewDuration] = useState(0);
  const requiredDurationForCoin = 60;
  const timerRef: React.MutableRefObject<any> = useRef(null);
  const timeWatchedRef = useRef(prevTimeWatched);
  const totalDurationRef = useRef(0);
  const userIdRef = useRef(userId);
  const watchCodeRef = useRef(Math.floor(Math.random() * 10_000));
  const rewardingCoin = useRef(false);
  const rewardingXP = useRef(false);
  const rewardLevelRef = useRef(0);

  const [currentInitialTime, setCurrentInitialTime] = useState<number | null>(
    null
  );

  useEffect(() => {
    init();
    async function init() {
      if (userId) {
        const { currentTime, userViewDuration } = await loadVideoCurrentTime(
          videoId
        );
        if (typeof currentTime === 'number') {
          setStartingPosition(currentTime);
          setCurrentInitialTime(currentTime);
        } else {
          setCurrentInitialTime(0);
        }
        if (userViewDuration) {
          setMyViewDuration(userViewDuration);
        }
      } else {
        setCurrentInitialTime(0);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, videoId]);

  useEffect(() => {
    userIdRef.current = userId;
    rewardLevelRef.current = rewardLevel;
    if (youtubePlayerRef.current) {
      youtubePlayerRef.current.pauseVideo();
    }
  }, [userId, rewardLevel]);

  // Update handlePlayerInit to seek first, then play
  const handlePlayerInit = useCallback(
    async (player: any) => {
      youtubePlayerRef.current = player;
      totalDurationRef.current = player.getDuration();

      if (deviceIsMobile) {
        player.pauseVideo();
      }

      if (
        totalDurationRef.current > 180 &&
        myViewDuration > totalDurationRef.current * 1.5
      ) {
        setReachedMaxWatchDuration(true);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [startingPosition, myViewDuration]
  );

  // 2. Consolidate video play handling
  const handleVideoPlay = useCallback(
    async ({ userId }: { userId: number }) => {
      if (playing) return;
      onSetMediaStarted({
        contentType: 'video',
        contentId: videoId,
        started: true
      });

      await updateCurrentlyWatching({
        watchCode: watchCodeRef.current
      });

      setPlaying(true);
      const time = youtubePlayerRef.current?.getCurrentTime() || 0;
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
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [playing, videoId]
  );

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
          display: minimized && !started ? 'none' : '',
          width: started && minimized && '39rem',
          paddingTop: started && minimized && '22rem',
          position: started && minimized && 'absolute',
          bottom: started && minimized && '1rem',
          right: started && minimized && '1rem',
          cursor: !isEditing && !started ? 'pointer' : '',
          zIndex: minimized ? 1000 : 0
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
            >
              <img
                style={{ width: '45px', height: '45px' }}
                src={playButtonImg}
              />
            </div>
          </Link>
        )}
        {!isLink && currentInitialTime !== null && (
          <VideoPlayer
            key={`videoPlayer_${videoCode}_${currentInitialTime}`}
            ref={(ref: any) => {
              if (ref) {
                playerStateRef.current = ref;
              }
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 1
            }}
            width="100%"
            height="100%"
            src={videoCode || ''}
            fileType="youtube"
            playing={playing}
            initialTime={currentInitialTime}
            onPlay={() => {
              onPlay?.();
              handleVideoPlay({ userId: userIdRef.current });
            }}
            onPause={handleVideoStop}
            onPlayerReady={handlePlayerInit}
            onEnded={() => {
              handleVideoStop();
              onVideoEnd?.();
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
          reachedDailyLimit={reachedDailyLimit}
          rewardLevel={rewardLevel}
          started={started}
          startingPosition={startingPosition}
          userId={userId}
          videoId={videoId}
        />
      )}
    </ErrorBoundary>
  );

  async function handleIncreaseMeter({ userId }: { userId: number }) {
    const timeAt = youtubePlayerRef.current?.getCurrentTime() || 0;
    const totalDuration = youtubePlayerRef.current?.getDuration() || 0;

    if (!totalDuration) return;

    checkAlreadyWatchingAnotherVideo();
    updateTotalViewDuration({
      videoId,
      currentTime: timeAt,
      totalTime: totalDuration
    });

    if (
      youtubePlayerRef.current?.isMuted() ||
      youtubePlayerRef.current?.getVolume() === 0
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
      let rewarded = false;
      if (!rewardingXP.current) {
        rewardingXP.current = true;
        try {
          const { xp, rank, maxReached, alreadyDone } = await updateUserXP({
            action: 'watch',
            target: 'video',
            amount: xpRewardAmountRef.current,
            targetId: videoId,
            totalDuration: totalDurationRef.current,
            type: 'increase'
          });
          if (maxReached) {
            setReachedDailyLimit(true);
          } else if (alreadyDone) {
            setReachedMaxWatchDuration(true);
          } else {
            onSetUserState({
              userId,
              newState: { twinkleXP: xp, rank }
            });
          }
          rewardingXP.current = false;
          rewarded = true;
        } catch (error: any) {
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
      if (rewardLevel > 2 && !rewardingCoin.current) {
        rewardingCoin.current = true;
        try {
          const { alreadyDone, coins } = await updateUserCoins({
            action: 'watch',
            target: 'video',
            amount: coinRewardAmountRef.current,
            targetId: videoId,
            totalDuration: totalDurationRef.current,
            type: 'increase'
          });
          if (alreadyDone) {
            setReachedMaxWatchDuration(true);
          } else {
            onSetUserState({ userId, newState: { twinkleCoins: coins } });
          }
          rewardingCoin.current = false;
        } catch (error: any) {
          console.error(error.response || error);
          rewardingCoin.current = false;
        }
      }
      if (rewardLevel > 2) {
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
          if (youtubePlayerRef.current) {
            youtubePlayerRef.current.pauseVideo();
          }
        }
      }
    }
  }
}

export default memo(XPVideoPlayer);
