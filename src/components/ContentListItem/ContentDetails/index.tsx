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
  collaborationMode,
  contentType,
  description = '',
  favoritedAt,
  forkCount,
  isFavorited,
  isPublic,
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
  buildUserId,
  siteUrl
}: {
  audioPath?: string;
  collaboratorCount?: number;
  collaborationMode?: 'private' | 'contribution' | 'open_source' | null;
  contentType: string;
  description?: string;
  favoritedAt?: number | null;
  forkCount?: number;
  isFavorited?: boolean;
  isPublic?: number | boolean | null;
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
  buildUserId?: number | null;
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
          buildUserId={buildUserId}
          collaboratorCount={collaboratorCount}
          collaborationMode={collaborationMode}
          description={description}
          favoritedAt={favoritedAt}
          forkCount={forkCount}
          isFavorited={isFavorited}
          isPublic={isPublic}
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
