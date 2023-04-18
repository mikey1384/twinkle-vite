import React, { useEffect, useMemo, useRef } from 'react';
import Embedly from '~/components/Embedly';
import ErrorBoundary from '~/components/ErrorBoundary';
import XPVideoAdditionalInfo from './XPVideoAdditionalInfo';
import ByUserIndicator from './ByUserIndicator';
import PassNotification from './PassNotification';
import FileViewer from './FileViewer';
import XPVideo from './XPVideo';
import RewardLevelDisplay from './RewardLevelDisplay';
import ContentDisplay from './ContentDisplay';
import BottomRewardLevelDisplay from './BottomRewardLevelDisplay';
import { scrollElementToCenter } from '~/helpers';
import { getFileInfoFromFileName } from '~/helpers/stringHelpers';
import { useContentState, useTheme } from '~/helpers/hooks';
import { useKeyContext, useContentContext } from '~/contexts';
import { useNavigate } from 'react-router-dom';

export default function MainContent({
  contentId,
  contentType,
  onClickSecretAnswer,
  secretHidden,
  theme,
  userId
}: {
  contentId: number;
  contentType: string;
  onClickSecretAnswer: () => void;
  secretHidden: boolean;
  theme: string;
  userId: number;
}) {
  const ContainerRef = useRef(null);
  const navigate = useNavigate();

  const {
    byUser,
    content,
    description,
    fileName,
    filePath,
    fileSize,
    thumbUrl,
    isEditing,
    isNotification,
    rootContent,
    rootObj,
    uploader,
    rewardLevel,
    rootId,
    rootType,
    secretAnswer,
    secretAttachment,
    story,
    targetObj,
    tags,
    title
  } = useContentState({ contentId, contentType });
  const prevIsEditingRef = useRef(isEditing);
  const onAddTags = useContentContext((v) => v.actions.onAddTags);
  const onAddTagToContents = useContentContext(
    (v) => v.actions.onAddTagToContents
  );
  const onSetMediaStarted = useContentContext(
    (v) => v.actions.onSetMediaStarted
  );
  const onLoadTags = useContentContext((v) => v.actions.onLoadTags);
  const onSetIsEditing = useContentContext((v) => v.actions.onSetIsEditing);
  const { profileTheme } = useKeyContext((v) => v.myState);
  const {
    byUserIndicator: {
      color: byUserIndicatorColor,
      opacity: byUserIndicatorOpacity
    },
    byUserIndicatorText: {
      color: byUserIndicatorTextColor,
      shadow: byUserIndicatorTextShadowColor
    },
    content: { color: contentColor }
  } = useTheme(theme || profileTheme);
  const { fileType } = useMemo(
    () => (fileName ? getFileInfoFromFileName(fileName) : { fileType: '' }),
    [fileName]
  );
  const subjectIsAttachedToVideo = useMemo(
    () =>
      contentType === 'subject' &&
      rootType === 'video' &&
      rootObj &&
      !rootObj?.notFound,
    [contentType, rootObj, rootType]
  );
  const displayedContent = useMemo(
    () => content || rootContent,
    [content, rootContent]
  );

  useEffect(() => {
    if (isEditing !== prevIsEditingRef.current) {
      scrollElementToCenter(ContainerRef.current);
    }
    prevIsEditingRef.current = isEditing;
  }, [isEditing]);

  return (
    <ErrorBoundary componentPath="ContentPanel/Body/MainContent">
      <div ref={ContainerRef}>
        <PassNotification
          contentType={contentType}
          rootObj={rootObj}
          theme={theme}
          uploader={uploader}
        />
        <XPVideo
          contentType={contentType}
          subjectIsAttachedToVideo={subjectIsAttachedToVideo}
          isEditing={isEditing}
          rewardLevel={rewardLevel}
          byUser={!!byUser}
          title={title}
          uploader={uploader}
          contentId={contentId}
          content={displayedContent}
          rootId={rootId}
          rootObj={rootObj}
        />
        <XPVideoAdditionalInfo
          contentType={contentType}
          uploader={uploader}
          contentId={contentId}
          content={displayedContent}
          loggedIn={!!userId}
          onAddTags={onAddTags}
          onAddTagToContents={onAddTagToContents}
          onLoadTags={onLoadTags}
          rewardLevel={rewardLevel}
          tags={tags}
          theme={theme}
        />
        <ByUserIndicator
          contentType={contentType}
          byUser={!!byUser}
          subjectIsAttachedToVideo={subjectIsAttachedToVideo}
          byUserIndicatorColor={byUserIndicatorColor}
          byUserIndicatorOpacity={byUserIndicatorOpacity}
          byUserIndicatorTextColor={byUserIndicatorTextColor}
          byUserIndicatorTextShadowColor={byUserIndicatorTextShadowColor}
          uploader={uploader}
          filePath={filePath}
        />
        <FileViewer
          contentType={contentType}
          filePath={filePath}
          secretHidden={secretHidden}
          userId={userId}
          theme={theme}
          contentId={contentId}
          fileName={fileName}
          fileSize={fileSize}
          thumbUrl={thumbUrl}
          byUser={!!byUser}
          fileType={fileType}
          rewardLevel={rewardLevel}
          onSetMediaStarted={onSetMediaStarted}
        />
        <RewardLevelDisplay
          contentType={contentType}
          rootObj={rootObj}
          byUser={!!byUser}
          rewardLevel={rewardLevel}
          rootType={rootType}
        />
        <ContentDisplay
          contentId={contentId}
          contentType={contentType}
          isEditing={isEditing}
          content={content}
          displayedContent={displayedContent}
          description={description}
          filePath={filePath}
          navigate={navigate}
          secretAnswer={secretAnswer}
          secretAttachment={secretAttachment}
          title={title}
          theme={theme}
          onSetIsEditing={onSetIsEditing}
          uploader={uploader}
          targetObj={targetObj}
          rootId={rootId}
          contentColor={contentColor}
          story={story}
          secretHidden={secretHidden}
          isNotification={!!isNotification}
          onClickSecretAnswer={onClickSecretAnswer}
        />
        {contentType === 'url' && (
          <Embedly
            contentId={contentId}
            loadingHeight="30rem"
            mobileLoadingHeight="25rem"
          />
        )}
        <BottomRewardLevelDisplay
          contentType={contentType}
          rewardLevel={rewardLevel}
          rootObj={rootObj}
          byUser={!!byUser}
          isEditing={isEditing}
          rootType={rootType}
          secretHidden={secretHidden}
        />
      </div>
    </ErrorBoundary>
  );
}
