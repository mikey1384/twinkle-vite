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
  createdAt,
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
  updatedAt,
  viewCount,
  publishedAt,
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
  createdAt?: number | null;
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
  updatedAt?: number | null;
  viewCount?: number;
  publishedAt?: number | null;
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
          createdAt={createdAt}
          description={description}
          favoritedAt={favoritedAt}
          forkCount={forkCount}
          isFavorited={isFavorited}
          isPublic={isPublic}
          thumbUrl={thumbUrl}
          title={title}
          updatedAt={updatedAt}
          uploader={uploader}
          viewCount={viewCount}
          publishedAt={publishedAt}
          sourceBuildId={sourceBuildId}
          contributionStatus={contributionStatus}
          rootBuildSourceBuildId={rootBuildSourceBuildId}
        />
      )}
    </>
  );
}
