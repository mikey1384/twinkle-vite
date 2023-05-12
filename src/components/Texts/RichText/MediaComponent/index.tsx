import React from 'react';
import ReactPlayer from 'react-player';
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
    <ReactPlayer {...commonProps} url={src} onReady={onLoad} />
  ) : (
    <img {...commonProps} src={src} alt={alt} onLoad={onLoad} />
  );
}
