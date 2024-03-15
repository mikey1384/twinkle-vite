import React, { useEffect, useMemo, useRef } from 'react';
import ExtractedThumb from '~/components/ExtractedThumb';
import ReactPlayer from 'react-player';
import ErrorBoundary from '~/components/ErrorBoundary';
import { v1 as uuidv1 } from 'uuid';
import { useAppContext, useContentContext } from '~/contexts';
import { useContentState } from '~/helpers/hooks';
import { isMobile, returnImageFileFromUrl } from '~/helpers';

const deviceIsMobile = isMobile(navigator);

export default function MediaPlayer({
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
  contentId?: number;
  contentType: string;
  fileType: string;
  isSecretAttachment?: boolean;
  isThumb?: boolean;
  onPause?: () => void;
  onPlay?: () => void;
  src: string;
  thumbHeight?: string | number;
  thumbUrl?: string;
  videoHeight?: string | number;
}) {
  const uploadThumb = useAppContext((v) => v.requestHelpers.uploadThumb);
  const onSetThumbUrl = useContentContext((v) => v.actions.onSetThumbUrl);
  const onSetVideoCurrentTime = useContentContext(
    (v) => v.actions.onSetVideoCurrentTime
  );
  const {
    [isSecretAttachment ? 'secretAttachmentCurrentTime' : 'currentTime']:
      currentTime = 0
  } = useContentState({ contentType, contentId: contentId as number });
  const timeAtRef = useRef(0);
  const PlayerRef: React.RefObject<any> = useRef(null);

  useEffect(() => {
    if (currentTime > 0) {
      PlayerRef.current?.seekTo(currentTime);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return function setCurrentTimeBeforeUnmount() {
      if (timeAtRef.current > 0) {
        onSetVideoCurrentTime({
          contentType,
          contentId,
          [isSecretAttachment ? 'secretAttachmentCurrentTime' : 'currentTime']:
            timeAtRef.current
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isNotLight = useMemo(
    () => fileType === 'audio' || currentTime || (!deviceIsMobile && !thumbUrl),
    [currentTime, fileType, thumbUrl]
  );

  const light = useMemo(() => {
    if (isNotLight) {
      return false;
    }
    return thumbUrl;
  }, [isNotLight, thumbUrl]);

  return (
    <div
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
        {fileType !== 'audio' && (
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
          <ReactPlayer
            light={light}
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
          />
        )}
      </ErrorBoundary>
    </div>
  );

  function handleReady() {
    if (light) {
      PlayerRef.current?.getInternalPlayer?.()?.play?.();
    }
  }

  function handleThumbnailLoad(thumb: string) {
    const file = returnImageFileFromUrl({ imageUrl: thumb });
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
