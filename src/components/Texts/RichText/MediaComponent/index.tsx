import React, { useMemo } from 'react';
import YouTubeVideo from './YouTubeVideo';
import InternalComponent from './InternalComponent';
import {
  isValidYoutubeUrl,
  processInternalLink
} from '~/helpers/stringHelpers';

export default function MediaComponent({
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
  const { isInternalLink } = useMemo(() => processInternalLink(src), [src]);
  const isYouTube = useMemo(() => isValidYoutubeUrl(src), [src]);
  return isInternalLink ? (
    <InternalComponent />
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
