import React from 'react';
import YouTubeVideo from './YouTubeVideo';
import { isValidYoutubeUrl } from '~/helpers/stringHelpers';

export default function MediaComponent({
  src,
  alt,
  onLoad,
  ...commonProps
}: {
  src: string;
  alt: string;
  onLoad: () => void;
}) {
  const isYouTube = isValidYoutubeUrl(src);
  return isYouTube ? (
    <YouTubeVideo {...commonProps} src={src} onReady={onLoad} />
  ) : (
    <img {...commonProps} src={src} alt={alt} onLoad={onLoad} />
  );
}
