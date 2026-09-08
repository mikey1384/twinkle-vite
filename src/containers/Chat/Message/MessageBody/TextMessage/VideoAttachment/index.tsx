import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import VideoPlayer from '~/components/VideoPlayer';
import TwinkleVideo from './TwinkleVideo';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import {
  isValidYoutubeUrl,
  extractVideoIdFromTwinkleVideoUrl,
  fetchedVideoCodeFromURL
} from '~/helpers/stringHelpers';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useContentContext } from '~/contexts';
import { useContentState } from '~/helpers/hooks';
import { isMobile } from '~/helpers';

const deviceIsMobile = isMobile(navigator);

function VideoAttachment({
  messageId,
  extractedUrl,
  onHideAttachment,
  style,
  userCanEditThis
}: {
  messageId: number;
  extractedUrl: string;
  onHideAttachment?: () => void;
  style?: React.CSSProperties;
  userCanEditThis?: boolean;
}) {
  const onSetVideoCurrentTime = useContentContext(
    (v) => v.actions.onSetVideoCurrentTime
  );
  const onSetMediaStarted = useContentContext(
    (v) => v.actions.onSetMediaStarted
  );

  const { currentTime = 0 } = useContentState({
    contentType: 'chat',
    contentId: messageId
  });

  const twinkleVideoId = useMemo(
    () => extractVideoIdFromTwinkleVideoUrl(extractedUrl),
    [extractedUrl]
  );
  const [startingPosition, setStartingPosition] = useState(currentTime);
  const timeAtRef = useRef(startingPosition);

  const { notFound, title: videoTitle } = useContentState({
    contentId: Number(twinkleVideoId),
    contentType: 'video'
  });

  const isYouTube = useMemo(() => {
    return isValidYoutubeUrl(extractedUrl);
  }, [extractedUrl]);

  useEffect(() => {
    if (isYouTube) {
      setStartingPosition(currentTime);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extractedUrl]);

  useEffect(() => {
    return function setCurrentTimeBeforeUnmount() {
      if (timeAtRef.current > 0) {
        onSetVideoCurrentTime({
          contentType: 'chat',
          contentId: messageId,
          currentTime: timeAtRef.current
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePlay = useCallback(() => {
    onSetMediaStarted({
      contentType: 'chat',
      contentId: messageId,
      started: true
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageId]);

  if (twinkleVideoId && notFound) return null;
  if (!isYouTube && !twinkleVideoId) return null;

  return (
    <div
      data-chat-attachment="video"
      data-video-kind={twinkleVideoId ? 'twinkle' : 'youtube'}
      style={{
        position: 'relative',
        ...style
      }}
      className={css`
        width: 100%;
        max-width: 66rem;
        min-width: 0;
      `}
    >
      {userCanEditThis && onHideAttachment && (
        <div
          className={css`
            display: flex;
            justify-content: flex-end;
            margin-bottom: 0.4rem;
          `}
        >
          <button
            type="button"
            aria-label="Hide video attachment"
            onClick={onHideAttachment}
            className={css`
              display: inline-flex;
              align-items: center;
              gap: 0.6rem;
              min-height: 32px;
              padding: 0.4rem 0.8rem;
              border: 0;
              border-radius: 8px;
              background: transparent;
              color: #526176;
              font: inherit;
              font-size: max(12px, 1.2rem);
              cursor: pointer;
              &:hover {
                background: #f1f5f9;
                color: ${Color.black()};
              }
              &:focus-visible {
                outline: 2px solid var(--chat-focus-ring, #365b91);
                outline-offset: 2px;
              }
              @media (max-width: ${mobileMaxWidth}) {
                min-height: 44px;
              }
            `}
          >
            <Icon icon="times" />
            <span>Hide preview</span>
          </button>
        </div>
      )}
      {twinkleVideoId ? (
        <TwinkleVideo
          key={twinkleVideoId}
          messageId={messageId}
          onPlay={handlePlay}
          style={{ width: '100%', minWidth: 0 }}
          title={videoTitle}
          videoId={Number(twinkleVideoId)}
        />
      ) : (
        <div
          data-chat-video-frame
          className={css`
            position: relative;
            width: 100%;
            aspect-ratio: 16 / 9;
            overflow: hidden;
            border-radius: 10px;
            background: #0b1220;
          `}
        >
          <VideoPlayer
            style={{ position: 'absolute', inset: 0 }}
            width="100%"
            height="100%"
            src={fetchedVideoCodeFromURL(extractedUrl)}
            fileType="youtube"
            customControls={!deviceIsMobile}
            onPlay={handlePlay}
            onProgress={(currentTime) => {
              timeAtRef.current = currentTime;
            }}
            initialTime={startingPosition}
          />
        </div>
      )}
    </div>
  );
}

export default memo(VideoAttachment);
