import React, { useRef, useMemo, useState } from 'react';
import FileInfo from './FileInfo';
import ReactPlayer from 'react-player';
import ExtractedThumb from '~/components/ExtractedThumb';
import ImageModal from '~/components/Modals/ImageModal';
import { cloudFrontURL } from '~/constants/defaultValues';
import { getFileInfoFromFileName } from '~/helpers/stringHelpers';

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
  const [imageModalShown, setImageModalShown] = useState(false);
  const PlayerRef: React.RefObject<any> = useRef(null);
  const { fileType } = useMemo(() => getFileInfoFromFileName(src), [src]);
  const fileName = useMemo(() => src.split('/').pop() ?? '', [src]);
  const filePath = useMemo(() => {
    const srcArray = src.split('/');
    const fileName = srcArray[srcArray.length - 1];
    srcArray.pop();
    const result = [...srcArray, encodeURIComponent(fileName)].join('/');
    return result;
  }, [src]);

  return (
    <div
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
          <ReactPlayer
            playsinline
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
            light={thumbUrl}
            onReady={handleReady}
            controls
            url={`${cloudFrontURL}${src}`}
          />
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

  function handleReady() {
    if (fileType === 'video') {
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
    if (onThumbnailLoad) {
      onThumbnailLoad(thumbnails[selectedIndex]);
    }
  }
}
