import React from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import YouTubeThumb from './YouTubeThumb';
import TwinkleVideoThumb from './TwinkleVideoThumb';

export default function VideoThumb({
  isYouTube,
  thumbUrl,
  messageId,
  style,
  videoUrl
}: {
  isYouTube: boolean;
  thumbUrl: string;
  messageId: number;
  style: React.CSSProperties;
  videoUrl: string;
}) {
  return (
    <ErrorBoundary componentPath="Message/TargetMessage/VideoThumb/index">
      {isYouTube ? (
        <YouTubeThumb
          messageId={messageId}
          style={style}
          thumbUrl={thumbUrl}
          videoUrl={videoUrl}
        />
      ) : (
        <TwinkleVideoThumb messageId={messageId} videoUrl={videoUrl} />
      )}
    </ErrorBoundary>
  );
}
