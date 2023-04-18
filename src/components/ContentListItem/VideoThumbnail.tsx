import React from 'react';
import VideoThumbImage from '~/components/VideoThumbImage';
import Loading from '~/components/Loading';

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
