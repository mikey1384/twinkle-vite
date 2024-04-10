import React from 'react';
import VideoDetails from './VideoDetails';
import SubjectDetails from './SubjectDetails';
import UrlDetails from './UrlDetails';
import AIStoryDetails from './AIStoryDetails';
import { User } from '~/types';

export default function ContentDetails({
  contentType,
  description = '',
  story,
  title = '',
  uploader,
  contentId,
  topic
}: {
  contentType: string;
  description?: string;
  story?: string;
  title?: string;
  uploader: User;
  contentId: number;
  topic?: string;
}) {
  return (
    <div>
      {contentType === 'video' && (
        <VideoDetails
          description={description}
          title={title}
          uploader={uploader}
        />
      )}
      {contentType === 'subject' && (
        <SubjectDetails
          description={description}
          title={title}
          uploader={uploader}
        />
      )}
      {contentType === 'url' && (
        <UrlDetails contentId={contentId} title={title} />
      )}
      {contentType === 'aiStory' && story && topic && (
        <AIStoryDetails topic={topic} story={story} />
      )}
    </div>
  );
}
