import React from 'react';
import XPVideoPlayer from '~/components/XPVideoPlayer';
import { isMobile } from '~/helpers';

const displayIsMobile = isMobile(navigator);

interface Props {
  contentType: string;
  subjectIsAttachedToVideo: boolean;
  isEditing: boolean;
  rewardLevel: number;
  byUser: boolean;
  title: string;
  uploader: any;
  contentId: number;
  content: string;
  rootId: number;
  rootObj: any;
}
export default function XPVideo({
  contentType,
  subjectIsAttachedToVideo,
  isEditing,
  rewardLevel,
  byUser,
  title,
  uploader,
  contentId,
  content,
  rootId,
  rootObj
}: Props) {
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
