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

  const [twinkleVideoId, setTwinkleVideoId] = useState(
    extractVideoIdFromTwinkleVideoUrl(extractedUrl)
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
    const extractedVideoId = extractVideoIdFromTwinkleVideoUrl(extractedUrl);
    if (extractedVideoId) {
      setTwinkleVideoId(extractedVideoId);
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

  if (notFound) return null;
  if (!isYouTube && !twinkleVideoId) return null;

  return (
    <div
      style={{
        position: 'relative',
        ...style
      }}
      className={css`
        height: 37rem;
        @media (max-width: ${mobileMaxWidth}) {
          height: 23rem;
        }
      `}
    >
      {userCanEditThis && onHideAttachment && (
        <Icon
          style={{
            right: '1rem',
            position: 'absolute',
            cursor: 'pointer',
            zIndex: 10
          }}
          onClick={onHideAttachment}
          className={css`
            color: ${Color.darkGray()};
            font-size: 2rem;
            &:hover {
              color: ${Color.black()};
            }
          `}
          icon="times"
        />
      )}
      <div
        style={{ height: '100%' }}
        className={css`
          max-width: 65%;
          height: 100%;
          position: relative;
          @media (max-width: ${mobileMaxWidth}) {
            width: 100%;
            max-width: 100%;
          }
        `}
      >
        <div
          className={css`
            width: 100%;
            height: 100%;
            > a {
              text-decoration: none;
            }
            h3 {
              font-size: 1.4rem;
            }
            p {
              font-size: 1.2rem;
              margin-top: 1rem;
            }
            @media (max-width: ${mobileMaxWidth}) {
              width: 85%;
              h3 {
                font-size: 1.3rem;
              }
              p {
                font-size: 1.1rem;
              }
            }
          `}
        >
          {twinkleVideoId ? (
            <TwinkleVideo
              messageId={messageId}
              onPlay={handlePlay}
              style={{
                height: `CALC(100% - ${deviceIsMobile ? '1' : '5'}rem)`
              }}
              title={videoTitle}
              videoId={Number(twinkleVideoId)}
            />
          ) : isYouTube ? (
            <div
              style={{
                width: '100%',
                height: deviceIsMobile ? 'CALC(100% - 2.5rem)' : '100%',
                paddingTop: deviceIsMobile ? '2.5rem' : 0
              }}
            >
              <VideoPlayer
                width={deviceIsMobile ? '33rem' : '66rem'}
                height="100%"
                src={fetchedVideoCodeFromURL(extractedUrl)}
                fileType="youtube"
                onPlay={handlePlay}
                onProgress={(currentTime) => {
                  timeAtRef.current = currentTime;
                }}
                initialTime={startingPosition}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default memo(VideoAttachment);
