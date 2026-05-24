import React, { useEffect, useMemo, useState } from 'react';
import ImageModal from '~/components/Modals/ImageModal';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';
import { getEmbedSvgRepairImageUrl } from '~/helpers/embedSvgRepairHelpers';

const STATIC_IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'bmp'];
const TRUSTED_DOMAINS = ['cloudfront.net', 's3.amazonaws.com'];

export default function ImageComponent({
  src,
  alt,
  isPreview,
  disableImageModal,
  onSetErrorLoadingImage,
  ...commonProps
}: {
  src: string;
  alt?: string;
  isPreview?: boolean;
  disableImageModal?: boolean;
  onSetErrorLoadingImage: (v: boolean) => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [imageModalShown, setImageModalShown] = useState(false);
  const [repairImageSrc, setRepairImageSrc] = useState('');

  const isSecret = alt === 'secret';
  const appliedSrc = repairImageSrc || src;

  useEffect(() => {
    setLoaded(false);
    setRepairImageSrc('');
  }, [src]);

  const isInternalImage = useMemo(() => {
    try {
      const hostname = new URL(appliedSrc).hostname.toLowerCase();
      return TRUSTED_DOMAINS.some(
        (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
      );
    } catch {
      return false;
    }
  }, [appliedSrc]);

  const isStaticImage = useMemo(() => {
    const url = (appliedSrc || '').split('?')[0].split('#')[0];
    const fileName = url.split('/').pop() || '';
    const dotIdx = fileName.lastIndexOf('.');
    const ext = dotIdx > -1 ? fileName.slice(dotIdx + 1).toLowerCase() : '';
    return STATIC_IMAGE_EXTS.includes(ext);
  }, [appliedSrc]);

  const isClickable =
    !disableImageModal &&
    isInternalImage &&
    isStaticImage &&
    (!isSecret || isRevealed);

  return (
    <div
      className={css`
        position: relative;
        display: inline-block;
        ${isPreview
          ? `
            width: 100%;
            max-height: 18rem;
            overflow: hidden;
            border-radius: 0.8rem;
          `
          : ''}
      `}
    >
      <img
        {...commonProps}
        className={css`
          cursor: ${disableImageModal
            ? 'inherit'
            : isClickable
              ? 'pointer'
              : 'default'};
          ${isPreview
            ? `
              display: block;
              width: 100%;
              max-height: 18rem;
              object-fit: contain;
            `
            : ''}
        `}
        src={appliedSrc}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={handleImageError}
        onClick={(event) => {
          if (isClickable) {
            event.stopPropagation();
            setImageModalShown(true);
          }
        }}
      />
      {isSecret && !isRevealed && (
        <div
          className={`unselectable ${css`
            position: absolute;
            top: 0;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(255, 255, 255, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            text-align: center;
            font-weight: bold;
            font-size: 1.7rem;
            color: ${Color.black()};
            cursor: pointer;

            @supports (backdrop-filter: blur(50px)) {
              backdrop-filter: blur(50px);
            }

            @supports not (backdrop-filter: blur(50px)) {
              color: #fff;
              background: ${Color.darkerGray()};
            }
          `}`}
          onClick={(event) => {
            event.stopPropagation();
            setIsRevealed(true);
          }}
        >
          {loaded ? 'Tap to reveal image' : ''}
        </div>
      )}
      {imageModalShown && (
        <ImageModal
          onHide={() => setImageModalShown(false)}
          src={appliedSrc}
          downloadable
        />
      )}
    </div>
  );

  function handleImageError() {
    if (!repairImageSrc) {
      const nextRepairImageSrc = getEmbedSvgRepairImageUrl(appliedSrc);
      if (nextRepairImageSrc) {
        setRepairImageSrc(nextRepairImageSrc);
        return;
      }
    }
    onSetErrorLoadingImage(true);
  }
}
