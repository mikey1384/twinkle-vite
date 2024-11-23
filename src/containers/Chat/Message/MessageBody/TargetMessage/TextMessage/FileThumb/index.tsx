import React, { useMemo, useState } from 'react';
import Image from '~/components/Image';
import FileIcon from '~/components/FileIcon';
import ImageModal from '~/components/Modals/ImageModal';
import ErrorBoundary from '~/components/ErrorBoundary';
import VideoThumb from './VideoThumb';
import VideoModal from './VideoModal';
import { cloudFrontURL } from '~/constants/defaultValues';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { isMobile } from '~/helpers';

const deviceIsMobile = isMobile(navigator);

export default function FileThumb({
  filePath,
  fileName,
  fileType,
  messageId,
  thumbUrl
}: {
  filePath: string;
  fileName: string;
  fileType: string;
  messageId: number;
  thumbUrl: string;
}) {
  const src = useMemo(() => {
    if (!filePath) return '';
    return `${cloudFrontURL}/attachments/chat/${filePath}/${encodeURIComponent(
      fileName
    )}`;
  }, [fileName, filePath]);
  const [videoModalShown, setVideoModalShown] = useState(false);
  const [imageModalShown, setImageModalShown] = useState(false);

  const truncatedFileName = useMemo(() => {
    return truncateMiddle(fileName, 16);

    function truncateMiddle(str: string, maxLength: number) {
      if (str.length <= maxLength) return str;
      const midPoint = Math.floor(maxLength / 2);
      const firstHalf = str.slice(0, midPoint);
      const secondHalf = str.slice(str.length - midPoint + 1);
      return `${firstHalf}...${secondHalf}`;
    }
  }, [fileName]);

  return (
    <ErrorBoundary componentPath="Message/TargetMessage/FileThumb/index">
      <div
        className={css`
          color: ${Color.black()};
          height: 12rem;
          max-width: ${fileType === 'image' ? '12rem' : '13rem'};
          &:hover {
            color: #000;
          }
          @media (max-width: ${mobileMaxWidth}) {
            max-width: ${fileType === 'image' ? '7rem' : '8rem'};
            height: ${fileType === 'image' ? '7rem' : '11rem'};
          }
        `}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          flexDirection: 'column'
        }}
      >
        {fileType === 'image' ? (
          <Image onClick={() => setImageModalShown(true)} imageUrl={src} />
        ) : fileType === 'video' ? (
          <VideoThumb
            onClick={() => setVideoModalShown(true)}
            messageId={messageId}
            thumbUrl={thumbUrl}
            src={src}
          />
        ) : (
          <FileIcon
            onClick={() => window.open(src)}
            size={deviceIsMobile ? '4x' : '5x'}
            fileType={fileType}
          />
        )}
        {fileType !== 'image' && fileType !== 'video' && (
          <div
            style={{
              cursor: 'pointer',
              marginTop: '0.5rem',
              textAlign: 'center'
            }}
            className={css`
              font-size: 1.3rem;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1rem;
              }
            `}
            onClick={() => window.open(src)}
          >
            <p
              style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                maxWidth: '100%'
              }}
              className={css`
                min-width: 6.5rem;
                @media (max-width: ${mobileMaxWidth}) {
                  min-width: 0;
                }
              `}
            >
              {truncatedFileName}
            </p>
            <span>
              <b>Download</b>
            </span>
          </div>
        )}
      </div>
      {imageModalShown && (
        <ImageModal
          onHide={() => setImageModalShown(false)}
          fileName={fileName}
          src={src}
        />
      )}
      {videoModalShown && (
        <VideoModal
          fileName={fileName}
          messageId={messageId}
          onHide={() => setVideoModalShown(false)}
          src={src}
        />
      )}
    </ErrorBoundary>
  );
}
