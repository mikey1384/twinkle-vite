import React, { useMemo, useState } from 'react';
import ImageModal from '~/components/Modals/ImageModal';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';

const STATIC_IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'bmp'];
const TRUSTED_DOMAINS = ['cloudfront.net', 's3.amazonaws.com'];

export default function ImageComponent({
  src,
  alt,
  onSetErrorLoadingImage,
  ...commonProps
}: {
  src: string;
  alt?: string;
  onSetErrorLoadingImage: (v: boolean) => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [imageModalShown, setImageModalShown] = useState(false);

  const isSecret = alt === 'secret';

  const isInternalImage = useMemo(() => {
    try {
      const hostname = new URL(src).hostname.toLowerCase();
      return TRUSTED_DOMAINS.some(
        (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
      );
    } catch {
      return false;
    }
  }, [src]);

  const isStaticImage = useMemo(() => {
    const url = (src || '').split('?')[0].split('#')[0];
    const fileName = url.split('/').pop() || '';
    const dotIdx = fileName.lastIndexOf('.');
    const ext = dotIdx > -1 ? fileName.slice(dotIdx + 1).toLowerCase() : '';
    return STATIC_IMAGE_EXTS.includes(ext);
  }, [src]);

  const isClickable =
    isInternalImage && isStaticImage && (!isSecret || isRevealed);

  return (
    <div
      className={css`
        position: relative;
        display: inline-block;
      `}
    >
      <img
        {...commonProps}
        className={css`
          cursor: ${isClickable ? 'pointer' : 'default'};
        `}
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => onSetErrorLoadingImage(true)}
        onClick={() => {
          if (isClickable) {
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
          onClick={() => setIsRevealed(true)}
        >
          {loaded ? 'Tap to reveal image' : ''}
        </div>
      )}
      {imageModalShown && (
        <ImageModal
          onHide={() => setImageModalShown(false)}
          src={src}
          downloadable
        />
      )}
    </div>
  );
}
