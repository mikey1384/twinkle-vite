import React, { useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import ExtractedThumb from '~/components/ExtractedThumb';
import ReactPlayer from 'react-player';
import { v1 as uuidv1 } from 'uuid';
import { useAppContext, useContentContext } from '~/contexts';
import { useContentState } from '~/helpers/hooks';
import { isMobile, returnImageFileFromUrl } from '~/helpers';

MediaPlayer.propTypes = {
  contentId: PropTypes.number,
  contentType: PropTypes.string,
  fileType: PropTypes.string,
  isThumb: PropTypes.bool,
  isSecretAttachment: PropTypes.bool,
  onPause: PropTypes.func,
  onPlay: PropTypes.func,
  src: PropTypes.string,
  thumbUrl: PropTypes.string,
  videoHeight: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

const deviceIsMobile = isMobile(navigator);

export default function MediaPlayer({
  contentId,
  contentType,
  fileType,
  isSecretAttachment,
  isThumb,
  onPause = () => {},
  onPlay = () => {},
  src,
  thumbUrl,
  videoHeight
}) {
  const uploadThumb = useAppContext((v) => v.requestHelpers.uploadThumb);
  const onSetThumbUrl = useContentContext((v) => v.actions.onSetThumbUrl);
  const onSetVideoCurrentTime = useContentContext(
    (v) => v.actions.onSetVideoCurrentTime
  );
  const {
    [isSecretAttachment ? 'secretAttachmentCurrentTime' : 'currentTime']:
      currentTime = 0
  } = useContentState({ contentType, contentId });
  const timeAtRef = useRef(0);
  const PlayerRef = useRef(null);

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
      {fileType !== 'audio' && (
        <ExtractedThumb
          src={src}
          isHidden={!isThumb}
          style={{ width: '100%', height: '7rem' }}
          onThumbnailLoad={handleThumbnailLoad}
          thumbUrl={thumbUrl}
        />
      )}
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
    </div>
  );

  function handleReady() {
    if (light) {
      PlayerRef.current?.getInternalPlayer?.()?.play?.();
    }
  }

  function handleThumbnailLoad(thumb) {
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
