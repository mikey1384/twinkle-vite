import React, { useEffect, useMemo, useRef, useState } from 'react';
import Context from './Context';
import ErrorBoundary from '~/components/ErrorBoundary';
import Heading from './Heading';
import Loading from '~/components/Loading';
import ContentListItem from '~/components/ContentListItem';
import Body from './Body';
import TargetContent from './TargetContent';
import Embedly from '~/components/Embedly';
import Profile from './Profile';
import TargetPassContent from './TargetPassContent';
import TargetDailyGoalsContent from './TargetDailyGoalsContent';
import TargetSharedTopicContent from './TargetSharedTopicContent';
import TargetDailyReflectionContent from './TargetDailyReflectionContent';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth, borderRadius } from '~/constants/css';
import { placeholderHeights } from '~/constants/state';
import { useContentState, useLazyLoad } from '~/helpers/hooks';
import { useAppContext, useContentContext, useKeyContext } from '~/contexts';
import { useNavigate } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
const urlCss = css`
  padding: 1rem;
  background: #fff;
  border: 1px solid var(--ui-border);
  border-radius: ${borderRadius};
  margin-top: 0.8rem;
  transition: border-color 0.18s ease;
  &:hover {
    border-color: var(--ui-border-strong);
  }
  @media (max-width: ${mobileMaxWidth}) {
    border: none;
    border-radius: 0;
    margin-left: 0;
    margin-right: 0;
    &:hover {
      border-color: var(--ui-border);
    }
  }
`;

// Tucked profile target container to visually attach under main panel
const profileTargetCss = css`
  cursor: pointer;
  background: #fff;
  border: 1px solid var(--ui-border);
  border-radius: 0 0 ${borderRadius} ${borderRadius};
  /* No outer padding: inner Profile provides its own padding */
  @media (max-width: ${mobileMaxWidth}) {
    border: none;
    border-radius: 0;
    margin-left: 0;
    margin-right: 0;
  }
`;

// Wrapper removed: ContentListItem now renders its own themed border

export default function ContentPanel({
  alwaysShow,
  autoExpand,
  className,
  commentsLoadLimit,
  feedId,
  contentId,
  contentType,
  rootType,
  numPreviewComments = 0,
  style = {},
  showActualDate,
  theme,
  zIndex = 1,
  isContentPage
}: {
  alwaysShow?: boolean;
  autoExpand?: boolean;
  className?: string;
  commentsLoadLimit?: number;
  feedId?: number;
  contentId: number;
  contentType: string;
  rootType?: string;
  numPreviewComments?: number;
  style?: React.CSSProperties;
  showActualDate?: boolean;
  theme?: string;
  zIndex?: number;
  isContentPage?: boolean;
}) {
  const previousPlaceholderHeight = useMemo(
    () => placeholderHeights[`${contentType}-${contentId}`],
    [contentId, contentType]
  );
  const [ComponentRef, inView] = useInView();
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  const PanelRef = useRef(null);
  const navigate = useNavigate();
  const loadContent = useAppContext((v) => v.requestHelpers.loadContent);
  const onAddTags = useContentContext((v) => v.actions.onAddTags);
  const onAddTagToContents = useContentContext(
    (v) => v.actions.onAddTagToContents
  );
  const onChangeSpoilerStatus = useContentContext(
    (v) => v.actions.onChangeSpoilerStatus
  );
  const onDeleteComment = useContentContext((v) => v.actions.onDeleteComment);
  const onDeleteContent = useContentContext((v) => v.actions.onDeleteContent);
  const onEditComment = useContentContext((v) => v.actions.onEditComment);
  const onEditContent = useContentContext((v) => v.actions.onEditContent);
  const onEditRewardComment = useContentContext(
    (v) => v.actions.onEditRewardComment
  );
  const onInitContent = useContentContext((v) => v.actions.onInitContent);
  const onLikeContent = useContentContext((v) => v.actions.onLikeContent);
  const onLoadComments = useContentContext((v) => v.actions.onLoadComments);
  const onLoadMoreComments = useContentContext(
    (v) => v.actions.onLoadMoreComments
  );
  const onLoadMoreReplies = useContentContext(
    (v) => v.actions.onLoadMoreReplies
  );
  const onLoadRepliesOfReply = useContentContext(
    (v) => v.actions.onLoadRepliesOfReply
  );
  const onLoadTags = useContentContext((v) => v.actions.onLoadTags);
  const onSetByUserStatus = useContentContext(
    (v) => v.actions.onSetByUserStatus
  );
  const onSetCommentsShown = useContentContext(
    (v) => v.actions.onSetCommentsShown
  );
  const onSetRewardLevel = useContentContext((v) => v.actions.onSetRewardLevel);
  const onShowTCReplyInput = useContentContext(
    (v) => v.actions.onShowTCReplyInput
  );
  const onUploadTargetComment = useContentContext(
    (v) => v.actions.onUploadTargetComment
  );
  const onUploadComment = useContentContext((v) => v.actions.onUploadComment);
  const onUploadReply = useContentContext((v) => v.actions.onUploadReply);
  const contentState = useContentState({ contentType, contentId });
  const {
    commentId,
    commentsShown,
    loaded,
    rootType: rootTypeFromState,
    started,
    targetObj,
    rootId
  } = contentState;

  const appliedRootType = useMemo(
    () => rootTypeFromState || rootType,
    [rootType, rootTypeFromState]
  );
  // Normalize pass types for content state lookup
  const normalizedRootType = useMemo(
    () =>
      appliedRootType === 'missionPass' || appliedRootType === 'achievementPass'
        ? 'pass'
        : appliedRootType,
    [appliedRootType]
  );
  const rootObj = useContentState({
    contentType: normalizedRootType,
    contentId: rootId
  });
  const placeholderHeightRef = useRef(previousPlaceholderHeight);
  const [placeholderHeight, setPlaceholderHeight] = useState(
    previousPlaceholderHeight
  );
  const [isVisible, setIsVisible] = useState(false);
  useLazyLoad({
    inView,
    PanelRef,
    onSetIsVisible: setIsVisible,
    onSetPlaceholderHeight: (height: number) => {
      setPlaceholderHeight(height);
      placeholderHeightRef.current = height;
    }
  });
  const loading = useRef(false);
  const inputAtBottom = contentType === 'comment';
  const { started: rootStarted } = useContentState({
    contentType: normalizedRootType,
    contentId: rootId
  });

  useEffect(() => {
    return function cleanUp() {
      placeholderHeights[`${contentType}-${contentId}`] =
        placeholderHeightRef.current;
    };
  }, [contentId, contentType]);

  useEffect(() => {
    if (!loaded && !loading.current && contentId) {
      onMount();
    }
    async function onMount() {
      loading.current = true;
      const data = await loadContent({
        contentId,
        contentType,
        rootType: appliedRootType
      });
      onInitContent({
        ...(feedId ? { ...data, feedId } : data)
      });
      if (data.rootObj) {
        onInitContent({
          contentId: data.rootId,
          contentType: data.rootType,
          ...data.rootObj
        });
      }
      loading.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  const contentShown = useMemo(
    () => alwaysShow || inView || isVisible || started || rootStarted,
    [alwaysShow, inView, isVisible, rootStarted, started]
  );

  const componentHeight = useMemo(() => {
    return placeholderHeight || '15rem';
  }, [placeholderHeight]);

  const contentHeight = useMemo(() => {
    return !loaded ? '15rem' : '';
  }, [loaded]);

  const targetTuckMargin = 'calc(-1rem - 1px)';
  const alignTopWithTarget = targetObj?.comment ? targetTuckMargin : undefined;

  const container = useMemo(
    () => css`
      position: relative;
      width: 100%;
      background: #fff;
      border: 1px solid var(--ui-border);
      border-radius: ${borderRadius};
      padding: 0.8rem 1rem 0.8rem 1.2rem;
      &:last-child {
        margin-bottom: 0;
      }

      .heading {
        display: flex;
        align-items: center;
        gap: 0.9rem;
        padding: 0.2rem 0.2rem 0.6rem 0.2rem;
        width: 100%;
        border-bottom: none;
      }
      .body {
        width: 100%;
        font-size: 1.65rem;
        padding: 0;
        z-index: 10;
        .bottom-interface {
          padding: 0.6rem 0 0 0;
          display: flex;
          flex-direction: column;
        }
      }
      /* container spacing only; separators handled by outer wrapper */
      padding: 1rem 1rem 1rem 1.2rem;
      .content-panel__likes {
        font-weight: 600;
        color: ${Color.darkerGray()};
        font-size: 1.2rem;
        line-height: 1;
      }
      .subject {
        font-size: 1.9rem;
        font-weight: 700;
        white-space: pre-wrap;
        overflow-wrap: break-word;
        word-break: break-word;
        margin: 0 0 1rem 0;
      }
      .title {
        font-size: 1.6rem;
        font-weight: 600;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: pre-wrap;
        overflow-wrap: break-word;
        word-break: break-word;
      }
      .timestamp {
        display: inline-block;
        margin-top: 0.2rem;
        font-size: 1.1rem;
        color: ${Color.gray()};
      }
      @media (max-width: ${mobileMaxWidth}) {
        border-radius: 0;
        border: none;
        width: 100%;
        .body {
          font-size: 1.75rem;
        }
      }
    `,
    []
  );

  if (
    contentState.notFound ||
    contentState.isDeleted ||
    contentState.isDeleteNotification
  ) {
    return null;
  }

  return (
    <ErrorBoundary componentPath="ContentPanel/index">
      <Context.Provider
        value={{
          commentsLoadLimit,
          onAddTags,
          onAddTagToContents,
          onByUserStatusChange: onSetByUserStatus,
          onCommentSubmit: onUploadComment,
          onDeleteComment,
          onDeleteContent,
          onEditComment,
          onEditContent,
          onEditRewardComment,
          onLoadComments,
          onLikeContent,
          onLoadMoreComments,
          onLoadMoreReplies,
          onLoadTags,
          onLoadRepliesOfReply,
          onReplySubmit: onUploadReply,
          onSetCommentsShown,
          onSetRewardLevel,
          onUploadTargetComment
        }}
      >
        <div
          style={style}
          className={className}
          ref={ComponentRef}
          data-content-page={isContentPage ? 'true' : undefined}
        >
          <div
            className={css`
              width: 100%;
              &:not(:first-of-type) {
                border-top: 1px solid var(--ui-border-strong);
              }
            `}
          >
            {contentShown ? (
              <div
                ref={PanelRef}
                className={css`
                  height: ${contentHeight};
                  margin: 0;
                  padding: 0.6rem 0 0.8rem 0;
                  position: relative;
                  z-index: ${zIndex};
                  ${isContentPage
                    ? `
                    @media (max-width: ${mobileMaxWidth}) {
                      padding-top: 0;
                    }
                  `
                    : ''}
                `}
              >
                <div
                  className={`${container} ${css`
                    position: relative;
                    z-index: 3;
                  `}`}
                >
                  {!loaded && <Loading theme={theme || profileTheme} />}
                  {loaded && (
                    <>
                      <Heading
                        showActualDate={showActualDate}
                        theme={theme || profileTheme}
                        contentObj={contentState}
                        action={
                          commentId
                            ? targetObj?.comment.notFound
                              ? `replied${
                                  appliedRootType && appliedRootType !== 'user'
                                    ? ' on'
                                    : ''
                                }`
                              : 'replied to'
                            : appliedRootType === 'subject'
                            ? 'responded to'
                            : appliedRootType === 'user'
                            ? 'posted a profile message'
                            : 'commented on'
                        }
                      />
                      <div className="body">
                        <Body
                          autoExpand={autoExpand}
                          commentsShown={commentsShown}
                          contentObj={contentState}
                          inputAtBottom={inputAtBottom}
                          numPreviewComments={numPreviewComments}
                          onChangeSpoilerStatus={onChangeSpoilerStatus}
                          theme={theme || profileTheme}
                        />
                      </div>
                    </>
                  )}
                </div>
                {loaded && targetObj?.comment && (
                  <TargetContent
                    style={{
                      position: 'relative',
                      zIndex: 2
                    }}
                    theme={theme || profileTheme}
                    targetObj={targetObj}
                    rootObj={rootObj}
                    rootType={appliedRootType}
                    contentId={contentId}
                    contentType={contentType}
                    onShowTCReplyInput={onShowTCReplyInput}
                  />
                )}
                {contentState.loaded && targetObj?.subject?.id && (
                  <ContentListItem
                    hideSideBordersOnMobile
                    noTopBorderRadius
                    style={{
                      zIndex: 1,
                      position: 'relative',
                      marginTop: alignTopWithTarget ?? targetTuckMargin
                    }}
                    expandable
                    contentObj={{
                      ...targetObj.subject,
                      contentType: 'subject'
                    }}
                  />
                )}
                {contentType === 'comment' && appliedRootType === 'video' && (
                  <ContentListItem
                    hideSideBordersOnMobile
                    noTopBorderRadius
                    style={{
                      position: 'relative',
                      marginTop: alignTopWithTarget ?? targetTuckMargin
                    }}
                    expandable
                    contentObj={rootObj}
                  />
                )}
                {contentType === 'comment' && appliedRootType === 'aiStory' && (
                  <ContentListItem
                    hideSideBordersOnMobile
                    noTopBorderRadius
                    style={{
                      position: 'relative',
                      marginTop: alignTopWithTarget ?? targetTuckMargin
                    }}
                    expandable
                    contentObj={rootObj}
                  />
                )}
                {(contentType === 'comment' || contentType === 'subject') &&
                  appliedRootType === 'url' &&
                  !contentState.rootObj?.notFound &&
                  !rootObj.notFound && (
                    <div
                      className={urlCss}
                      style={{
                        marginTop: alignTopWithTarget ?? targetTuckMargin,
                        borderTopLeftRadius: 0,
                        borderTopRightRadius: 0
                      }}
                    >
                      {rootObj.loaded ? (
                        <Embedly small contentId={contentState.rootId} />
                      ) : (
                        <Loading theme={theme || profileTheme} />
                      )}
                    </div>
                  )}
                {contentType === 'comment' &&
                  (appliedRootType === 'pass' ||
                    appliedRootType === 'missionPass' ||
                    appliedRootType === 'achievementPass') &&
                  rootObj?.id && (
                    <TargetPassContent
                      passContent={rootObj}
                      style={{
                        position: 'relative',
                        zIndex: 1,
                        marginTop: alignTopWithTarget ?? targetTuckMargin
                      }}
                    />
                  )}
                {contentType === 'comment' &&
                  appliedRootType === 'xpChange' &&
                  rootObj?.id && (
                    <TargetDailyGoalsContent
                      dailyGoalsContent={rootObj}
                      style={{
                        position: 'relative',
                        zIndex: 1,
                        marginTop: alignTopWithTarget ?? targetTuckMargin
                      }}
                    />
                  )}
                {contentType === 'comment' &&
                  appliedRootType === 'sharedTopic' &&
                  rootObj?.id && (
                    <TargetSharedTopicContent
                      sharedTopicContent={rootObj}
                      style={{
                        position: 'relative',
                        zIndex: 1,
                        marginTop: alignTopWithTarget ?? targetTuckMargin
                      }}
                    />
                  )}
                {contentType === 'comment' &&
                  appliedRootType === 'dailyReflection' &&
                  rootObj?.id && (
                    <TargetDailyReflectionContent
                      dailyReflectionContent={rootObj}
                      style={{
                        position: 'relative',
                        zIndex: 1,
                        marginTop: alignTopWithTarget ?? targetTuckMargin
                      }}
                    />
                  )}
                {contentType === 'comment' && appliedRootType === 'user' ? (
                  <div
                    className={profileTargetCss}
                    style={{
                      position: 'relative',
                      zIndex: 1,
                      marginTop: alignTopWithTarget ?? targetTuckMargin
                    }}
                    onClick={() => navigate(`/users/${rootObj.username}`)}
                  >
                    {rootObj.id ? (
                      <Profile profile={rootObj} />
                    ) : (
                      <Loading theme={theme || profileTheme} />
                    )}
                  </div>
                ) : null}
              </div>
            ) : (
              <div
                style={{
                  width: '100%',
                  height: componentHeight
                }}
              />
            )}
          </div>
        </div>
      </Context.Provider>
    </ErrorBoundary>
  );
}
