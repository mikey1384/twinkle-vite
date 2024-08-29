import React, {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { css } from '@emotion/css';
import { fetchedVideoCodeFromURL } from '~/helpers/stringHelpers';
import { useContentContext } from '~/contexts';
import { useContentState } from '~/helpers/hooks';
import { mobileMaxWidth } from '~/constants/css';
import YoutubeIcon from '~/assets/YoutubeIcon.svg';

const ReactPlayer = lazy(() => import('react-player/lazy'));

export default function YouTubeVideo({
  contentType,
  contentId,
  src,
  ...commonProps
}: {
  contentType?: string;
  contentId?: number | string;
  src: string;
}) {
  const timeAtRef = useRef(0);
  const PlayerRef: React.RefObject<any> = useRef(null);
  const onSetMediaStarted = useContentContext(
    (v) => v.actions.onSetMediaStarted
  );
  const videoCode = useMemo(() => fetchedVideoCodeFromURL(src), [src]);
  const targetKey = 'youtube' + videoCode;
  const onSetVideoCurrentTime = useContentContext(
    (v) => v.actions.onSetVideoCurrentTime
  );
  const { started, currentTime } = useContentState({
    contentType: contentType || '',
    contentId: contentId || 0,
    targetKey
  });
  const [isStarted, setIsStarted] = useState(started);
  const [playing, setPlaying] = useState(false);

  const thumbnailUrl = `https://img.youtube.com/vi/${videoCode}/0.jpg`;
  const videoUrl = useMemo(
    () =>
      `https://www.youtube.com/watch?v=${videoCode}${
        currentTime > 0 ? `?t=${currentTime}` : ''
      }`,
    [currentTime, videoCode]
  );

  useEffect(() => {
    return function setCurrentTimeBeforeUnmount() {
      if (timeAtRef.current > 0) {
        onSetVideoCurrentTime({
          contentType,
          contentId,
          targetKey,
          currentTime: timeAtRef.current
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={css`
        min-width: 80%;
        position: relative;
        padding-top: 56.25%;
        @media (max-width: ${mobileMaxWidth}) {
          min-width: 100%;
        }
      `}
    >
      {isStarted ? (
        <Suspense fallback={<div>Loading player...</div>}>
          <ReactPlayer
            {...commonProps}
            ref={PlayerRef}
            url={videoUrl}
            width="100%"
            height="100%"
            onProgress={handleVideoProgress}
            controls
            playing={playing}
            style={{
              position: 'absolute',
              top: 0,
              left: 0
            }}
            config={{
              youtube: {
                playerVars: { modestbranding: 1, rel: 0 }
              }
            }}
          />
        </Suspense>
      ) : (
        <div
          onClick={handlePlay}
          className={css`
            position: absolute;
            top: 0;
            left: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            height: 100%;
            background: url(${thumbnailUrl}) no-repeat center;
            background-size: cover;
            cursor: pointer;
          `}
        >
          <img
            loading="lazy"
            style={{ height: '8rem', width: '12rem' }}
            src={YoutubeIcon}
            alt="Play YouTube video"
          />
        </div>
      )}
    </div>
  );

  function handlePlay() {
    setIsStarted(true);
    setPlaying(true);
    if (contentType && contentId) {
      onSetMediaStarted({
        contentId,
        contentType,
        targetKey,
        started: true
      });
    }
  }

  function handleVideoProgress() {
    timeAtRef.current = PlayerRef.current.getCurrentTime();
  }
}
