import { useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import Embedly from '~/components/Embedly';
import LongText from '~/components/Texts/LongText';
import XPVideoPlayer from '~/components/XPVideoPlayer';
import ContentEditor from './ContentEditor';
import ErrorBoundary from '~/components/ErrorBoundary';
import ContentFileViewer from '~/components/ContentFileViewer';
import LoginToViewContent from '~/components/LoginToViewContent';
import RewardLevelBar from '~/components/RewardLevelBar';
import AlreadyPosted from '~/components/AlreadyPosted';
import TagStatus from '~/components/TagStatus';
import SecretAnswer from '~/components/SecretAnswer';
import Link from '~/components/Link';
import SecretComment from '~/components/SecretComment';
import MissionContent from './MissionContent';
import { isMobile, scrollElementToCenter } from '~/helpers';
import {
  stringIsEmpty,
  getFileInfoFromFileName
} from '~/helpers/stringHelpers';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { useContentState, useTheme } from '~/helpers/hooks';
import { useAppContext, useKeyContext, useContentContext } from '~/contexts';
import { useNavigate } from 'react-router-dom';

MainContent.propTypes = {
  contentId: PropTypes.number.isRequired,
  contentType: PropTypes.string.isRequired,
  onClickSecretAnswer: PropTypes.func.isRequired,
  secretHidden: PropTypes.bool,
  theme: PropTypes.string,
  userId: PropTypes.number
};

const displayIsMobile = isMobile(navigator);

export default function MainContent({
  contentId,
  contentType,
  onClickSecretAnswer,
  secretHidden,
  theme,
  userId
}) {
  const ContainerRef = useRef(null);
  const navigate = useNavigate();
  const editContent = useAppContext((v) => v.requestHelpers.editContent);

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
  const onEditContent = useContentContext((v) => v.actions.onEditContent);
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
    () => (fileName ? getFileInfoFromFileName(fileName) : ''),
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
  const Description = useMemo(() => {
    return !stringIsEmpty(description)
      ? description
      : contentType === 'video' || contentType === 'url'
      ? title
      : '';
  }, [contentType, description, title]);
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
          <MissionContent theme={theme} uploader={uploader} rootObj={rootObj} />
        )}
        {(contentType === 'video' || subjectIsAttachedToVideo) && (
          <XPVideoPlayer
            isLink={displayIsMobile}
            rewardLevel={
              contentType === 'subject' ? rootObj.rewardLevel : rewardLevel
            }
            byUser={!!(rootObj.byUser || (contentType === 'video' && byUser))}
            onEdit={isEditing}
            title={rootObj.title || title}
            uploader={rootObj.uploader || uploader}
            videoId={contentType === 'video' ? contentId : rootId}
            videoCode={contentType === 'video' ? content : rootObj.content}
            style={{ paddingBottom: '0.5rem' }}
          />
        )}
        {contentType === 'video' && (
          <AlreadyPosted
            style={{ marginTop: '-0.5rem' }}
            uploaderId={(uploader || {}).id}
            contentId={contentId}
            contentType={contentType}
            url={content}
            videoCode={contentType === 'video' ? content : undefined}
          />
        )}
        {contentType === 'video' && (
          <TagStatus
            onAddTags={onAddTags}
            onAddTagToContents={onAddTagToContents}
            onLoadTags={onLoadTags}
            tags={tags || []}
            contentId={contentId}
            theme={theme}
          />
        )}
        {(contentType === 'url' || contentType === 'subject') && !!byUser && (
          <div
            style={{
              ...(subjectIsAttachedToVideo ? { marginTop: '0.5rem' } : {}),
              padding: '0.7rem',
              background: Color[byUserIndicatorColor](byUserIndicatorOpacity),
              color: Color[byUserIndicatorTextColor](),
              textShadow: byUserIndicatorTextShadowColor
                ? `0 0 1px ${Color[byUserIndicatorTextShadowColor]()}`
                : 'none',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontWeight: 'bold',
              fontSize: '1.7rem'
            }}
            className={css`
              margin-left: -1px;
              margin-right: -1px;
              @media (max-width: ${mobileMaxWidth}) {
                margin-left: 0;
                margin-right: 0;
              }
            `}
          >
            This was{' '}
            {contentType === 'subject' && !filePath ? 'written' : 'made'} by{' '}
            {uploader.username}
          </div>
        )}
        {(contentType === 'subject' || contentType === 'comment') &&
          filePath &&
          !(contentType === 'comment' && secretHidden) &&
          (userId ? (
            <ContentFileViewer
              theme={theme}
              contentId={contentId}
              contentType={contentType}
              fileName={fileName}
              filePath={filePath}
              fileSize={fileSize}
              thumbUrl={thumbUrl}
              onMediaPause={() =>
                onSetMediaStarted({ contentType, contentId, started: false })
              }
              onMediaPlay={() =>
                onSetMediaStarted({ contentType, contentId, started: true })
              }
              videoHeight="100%"
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginTop: byUser ? '1.7rem' : '1rem',
                ...(fileType === 'audio'
                  ? {
                      padding: '1rem'
                    }
                  : {}),
                marginBottom: rewardLevel ? '1.5rem' : 0
              }}
            />
          ) : (
            <LoginToViewContent />
          ))}
        {contentType === 'subject' && !rootObj.id && !byUser && !!rewardLevel && (
          <RewardLevelBar
            className={css`
              margin-left: -1px;
              margin-right: -1px;
              @media (max-width: ${mobileMaxWidth}) {
                margin-left: 0px;
                margin-right: 0px;
              }
            `}
            style={{
              marginBottom: rootType === 'url' ? '-0.5rem' : 0
            }}
            rewardLevel={rewardLevel}
          />
        )}
        <div
          style={{
            marginTop:
              contentType === 'subject' && filePath ? '0.5rem' : '1rem',
            marginBottom: isEditing
              ? 0
              : contentType !== 'video' && !secretHidden && '1rem',
            padding: '1rem',
            whiteSpace: 'pre-wrap',
            overflowWrap: 'break-word',
            wordBrea: 'break-word'
          }}
        >
          {isEditing ? (
            <ContentEditor
              comment={content}
              content={displayedContent}
              contentId={contentId}
              description={description}
              filePath={filePath}
              onDismiss={() =>
                onSetIsEditing({ contentId, contentType, isEditing: false })
              }
              onEditContent={handleEditContent}
              secretAnswer={secretAnswer}
              style={{
                marginTop:
                  (contentType === 'video' || contentType === 'subject') &&
                  '1rem'
              }}
              title={title}
              contentType={contentType}
            />
          ) : (
            <div>
              {contentType === 'comment' &&
                (secretHidden ? (
                  <SecretComment
                    onClick={() =>
                      navigate(`/subjects/${targetObj?.subject?.id || rootId}`)
                    }
                  />
                ) : isNotification ? (
                  <div
                    style={{
                      color: Color.gray(),
                      fontWeight: 'bold',
                      borderRadius
                    }}
                  >
                    {uploader.username} viewed the secret message
                  </div>
                ) : (
                  <div
                    style={{
                      whiteSpace: 'pre-wrap',
                      overflowWrap: 'break-word',
                      wordBreak: 'break-word'
                    }}
                  >
                    <LongText
                      contentId={contentId}
                      contentType={contentType}
                      section="content"
                      theme={theme}
                    >
                      {content}
                    </LongText>
                  </div>
                ))}
              {contentType === 'subject' && (
                <div
                  style={{
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word'
                  }}
                >
                  <Link
                    style={{
                      fontWeight: 'bold',
                      fontSize: '2.2rem',
                      color: Color[contentColor](),
                      textDecoration: 'none'
                    }}
                    to={`/subjects/${contentId}`}
                  >
                    Subject:
                  </Link>
                  <p
                    style={{
                      marginTop: '1rem',
                      marginBottom: '1rem',
                      fontWeight: 'bold',
                      fontSize: '2.2rem'
                    }}
                  >
                    {title}
                  </p>
                </div>
              )}
              {contentType !== 'comment' && (
                <div
                  style={{
                    marginTop: contentType === 'url' ? '-1rem' : 0,
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',
                    marginBottom:
                      contentType === 'url' || contentType === 'subject'
                        ? '1rem'
                        : '0.5rem'
                  }}
                >
                  <LongText
                    contentId={contentId}
                    contentType={contentType}
                    section="description"
                    theme={theme}
                  >
                    {Description}
                  </LongText>
                </div>
              )}
              {(secretAnswer || secretAttachment) && (
                <SecretAnswer
                  answer={secretAnswer}
                  theme={theme}
                  attachment={secretAttachment}
                  onClick={onClickSecretAnswer}
                  subjectId={contentId}
                  uploaderId={uploader.id}
                />
              )}
            </div>
          )}
        </div>
        {!isEditing && contentType === 'url' && (
          <Embedly
            contentId={contentId}
            loadingHeight="30rem"
            mobileLoadingHeight="25rem"
          />
        )}
        {contentType === 'subject' &&
          !!rewardLevel &&
          (!!rootObj.id || !!byUser) && (
            <RewardLevelBar
              className={css`
                margin-left: -1px;
                margin-right: -1px;
                @media (max-width: ${mobileMaxWidth}) {
                  margin-left: 0px;
                  margin-right: 0px;
                }
              `}
              style={{
                marginBottom: isEditing
                  ? '1rem'
                  : rootType === 'url' && !secretHidden
                  ? '-0.5rem'
                  : 0
              }}
              rewardLevel={rewardLevel}
            />
          )}
      </div>
    </ErrorBoundary>
  );

  async function handleEditContent(params) {
    const data = await editContent(params);
    onEditContent({ data, contentType, contentId });
  }
}
