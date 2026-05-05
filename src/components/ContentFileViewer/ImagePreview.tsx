import React, { memo, useState } from 'react';
import ImageModal from '~/components/Modals/ImageModal';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

function ImagePreview({
  compactMode = false,
  isThumb,
  userIsUploader,
  src,
  originalSrc,
  fileName,
  contentType,
  contentId,
  isReplaceable
}: {
  compactMode?: boolean;
  isThumb?: boolean;
  userIsUploader?: boolean;
  src: string;
  originalSrc?: string;
  fileName: string;
  contentType?: string;
  contentId?: number;
  isReplaceable?: boolean;
}) {
  const [imageModalShown, setImageModalShown] = useState(false);
  const [imageWorks, setImageWorks] = useState(true);
  return imageWorks ? (
    <div
      style={{
        display: 'flex',
        height: '100%',
        width: isThumb ? '100%' : 'auto',
        justifyContent: isThumb ? 'center' : 'flex-start',
        alignItems: 'center'
      }}
    >
      <img
        loading="lazy"
        style={{
          maxWidth: '100%',
          maxHeight: compactMode ? undefined : '100%',
          objectFit: isThumb ? 'cover' : 'contain',
          cursor: 'pointer'
        }}
        className={css`
          height: ${compactMode ? 'auto' : '25vw'};
          max-height: ${compactMode ? '13rem' : '100%'};
          @media (max-width: ${mobileMaxWidth}) {
            height: ${compactMode ? 'auto' : '50vw'};
            max-height: ${compactMode ? '11rem' : '100%'};
          }
        `}
        src={src}
        rel={fileName}
        onClick={() => setImageModalShown(true)}
        onError={() => setImageWorks(false)}
      />
      {imageModalShown && (
        <ImageModal
          onHide={() => setImageModalShown(false)}
          userIsUploader={userIsUploader}
          fileName={fileName}
          src={src}
          downloadSrc={originalSrc || src}
          contentType={contentType}
          contentId={contentId}
          isReplaceable={isReplaceable}
        />
      )}
    </div>
  ) : null;
}

export default memo(ImagePreview);
