import React from 'react';
import YouTubeVideo from './YouTubeVideo';
import { isValidYoutubeUrl } from '~/helpers/stringHelpers';

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
  const isYouTube = isValidYoutubeUrl(src);
  return isYouTube ? (
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
