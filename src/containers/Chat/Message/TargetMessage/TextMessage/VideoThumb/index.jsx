import React from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import YouTubeThumb from './YouTubeThumb';
import TwinkleVideoThumb from './TwinkleVideoThumb';

VideoThumb.propTypes = {
  isYouTube: PropTypes.bool,
  style: PropTypes.object,
  thumbUrl: PropTypes.string,
  messageId: PropTypes.number.isRequired,
  videoUrl: PropTypes.string
};

export default function VideoThumb({
  isYouTube,
  thumbUrl,
  messageId,
  style,
  videoUrl
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
        <TwinkleVideoThumb
          style={style}
          messageId={messageId}
          videoUrl={videoUrl}
        />
      )}
    </ErrorBoundary>
  );
}
