import React, { memo, useEffect, useState } from 'react';
import Icon from '~/components/Icon';
import ImageModal from '~/components/Modals/ImageModal';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { getEmbedSvgRepairImageUrl } from '~/helpers/embedSvgRepairHelpers';

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
  const [repairImageSrc, setRepairImageSrc] = useState('');
  const appliedSrc = repairImageSrc || src;
  const fileHref = originalSrc || src;

  useEffect(() => {
    setImageWorks(true);
    setRepairImageSrc('');
  }, [src]);

  if (!imageWorks) {
    return (
      <div
        className={css`
          display: flex;
          min-height: ${compactMode || isThumb ? '8rem' : '13rem'};
          width: 100%;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 0.6rem;
          padding: 1rem;
          border: 1px solid ${Color.borderGray()};
          border-radius: 0.8rem;
          background: ${Color.whiteGray()};
          color: ${Color.darkGray()};
          text-align: center;
          font-size: 1.1rem;
          font-weight: 700;
          line-height: 1.25;
        `}
      >
        <Icon style={{ fontSize: '1.8rem' }} icon="image" />
        <span>{fileName || 'Image unavailable'}</span>
        {fileHref && (
          <a
            className={css`
              color: ${Color.logoBlue()};
              font-size: 1.1rem;
              font-weight: 700;
              text-decoration: underline;
            `}
            href={fileHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => event.stopPropagation()}
          >
            Open file
          </a>
        )}
      </div>
    );
  }

  return (
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
        src={appliedSrc}
        rel={fileName}
        onClick={(event) => {
          event.stopPropagation();
          setImageModalShown(true);
        }}
        onError={handleImageError}
      />
      {imageModalShown && (
        <ImageModal
          onHide={() => setImageModalShown(false)}
          userIsUploader={userIsUploader}
          fileName={fileName}
          src={appliedSrc}
          downloadSrc={originalSrc || appliedSrc}
          contentType={contentType}
          contentId={contentId}
          isReplaceable={isReplaceable}
        />
      )}
    </div>
  );

  function handleImageError() {
    if (!repairImageSrc) {
      const nextRepairImageSrc =
        getEmbedSvgRepairImageUrl(appliedSrc) ||
        getEmbedSvgRepairImageUrl(originalSrc || '');
      if (nextRepairImageSrc) {
        setRepairImageSrc(nextRepairImageSrc);
        return;
      }
    }
    setImageWorks(false);
  }
}

export default memo(ImagePreview);
