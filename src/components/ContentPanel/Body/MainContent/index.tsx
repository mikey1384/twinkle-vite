import React, { useEffect, useMemo, useRef } from 'react';
import Embedly from '~/components/Embedly';
import ErrorBoundary from '~/components/ErrorBoundary';
import XPVideoAdditionalInfo from './XPVideoAdditionalInfo';
import ByUserIndicator from './ByUserIndicator';
import PassContent from '../PassContent';
import FileViewer from './FileViewer';
import XPVideo from './XPVideo';
import RewardLevelDisplay from './RewardLevelDisplay';
import ContentDisplay from './ContentDisplay';
import BottomRewardLevelDisplay from './BottomRewardLevelDisplay';
import { returnTheme, scrollElementToCenter } from '~/helpers';
import { getFileInfoFromFileName } from '~/helpers/stringHelpers';
import { useContentState } from '~/helpers/hooks';
import { useKeyContext, useContentContext } from '~/contexts';
import { useNavigate } from 'react-router-dom';
import { Content } from '~/types';

export default function MainContent({
  contentId,
  contentType,
  contentObj,
  onClickSecretAnswer,
  secretHidden,
  theme,
  userId
}: {
  contentId: number;
  contentType: string;
  contentObj: Content;
  onClickSecretAnswer: () => void;
  secretHidden: boolean;
  theme?: string;
  userId: number;
}) {
  const ContainerRef = useRef(null);
  const navigate = useNavigate();

  const contentState = useContentState({ contentId, contentType });
  const {
    byUser,
    content,
    difficulty,
    description,
    fileName,
    filePath,
    fileSize,
    thumbUrl,
    imagePath,
    imageStyle,
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
  } = contentState;
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
    }
  } = useMemo(() => returnTheme(theme || profileTheme), [profileTheme, theme]);
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
        {contentType === 'pass' && (
          <ErrorBoundary componentPath="ContentPanel/Body/MainContent/PassContent">
            <PassContent
              theme={theme}
              uploader={uploader}
              rootObj={rootObj}
              rootType={rootType}
            />
          </ErrorBoundary>
        )}
        <ErrorBoundary componentPath="ContentPanel/Body/MainContent/XPVideo">
          <XPVideo
            contentType={contentType}
            subjectIsAttachedToVideo={subjectIsAttachedToVideo}
            rewardLevel={rewardLevel}
            byUser={!!byUser}
            uploader={uploader}
            contentId={contentId}
            content={displayedContent}
            rootId={rootId}
            rootObj={rootObj}
          />
        </ErrorBoundary>
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
        <ErrorBoundary componentPath="ContentPanel/Body/MainContent/ByUserIndicator">
          <ByUserIndicator
            contentType={contentType}
            byUser={!!byUser}
            subjectIsAttachedToVideo={subjectIsAttachedToVideo}
            byUserIndicatorColor={byUserIndicatorColor}
            byUserIndicatorOpacity={byUserIndicatorOpacity || 1}
            byUserIndicatorTextColor={byUserIndicatorTextColor}
            byUserIndicatorTextShadowColor={
              byUserIndicatorTextShadowColor || ''
            }
            uploader={uploader}
            filePath={filePath}
          />
        </ErrorBoundary>
        <ErrorBoundary componentPath="ContentPanel/Body/MainContent/FileViewer">
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
        </ErrorBoundary>
        <ErrorBoundary componentPath="ContentPanel/Body/MainContent/RewardLevelDisplay">
          <RewardLevelDisplay
            contentType={contentType}
            rootObj={rootObj}
            byUser={!!byUser}
            rewardLevel={rewardLevel}
            rootType={rootType}
          />
        </ErrorBoundary>
        <ContentDisplay
          contentId={contentId}
          contentType={contentType}
          contentObj={contentObj}
          difficulty={difficulty}
          isEditing={isEditing}
          content={content}
          displayedContent={displayedContent}
          description={description}
          imagePath={imagePath}
          imageStyle={imageStyle}
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
        <ErrorBoundary componentPath="ContentPanel/Body/MainContent/BottomRewardLevelDisplay">
          <BottomRewardLevelDisplay
            contentType={contentType}
            rewardLevel={rewardLevel}
            rootObj={rootObj}
            byUser={!!byUser}
            isEditing={isEditing}
            rootType={rootType}
            secretHidden={secretHidden}
          />
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
}
