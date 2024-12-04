import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import ExtractedThumb from '~/components/ExtractedThumb';
import ErrorBoundary from '~/components/ErrorBoundary';
import playButtonImg from '~/assets/play-button-image.png';
import VideoPlayer from '~/components/VideoPlayer';
import { v1 as uuidv1 } from 'uuid';
import { useAppContext, useContentContext } from '~/contexts';
import { isMobile, returnImageFileFromUrl } from '~/helpers';
import { useLazyLoadForImage } from '~/helpers/hooks';
import { currentTimes } from '~/constants/state';
import { css } from '@emotion/css';

const deviceIsMobile = isMobile(navigator);

function MediaPlayer({
  contentId,
  contentType,
  fileType,
  isSecretAttachment,
  isThumb,
  onPause = () => null,
  onPlay = () => null,
  src,
  thumbUrl,
  thumbHeight = '7rem',
  videoHeight
}: {
  contentId: number;
  contentType: string;
  fileType: string;
  isSecretAttachment: boolean;
  isThumb: boolean;
  onPause?: () => void;
  onPlay?: () => void;
  src: string;
  thumbUrl: string;
  thumbHeight?: string;
  videoHeight?: string;
}) {
  useLazyLoadForImage('.lazy-background', 'visible');
  const [playing, setPlaying] = useState(false);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
  const uploadThumb = useAppContext((v) => v.requestHelpers.uploadThumb);
  const onSetThumbUrl = useContentContext((v) => v.actions.onSetThumbUrl);
  const currentTime =
    currentTimes[
      `${contentType}-${contentId}${
        isSecretAttachment ? '-secretAttachment' : ''
      }`
    ] || 0;
  const timeAtRef = useRef(0);
  const PlayerRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);

  useEffect(() => {
    return function setCurrentTimeBeforeUnmount() {
      if (timeAtRef.current > 0) {
        currentTimes[
          `${contentType}-${contentId}${
            isSecretAttachment ? '-secretAttachment' : ''
          }`
        ] = timeAtRef.current;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isNotLight = useMemo(
    () => fileType === 'audio' || (!deviceIsMobile && !thumbUrl),
    [fileType, thumbUrl]
  );

  const displayedThumb = useMemo(() => {
    if (isNotLight) {
      return false;
    }
    return thumbUrl;
  }, [isNotLight, thumbUrl]);

  return (
    <div
      className={css`
        .lazy-background {
          background-image: none;
          &.visible {
            background-image: url(${displayedThumb});
          }
        }
      `}
      style={{
        marginTop: isThumb ? 0 : '1rem',
        width: '100%',
        position: 'relative'
      }}
    >
      <ErrorBoundary componentPath="ContentFileViewer/MediaPlayer/ExtractedThumb">
        {fileType !== 'audio' && !thumbUrl && (
          <ExtractedThumb
            src={src}
            isHidden={!isThumb}
            style={{ width: '100%', height: thumbHeight }}
            onThumbnailLoad={handleThumbnailLoad}
            thumbUrl={thumbUrl}
          />
        )}
      </ErrorBoundary>
      <ErrorBoundary componentPath="ContentFileViewer/MediaPlayer/VideoPlayer">
        {!isThumb && (
          <div
            style={{
              position: 'relative',
              paddingTop:
                fileType === 'video' && !isThumb
                  ? '56.25%'
                  : fileType === 'audio'
                  ? '3rem'
                  : 'auto',
              height: fileType === 'audio' ? '5rem' : 'auto'
            }}
          >
            {displayedThumb && !hasStartedPlaying ? (
              <div
                className="lazy-background"
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  top: 0,
                  right: 0,
                  left: 0,
                  bottom: 0,
                  backgroundColor: '#fff',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                onClick={handlePlay}
              >
                <img
                  loading="lazy"
                  style={{
                    width: '45px',
                    height: '45px'
                  }}
                  src={playButtonImg}
                  alt="Play"
                />
              </div>
            ) : (
              <VideoPlayer
                ref={PlayerRef}
                src={src}
                fileType={fileType as 'audio' | 'video'}
                onPlay={handlePlay}
                onPause={handlePause}
                onProgress={handleVideoProgress}
                initialTime={currentTime}
                width="100%"
                height={fileType === 'video' ? videoHeight || '100%' : '5rem'}
                playing={playing}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%'
                }}
              />
            )}
          </div>
        )}
      </ErrorBoundary>
    </div>
  );

  function handleThumbnailLoad({
    thumbnails,
    selectedIndex
  }: {
    thumbnails: string[];
    selectedIndex: number;
  }) {
    const file = returnImageFileFromUrl({
      imageUrl: thumbnails[selectedIndex]
    });
    handleUploadThumb();

    async function handleUploadThumb() {
      const thumbUrl = await uploadThumb({
        contentType,
        contentId,
        file,
        isSecretAttachment,
        path: uuidv1()
      });
      onSetThumbUrl({
        contentId,
        contentType,
        thumbUrl,
        isSecretAttachment
      });
    }
  }

  function handlePause() {
    setPlaying(false);
    onPause();
  }

  function handlePlay() {
    setPlaying(true);
    setHasStartedPlaying(true);
    onPlay();
  }

  function handleVideoProgress(currentTime: number) {
    timeAtRef.current = currentTime;
  }
}

export default memo(MediaPlayer);
