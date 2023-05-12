import React from 'react';
import ReactPlayer from 'react-player';

export default function YouTubeVideo({
  src,
  onReady,
  ...commonProps
}: {
  src: string;
  onReady: () => void;
}) {
  return <ReactPlayer {...commonProps} url={src} onReady={onReady} />;
}
