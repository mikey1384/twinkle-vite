import React from 'react';
import VideoDetails from './VideoDetails';
import SubjectDetails from './SubjectDetails';
import UrlDetails from './UrlDetails';
import AIStoryDetails from './AIStoryDetails';
import { User } from '~/types';

export default function ContentDetails({
  contentType,
  description = '',
  isListening,
  story,
  title = '',
  uploader,
  contentId,
  topic,
  thumbUrl,
  actualTitle,
  actualDescription,
  siteUrl
}: {
  audioPath?: string;
  contentType: string;
  description?: string;
  isListening?: boolean;
  story?: string;
  title?: string;
  uploader: User;
  contentId: number;
  topic?: string;
  thumbUrl?: string;
  actualTitle?: string;
  actualDescription?: string;
  siteUrl?: string;
}) {
  return (
    <>
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
        <UrlDetails
          contentId={contentId}
          title={title}
          thumbUrl={thumbUrl as string}
          actualTitle={actualTitle as string}
          actualDescription={actualDescription as string}
          siteUrl={siteUrl as string}
        />
      )}
      {contentType === 'aiStory' && story && topic && (
        <AIStoryDetails isListening={isListening} topic={topic} story={story} />
      )}
    </>
  );
}
