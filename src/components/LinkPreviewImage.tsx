import React, { useEffect, useState } from 'react';
import { cloudFrontURL } from '~/constants/defaultValues';
import {
  LINK_PREVIEW_FALLBACK_IMAGE,
  resolveLinkPreviewImageSrc
} from '~/helpers/linkPreviewImage';

export { LINK_PREVIEW_FALLBACK_IMAGE } from '~/helpers/linkPreviewImage';

export function getLinkPreviewImageSrc(
  src: unknown,
  fallbackSrc = LINK_PREVIEW_FALLBACK_IMAGE
) {
  return resolveLinkPreviewImageSrc({
    src,
    fallbackSrc,
    cloudFrontUrl: cloudFrontURL
  });
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
  style,
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
      style={{
        ...style,
        ...(imageSrc === appliedFallbackSrc ? { objectFit: 'contain' } : {})
      }}
      onError={handleImageLoadError}
    />
  );

  function handleImageLoadError() {
    if (imageSrc === appliedFallbackSrc) return;
    setImageSrc(appliedFallbackSrc);
    onFallback?.(appliedFallbackSrc);
  }
}
