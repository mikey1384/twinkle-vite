import React, { useRef, useMemo, useState } from 'react';
import FileInfo from './FileInfo';
import VideoPlayer from '~/components/VideoPlayer';
import ExtractedThumb from '~/components/ExtractedThumb';
import ImageModal from '~/components/Modals/ImageModal';
import playButtonImg from '~/assets/play-button-image.png';
import { cloudFrontURL } from '~/constants/defaultValues';
import { useLazyLoadForImage } from '~/helpers/hooks';
import { getFileInfoFromFileName } from '~/helpers/stringHelpers';
import { isMobile } from '~/helpers';
import { css } from '@emotion/css';

const deviceIsMobile = isMobile(navigator);

export default function FileViewer({
  fileSize,
  isOnModal,
  onThumbnailLoad,
  small,
  src,
  style,
  thumbUrl,
  showImageModalOnClick
}: {
  fileSize?: number;
  isOnModal?: boolean;
  onThumbnailLoad?: (thumbUrl: string) => void;
  small?: boolean;
  src: string;
  style?: React.CSSProperties;
  thumbUrl?: string;
  showImageModalOnClick?: boolean;
}) {
  useLazyLoadForImage('.lazy-background', 'visible');
  const [imageModalShown, setImageModalShown] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
  const PlayerRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const { fileType } = useMemo(() => getFileInfoFromFileName(src), [src]);
  const fileName = useMemo(() => src.split('/').pop() ?? '', [src]);
  const filePath = useMemo(() => {
    const srcArray = src.split('/');
    const fileName = srcArray[srcArray.length - 1];
    srcArray.pop();
    const result = [...srcArray, encodeURIComponent(fileName)].join('/');
    return result;
  }, [src]);

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
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        ...style
      }}
    >
      {fileType === 'image' ? (
        <img
          style={{
            width: small ? '40rem' : '100%',
            height: small ? '20rem' : '100%',
            objectFit: 'contain',
            maxHeight: '50vh',
            cursor: showImageModalOnClick ? 'pointer' : 'default'
          }}
          onClick={
            showImageModalOnClick ? () => setImageModalShown(true) : undefined
          }
          loading="lazy"
          src={`${cloudFrontURL}${filePath}`}
        />
      ) : fileType === 'video' || fileType === 'audio' ? (
        <div
          style={{
            width: small ? '40rem' : '100%',
            position: 'relative',
            paddingTop:
              fileType === 'video'
                ? '56.25%'
                : fileType === 'audio'
                ? '3rem'
                : ''
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
                style={{
                  width: '45px',
                  height: '45px'
                }}
                loading="lazy"
                src={playButtonImg}
                alt="Play"
              />
            </div>
          ) : (
            <VideoPlayer
              ref={PlayerRef}
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                top: 0,
                right: 0,
                left: 0,
                bottom: 0,
                paddingBottom:
                  fileType === 'audio' || fileType === 'video' ? '1rem' : 0
              }}
              width="100%"
              height={fileType === 'video' ? '100%' : '5rem'}
              fileType={fileType as 'video' | 'audio'}
              src={`${cloudFrontURL}${src}`}
              playsInline
              playing={playing}
              onPlay={handlePlay}
              onPause={() => setPlaying(false)}
              onProgress={() => {}}
              initialTime={0}
            />
          )}
          {fileType !== 'audio' && (
            <ExtractedThumb
              src={`${cloudFrontURL}${src}`}
              style={{ width: '1px', height: '1px' }}
              onThumbnailLoad={handleThumbnailLoad}
              thumbUrl={thumbUrl}
            />
          )}
        </div>
      ) : (
        <FileInfo
          fileType={fileType}
          fileName={fileName}
          fileSize={fileSize}
          src={`${cloudFrontURL}${src}`}
        />
      )}
      {imageModalShown && (
        <ImageModal
          modalOverModal={isOnModal}
          downloadable={false}
          onHide={() => setImageModalShown(false)}
          src={`${cloudFrontURL}${filePath}`}
        />
      )}
    </div>
  );

  function handlePlay() {
    setPlaying(true);
    setHasStartedPlaying(true);
  }

  function handleThumbnailLoad({
    thumbnails,
    selectedIndex
  }: {
    thumbnails: string[];
    selectedIndex: number;
  }) {
    if (onThumbnailLoad) {
      onThumbnailLoad(thumbnails[selectedIndex]);
    }
  }
}
