import React from 'react';
import VideoThumbImage from '~/components/VideoThumbImage';
import Loading from '~/components/Loading';

export default function VideoThumbnail({
  className,
  content,
  contentId,
  rewardLevel
}: {
  className?: string;
  content: string;
  contentId: number;
  rewardLevel: number;
}) {
  return content ? (
    <VideoThumbImage
      className={className}
      rewardLevel={rewardLevel}
      videoId={contentId}
      src={`https://img.youtube.com/vi/${content}/mqdefault.jpg`}
    />
  ) : (
    <Loading style={{ height: '10rem' }} />
  );
}
