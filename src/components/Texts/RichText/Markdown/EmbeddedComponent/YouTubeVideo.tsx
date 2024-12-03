import React, { useEffect, useRef, useState, useMemo } from 'react';
import { css } from '@emotion/css';
import { fetchedVideoCodeFromURL } from '~/helpers/stringHelpers';
import { useContentContext } from '~/contexts';
import { useContentState } from '~/helpers/hooks';
import { mobileMaxWidth } from '~/constants/css';
import YoutubeIcon from '~/assets/YoutubeIcon.svg';
import VideoPlayer from '~/components/VideoPlayer';

export default function YouTubeVideo({
  contentType,
  contentId,
  src
}: {
  contentType?: string;
  contentId?: number | string;
  src: string;
}) {
  const timeAtRef = useRef(0);
  const PlayerRef = useRef(null);
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
        @media (max-width: ${mobileMaxWidth}) {
          min-width: 100%;
        }
      `}
    >
      {isStarted ? (
        <div
          className={css`
            position: relative;
            width: 100%;
            height: 0;
            padding-bottom: 56.25%;
          `}
        >
          <VideoPlayer
            ref={PlayerRef}
            fileType="youtube"
            src={videoCode}
            width="100%"
            height="100%"
            onProgress={(time) => {
              timeAtRef.current = time;
            }}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            playing={playing}
            initialTime={currentTime}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%'
            }}
          />
        </div>
      ) : (
        <div
          onClick={handlePlay}
          className={css`
            position: relative;
            width: 100%;
            height: 0;
            padding-bottom: 56.25%;
            cursor: pointer;
            background: url(${thumbnailUrl}) no-repeat center;
            background-size: cover;
          `}
        >
          <div
            className={css`
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              display: flex;
              justify-content: center;
              align-items: center;
            `}
          >
            <img
              loading="lazy"
              fetchPriority="low"
              style={{ height: '8rem', width: '12rem' }}
              src={YoutubeIcon}
              alt="Play YouTube video"
            />
          </div>
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
}
