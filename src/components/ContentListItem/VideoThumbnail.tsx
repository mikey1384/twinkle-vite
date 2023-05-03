import React from 'react';
import PropTypes from 'prop-types';
import VideoThumbImage from '~/components/VideoThumbImage';
import Loading from '~/components/Loading';

VideoThumbnail.propTypes = {
  content: PropTypes.string,
  contentId: PropTypes.number.isRequired,
  rewardLevel: PropTypes.number.isRequired
};
export default function VideoThumbnail({
  content,
  contentId,
  rewardLevel
}: {
  content: string;
  contentId: number;
  rewardLevel: number;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '25%'
      }}
    >
      {content ? (
        <VideoThumbImage
          rewardLevel={rewardLevel}
          videoId={contentId}
          src={`https://img.youtube.com/vi/${content}/mqdefault.jpg`}
        />
      ) : (
        <Loading style={{ height: '10rem' }} />
      )}
    </div>
  );
}
