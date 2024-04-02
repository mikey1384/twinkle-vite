import React, { useMemo } from 'react';
import VideoDetails from './VideoDetails';
import SubjectDetails from './SubjectDetails';
import UrlDetails from './UrlDetails';
import AIStoryDetails from './AIStoryDetails';
import { css } from '@emotion/css';
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
  const contentWidth = useMemo(() => {
    return contentType !== 'subject' &&
      contentType !== 'url' &&
      contentType !== 'aiStory'
      ? '75%'
      : '100%';
  }, [contentType]);

  return (
    <div
      className={css`
        width: ${contentWidth};
        padding-bottom: 1rem;
        padding-left: 0;
        padding-right: 0;
        ${contentType === 'url' ? 'padding-top: 0.5rem;' : ''}
      `}
    >
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
