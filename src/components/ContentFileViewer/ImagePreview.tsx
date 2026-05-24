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
  disableImageModal,
  isReplaceable,
  fillPreview = false,
  fillUnavailablePreview = false,
  previewObjectFit
}: {
  compactMode?: boolean;
  isThumb?: boolean;
  userIsUploader?: boolean;
  src: string;
  originalSrc?: string;
  fileName: string;
  contentType?: string;
  contentId?: number;
  disableImageModal?: boolean;
  isReplaceable?: boolean;
  fillPreview?: boolean;
  fillUnavailablePreview?: boolean;
  previewObjectFit?: React.CSSProperties['objectFit'];
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
          box-sizing: border-box;
          display: flex;
          height: ${fillUnavailablePreview ? '100%' : 'auto'};
          min-height: ${fillUnavailablePreview
            ? '100%'
            : compactMode || isThumb
              ? '8rem'
              : '13rem'};
          width: 100%;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 0.6rem;
          padding: 1rem;
          border: ${fillUnavailablePreview
            ? '0'
            : `1px solid ${Color.borderGray()}`};
          border-radius: ${fillUnavailablePreview ? '0' : '0.8rem'};
          background: ${fillUnavailablePreview
            ? 'transparent'
            : Color.whiteGray()};
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
        width: fillPreview || isThumb ? '100%' : 'auto',
        justifyContent: fillPreview || isThumb ? 'center' : 'flex-start',
        alignItems: 'center'
      }}
    >
      <img
        loading="lazy"
        style={{
          width: fillPreview ? '100%' : undefined,
          height: fillPreview ? '100%' : undefined,
          maxWidth: '100%',
          maxHeight: fillPreview ? 'none' : compactMode ? undefined : '100%',
          objectFit: fillPreview || isThumb
            ? previewObjectFit || 'cover'
            : 'contain',
          cursor: disableImageModal ? 'inherit' : 'pointer'
        }}
        className={css`
          height: ${fillPreview ? '100%' : compactMode ? 'auto' : '25vw'};
          max-height: ${fillPreview ? 'none' : compactMode ? '13rem' : '100%'};
          @media (max-width: ${mobileMaxWidth}) {
            height: ${fillPreview ? '100%' : compactMode ? 'auto' : '50vw'};
            max-height: ${fillPreview
              ? 'none'
              : compactMode
                ? '11rem'
                : '100%'};
          }
        `}
        src={appliedSrc}
        rel={fileName}
        onClick={(event) => {
          if (disableImageModal) return;
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
