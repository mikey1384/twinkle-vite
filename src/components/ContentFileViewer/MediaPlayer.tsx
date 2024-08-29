import React, {
  lazy,
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  Suspense
} from 'react';
import ExtractedThumb from '~/components/ExtractedThumb';
import ErrorBoundary from '~/components/ErrorBoundary';
import playButtonImg from '~/assets/play-button-image.png';
import { v1 as uuidv1 } from 'uuid';
import { useAppContext, useContentContext } from '~/contexts';
import { isMobile, returnImageFileFromUrl } from '~/helpers';
import { useLazyLoadForImage } from '~/helpers/hooks';
import { currentTimes } from '~/constants/state';
import { css } from '@emotion/css';
import type ReactPlayerType from 'react-player/lazy';

const ReactPlayer = lazy<typeof ReactPlayerType>(() =>
  import('react-player/lazy').then((module) => ({ default: module.default }))
);

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
}: any) {
  useLazyLoadForImage('.lazy-background', 'visible');
  const [playing, setPlaying] = useState(false);
  const [isPending, startTransition] = useTransition();
  const uploadThumb = useAppContext((v) => v.requestHelpers.uploadThumb);
  const onSetThumbUrl = useContentContext((v) => v.actions.onSetThumbUrl);
  const currentTime =
    currentTimes[
      `${contentType}-${contentId}${
        isSecretAttachment ? '-secretAttachment' : ''
      }`
    ] || 0;
  const timeAtRef = useRef(0);
  const PlayerRef: any = useRef(null);

  useEffect(() => {
    if (currentTime > 0) {
      PlayerRef.current?.seekTo(currentTime);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

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
        position: 'relative',
        paddingTop:
          fileType === 'video' && !isThumb
            ? '56.25%'
            : fileType === 'audio'
            ? '3rem'
            : ''
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
      <ErrorBoundary componentPath="ContentFileViewer/MediaPlayer/ReactPlayer">
        {!isThumb && (
          <>
            {displayedThumb && !playing ? (
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
                onClick={() => {
                  startTransition(() => {
                    setPlaying(true);
                  });
                }}
              >
                {isPending ? (
                  <div>Loading...</div>
                ) : (
                  <img
                    style={{
                      width: '45px',
                      height: '45px'
                    }}
                    src={playButtonImg}
                    alt="Play"
                  />
                )}
              </div>
            ) : (
              <Suspense fallback={<div>Loading player...</div>}>
                <ReactPlayer
                  ref={PlayerRef}
                  playsinline
                  onPlay={onPlay}
                  onPause={onPause}
                  onProgress={handleVideoProgress}
                  onReady={handleReady}
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    top: 0,
                    right: 0,
                    left: 0,
                    bottom: 0,
                    paddingBottom:
                      fileType === 'audio' && isSecretAttachment
                        ? '2rem'
                        : fileType === 'audio' || fileType === 'video'
                        ? '1rem'
                        : 0
                  }}
                  width="100%"
                  height={fileType === 'video' ? videoHeight || '100%' : '5rem'}
                  url={src}
                  controls
                  playing={playing}
                />
              </Suspense>
            )}
          </>
        )}
      </ErrorBoundary>
    </div>
  );

  function handleReady() {
    if (displayedThumb) {
      PlayerRef.current?.getInternalPlayer?.()?.play?.();
    }
  }

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

  function handleVideoProgress() {
    timeAtRef.current = PlayerRef.current.getCurrentTime();
  }
}

export default memo(MediaPlayer);
