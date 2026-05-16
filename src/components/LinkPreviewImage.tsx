import React, { useEffect, useState } from 'react';
import { cloudFrontURL } from '~/constants/defaultValues';

export const LINK_PREVIEW_FALLBACK_IMAGE = '/img/link.png';

export function getLinkPreviewImageSrc(
  src: unknown,
  fallbackSrc = LINK_PREVIEW_FALLBACK_IMAGE
) {
  const normalizedSrc = String(src || '').trim();
  if (!normalizedSrc) return fallbackSrc;
  if (normalizedSrc.startsWith('/thumbs')) return `${cloudFrontURL}${normalizedSrc}`;
  return normalizedSrc;
}

type LinkPreviewImageProps = Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  'onError' | 'src'
> & {
  fallbackSrc?: string;
  onFallback?: (fallbackSrc: string) => void;
  src?: unknown;
};

export default function LinkPreviewImage({
  alt = '',
  fallbackSrc = LINK_PREVIEW_FALLBACK_IMAGE,
  onFallback,
  src,
  ...props
}: LinkPreviewImageProps) {
  const appliedFallbackSrc = getLinkPreviewImageSrc(
    fallbackSrc,
    LINK_PREVIEW_FALLBACK_IMAGE
  );
  const [imageSrc, setImageSrc] = useState(() =>
    getLinkPreviewImageSrc(src, appliedFallbackSrc)
  );

  useEffect(() => {
    setImageSrc(getLinkPreviewImageSrc(src, appliedFallbackSrc));
  }, [appliedFallbackSrc, src]);

  return (
    <img
      {...props}
      alt={alt}
      src={imageSrc}
      onError={handleImageLoadError}
    />
  );

  function handleImageLoadError() {
    if (imageSrc === appliedFallbackSrc) return;
    setImageSrc(appliedFallbackSrc);
    onFallback?.(appliedFallbackSrc);
  }
}
