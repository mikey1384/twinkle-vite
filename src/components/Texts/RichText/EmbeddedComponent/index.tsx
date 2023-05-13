import React, { useMemo } from 'react';
import YouTubeVideo from './YouTubeVideo';
import InternalComponent from './InternalComponent';
import {
  isValidYoutubeUrl,
  processInternalLink
} from '~/helpers/stringHelpers';

export default function EmbeddedComponent({
  contentType,
  contentId,
  src,
  alt,
  onLoad,
  ...commonProps
}: {
  contentType?: string;
  contentId?: number;
  src: string;
  alt: string;
  onLoad: () => void;
}) {
  const { isInternalLink, replacedLink } = useMemo(
    () => processInternalLink(src),
    [src]
  );
  const isYouTube = useMemo(() => isValidYoutubeUrl(src), [src]);
  return isInternalLink ? (
    <InternalComponent {...commonProps} src={replacedLink} />
  ) : isYouTube ? (
    <YouTubeVideo
      {...commonProps}
      contentType={contentType}
      contentId={contentId}
      src={src}
      onReady={onLoad}
    />
  ) : (
    <img {...commonProps} src={src} alt={alt} onLoad={onLoad} />
  );
}
