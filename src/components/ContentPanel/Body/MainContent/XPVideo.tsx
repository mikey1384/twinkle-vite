import React from 'react';
import XPVideoPlayer from '~/components/XPVideoPlayer';
import { isMobile } from '~/helpers';

const displayIsMobile = isMobile(navigator);

export default function XPVideo({
  contentType,
  subjectIsAttachedToVideo,
  rewardLevel,
  byUser,
  uploader,
  contentId,
  content,
  rootId,
  rootObj
}: {
  contentType: string;
  subjectIsAttachedToVideo: boolean;
  rewardLevel: number;
  byUser: boolean;
  uploader: any;
  contentId: number;
  content: string;
  rootId: number;
  rootObj: any;
}) {
  if (contentType !== 'video' && !subjectIsAttachedToVideo) return null;
  return (
    <XPVideoPlayer
      isLink={displayIsMobile}
      rewardLevel={
        contentType === 'subject' ? rootObj.rewardLevel : rewardLevel
      }
      byUser={!!(rootObj.byUser || (contentType === 'video' && byUser))}
      uploader={rootObj.uploader || uploader}
      videoId={contentType === 'video' ? contentId : rootId}
      videoCode={contentType === 'video' ? content : rootObj.content}
      style={{ paddingBottom: '0.5rem' }}
    />
  );
}
