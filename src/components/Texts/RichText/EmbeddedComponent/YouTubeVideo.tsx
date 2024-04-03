import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import { isMobile } from '~/helpers';
import { css } from '@emotion/css';
import { fetchedVideoCodeFromURL } from '~/helpers/stringHelpers';
import { useContentContext } from '~/contexts';
import { useContentState } from '~/helpers/hooks';
import { mobileMaxWidth } from '~/constants/css';
import YoutubeIcon from '~/assets/YoutubeIcon.svg';

const displayIsMobile = isMobile(navigator);

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
  const [isStarted, setIsStarted] = useState(!displayIsMobile || started);
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
        <ReactPlayer
          {...commonProps}
          ref={PlayerRef}
          url={videoUrl}
          width="100%"
          height="100%"
          onProgress={handleVideoProgress}
          controls
          style={{
            position: 'absolute',
            top: 0,
            left: 0
          }}
        />
      ) : (
        <div
          onClick={() => {
            setIsStarted(true);
            if (contentType && contentId) {
              onSetMediaStarted({
                contentId,
                contentType,
                targetKey,
                started: true
              });
            }
          }}
          className={css`
            position: absolute;
            top: 0;
            left: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            height: 100%;
            background: url(https://i.ytimg.com/vi/${videoCode}/mqdefault.jpg)
              no-repeat center;
            background-size: cover;
          `}
        >
          <img style={{ height: '8rem', width: '12rem' }} src={YoutubeIcon} />
        </div>
      )}
    </div>
  );

  function handleVideoProgress() {
    timeAtRef.current = PlayerRef.current.getCurrentTime();
  }
}
