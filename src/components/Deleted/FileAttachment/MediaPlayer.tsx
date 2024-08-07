import React, { useEffect, useMemo, useRef } from 'react';
import ExtractedThumb from '~/components/ExtractedThumb';
import ReactPlayer from 'react-player';
import { useAppContext, useContentContext } from '~/contexts';
import { useContentState } from '~/helpers/hooks';
import { isMobile, returnImageFileFromUrl } from '~/helpers';
import { v1 as uuidv1 } from 'uuid';

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
  const uploadThumb = useAppContext((v) => v.requestHelpers.uploadThumb);
  const onSetThumbUrl = useContentContext((v) => v.actions.onSetThumbUrl);
  const onSetVideoCurrentTime = useContentContext(
    (v) => v.actions.onSetVideoCurrentTime
  );
  const { currentTime = 0 } = useContentState({
    contentType: 'chat',
    contentId: messageId
  });
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
          contentType: 'chat',
          contentId: messageId,
          currentTime: timeAtRef.current
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
        marginTop: '1rem',
        width: '100%',
        height: 'CALC(100% - 3rem)',
        position: 'relative'
      }}
    >
      {fileType !== 'audio' && !thumbUrl && (
        <ExtractedThumb
          isHidden
          src={src}
          style={{ width: '100%' }}
          onThumbnailLoad={handleThumbnailLoad}
          thumbUrl={thumbUrl}
        />
      )}
      <ReactPlayer
        light={light}
        ref={PlayerRef}
        playsinline
        onPlay={onPlay}
        onPause={onPause}
        onProgress={handleVideoProgress}
        onReady={handleReady}
        style={{
          width: '100%',
          height: '100%',
          paddingBottom:
            fileType === 'audio' || fileType === 'video' ? '1rem' : 0
        }}
        width="100%"
        height={fileType === 'video' ? '100%' : '5rem'}
        url={src}
        controls
      />
    </div>
  );

  function handleReady() {
    if (light) {
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

  function handleVideoProgress() {
    timeAtRef.current = PlayerRef.current.getCurrentTime();
  }
}
