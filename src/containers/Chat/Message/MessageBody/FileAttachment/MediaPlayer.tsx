import React, {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition
} from 'react';
import ExtractedThumb from '~/components/ExtractedThumb';
import ErrorBoundary from '~/components/ErrorBoundary';
import playButtonImg from '~/assets/play-button-image.png';
import { v1 as uuidv1 } from 'uuid';
import { useAppContext, useContentContext } from '~/contexts';
import { useLazyLoadForImage } from '~/helpers/hooks';
import { isMobile, returnImageFileFromUrl } from '~/helpers';
import { currentTimes } from '~/constants/state';
import { css } from '@emotion/css';
import VideoPlayer from '~/components/VideoPlayer';

const deviceIsMobile = isMobile(navigator);

export default function MediaPlayer({
  messageId,
  fileType,
  onPause = () => null,
  onPlay = () => null,
  src,
  thumbUrl
}: {
  messageId: number;
  fileType: string;
  onPause?: () => void;
  onPlay?: () => void;
  src: string;
  thumbUrl: string;
}) {
  useLazyLoadForImage('.lazy-background', 'visible');
  const uploadThumb = useAppContext((v) => v.requestHelpers.uploadThumb);
  const onSetThumbUrl = useContentContext((v) => v.actions.onSetThumbUrl);
  const currentTime = currentTimes[`chat-${messageId}`] || 0;
  const timeAtRef = useRef(0);
  const PlayerRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    return function setCurrentTimeBeforeUnmount() {
      if (timeAtRef.current > 0) {
        currentTimes[`chat-${messageId}`] = timeAtRef.current;
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
    <ErrorBoundary componentPath="Chat/Message/MessageBody/FileAttachment/MediaPlayer">
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
          marginTop: '1rem',
          width: '100%',
          height: 'CALC(100% - 3rem)',
          position: 'relative'
        }}
      >
        {fileType !== 'audio' && !thumbUrl && (
          <ErrorBoundary componentPath="Chat/Message/MessageBody/FileAttachment/MediaPlayer/ExtractedThumb">
            <ExtractedThumb
              isHidden
              src={src}
              style={{ width: '100%' }}
              onThumbnailLoad={handleThumbnailLoad}
              thumbUrl={thumbUrl}
            />
          </ErrorBoundary>
        )}
        <ErrorBoundary componentPath="Chat/Message/MessageBody/FileAttachment/MediaPlayer/VideoPlayer">
          <Suspense fallback={<div>Loading player...</div>}>
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
                    loading="lazy"
                    fetchPriority="low"
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
              <VideoPlayer
                ref={PlayerRef}
                initialTime={currentTime}
                fileType={fileType as 'audio' | 'video'}
                onPlay={onPlay}
                onPause={onPause}
                onProgress={handleVideoProgress}
                style={{
                  width: '100%',
                  height: '100%',
                  paddingBottom:
                    fileType === 'audio' || fileType === 'video' ? '1rem' : 0
                }}
                width="100%"
                height={fileType === 'video' ? '100%' : '5rem'}
                src={src}
                playing={playing}
              />
            )}
          </Suspense>
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
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
        contentType: 'chat',
        contentId: messageId,
        file,
        path: uuidv1()
      });
      onSetThumbUrl({
        contentId: messageId,
        contentType: 'chat',
        thumbUrl
      });
    }
  }

  function handleVideoProgress(currentTime: number) {
    timeAtRef.current = currentTime;
  }
}
