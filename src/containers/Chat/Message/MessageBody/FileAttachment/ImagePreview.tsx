import React, { useState } from 'react';
import ImageModal from '~/components/Modals/ImageModal';
import ErrorBoundary from '~/components/ErrorBoundary';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

export default function ImagePreview({
  src,
  fileName,
  onSetImageWorks
}: {
  src: string;
  fileName: string;
  onSetImageWorks: (works: boolean) => void;
}) {
  const [imageModalShown, setImageModalShown] = useState(false);
  return (
    <ErrorBoundary componentPath="Chat/Message/MessageBody/FileAttachment/ImagePreview">
      <div
        style={{
          display: 'flex',
          height: '100%',
          width: 'auto',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <img
          loading="lazy"
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            cursor: 'pointer'
          }}
          className={css`
            height: 25vw;
            @media (max-width: ${mobileMaxWidth}) {
              height: 50vw;
            }
          `}
          src={src}
          rel={fileName}
          onClick={() => setImageModalShown(true)}
          onError={() => onSetImageWorks(false)}
        />
        {imageModalShown && (
          <ImageModal
            onHide={() => setImageModalShown(false)}
            fileName={fileName}
            src={src}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
