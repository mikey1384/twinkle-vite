import React, { useEffect, useRef } from 'react';
import ExtractedThumb from '~/components/ExtractedThumb';
import VideoPlayer from '~/components/VideoPlayer';
import { useAppContext, useContentContext } from '~/contexts';
import { useContentState } from '~/helpers/hooks';
import { returnImageFileFromUrl } from '~/helpers';
import { v1 as uuidv1 } from 'uuid';

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
      <VideoPlayer
        ref={PlayerRef}
        fileType={fileType as 'audio' | 'video'}
        initialTime={currentTime}
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
        src={src}
        height={fileType === 'video' ? '100%' : '5rem'}
      />
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
