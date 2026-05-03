import React from 'react';
import VideoDetails from './VideoDetails';
import SubjectDetails from './SubjectDetails';
import UrlDetails from './UrlDetails';
import AIStoryDetails from './AIStoryDetails';
import DailyReflectionDetails from './DailyReflectionDetails';
import BuildDetails from './BuildDetails';
import { User } from '~/types';

export default function ContentDetails({
  collaboratorCount,
  contentType,
  description = '',
  isListening,
  question,
  story,
  title = '',
  uploader,
  contentId,
  topic,
  thumbUrl,
  actualTitle,
  actualDescription,
  sourceBuildId,
  contributionStatus,
  rootBuildSourceBuildId,
  siteUrl
}: {
  audioPath?: string;
  collaboratorCount?: number;
  contentType: string;
  description?: string;
  isListening?: boolean;
  question?: string;
  story?: string;
  title?: string;
  uploader: User;
  contentId: number;
  topic?: string;
  thumbUrl?: string;
  actualTitle?: string;
  actualDescription?: string;
  sourceBuildId?: number | null;
  contributionStatus?: string | null;
  rootBuildSourceBuildId?: number | null;
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
      {contentType === 'dailyReflection' && (
        <DailyReflectionDetails
          description={description}
          question={question}
          uploader={uploader}
        />
      )}
      {contentType === 'build' && (
        <BuildDetails
          buildId={contentId}
          collaboratorCount={collaboratorCount}
          description={description}
          title={title}
          uploader={uploader}
          sourceBuildId={sourceBuildId}
          contributionStatus={contributionStatus}
          rootBuildSourceBuildId={rootBuildSourceBuildId}
        />
      )}
    </>
  );
}
