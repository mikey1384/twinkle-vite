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
import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { placeholderHeights } from '~/constants/state';
import { useContentState, useLazyLoad } from '~/helpers/hooks';
import { useAppContext, useContentContext, useKeyContext } from '~/contexts';
import { useNavigate } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import localize from '~/constants/localize';

const urlCss = css`
  padding: 1rem;
  background: ${Color.whiteGray()};
  border: 1px solid ${Color.borderGray()};
  border-radius: ${borderRadius};
  margin-top: -1rem;
  transition: background 0.5s;
  &:hover {
    background: #fff;
  }
  @media (max-width: ${mobileMaxWidth}) {
    margin-top: -0.5rem;
    border-left: 0;
    border-right: 0;
  }
`;
const userCommentCss = css`
  cursor: pointer;
  background: ${Color.whiteGray()};
  border: 1px solid ${Color.borderGray()};
  border-radius: ${borderRadius};
  margin-top: -1rem;
  transition: background 0.5s;
  padding-bottom: 1rem;
  &:hover {
    background: #fff;
  }
  @media (max-width: ${mobileMaxWidth}) {
    border-left: 0;
    border-right: 0;
    margin-top: -0.5rem;
  }
`;

export default function ContentPanel({
  alwaysShow,
  autoExpand,
  className,
  commentsLoadLimit,
  isContentPage,
  feedId,
  contentId,
  contentType,
  rootType,
  numPreviewComments = 0,
  style = {},
  showActualDate,
  theme,
  zIndex = 1
}: {
  alwaysShow?: boolean;
  autoExpand?: boolean;
  className?: string;
  commentsLoadLimit?: number;
  feedId?: number;
  isContentPage?: boolean;
  contentId: number;
  contentType: string;
  rootType?: string;
  numPreviewComments?: number;
  style?: React.CSSProperties;
  showActualDate?: boolean;
  theme?: string;
  zIndex?: number;
}) {
  const previousPlaceholderHeight = useMemo(
    () => placeholderHeights[`${contentType}-${contentId}`],
    [contentId, contentType]
  );
  const [ComponentRef, inView] = useInView();
  const { profileTheme } = useKeyContext((v) => v.myState);
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
  const rootObj = useContentState({
    contentType: appliedRootType,
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
    contentType: appliedRootType,
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

  if (
    contentState.notFound ||
    contentState.isDeleted ||
    contentState.isDeleteNotification
  ) {
    return null;
  }

  const container = useMemo(
    () => css`
      background: #fff;
      width: 100%;
      border: 1px solid ${Color.borderGray()};
      border-radius: ${borderRadius};
      position: static;
      &:last-child {
        margin-bottom: 0;
      }
      .heading {
        user-select: none;
        padding: 1rem;
        display: flex;
        align-items: center;
        width: 100%;
        justify-content: space-between;
      }
      .body {
        width: 100%;
        font-size: 1.7rem;
        padding: 0;
        position: static;
        z-index: 10;
        .bottom-interface {
          padding: 0 1rem 0 1rem;
          display: flex;
          flex-direction: column;
          @media (max-width: ${mobileMaxWidth}) {
            padding: 0 0.5rem 0 0.5rem;
          }
        }
      }
      .content-panel__likes {
        font-weight: bold;
        color: ${Color.darkerGray()};
        font-size: 1.2rem;
        line-height: 1;
      }
      .subject {
        font-size: 2rem;
        font-weight: bold;
        white-space: pre-wrap;
        overflow-wrap: break-word;
        word-break: break-word;
        margin-bottom: 1.5rem;
      }
      .title {
        font-size: 1.7rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: pre-wrap;
        overflow-wrap: break-word;
        word-break: break-word;
      }
      .timestamp {
        font-size: 1rem;
        color: ${Color.gray()};
      }
      @media (max-width: ${mobileMaxWidth}) {
        border-radius: 0;
        ${isContentPage ? 'border-top: none;' : ''}
        border-left: none;
        border-right: none;
        .body {
          font-size: 1.8rem;
        }
        .heading {
          > a,
          > span {
            font-size: 1.7rem;
          }
          > small {
            font-size: 1.2rem;
          }
          > button {
            font-size: 1.2rem;
          }
        }
      }
    `,
    [isContentPage]
  );

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
        <div style={style} className={className} ref={ComponentRef}>
          <div
            className={css`
              width: 100%;
              margin-bottom: 1rem;
            `}
          >
            {contentShown ? (
              <div
                ref={PanelRef}
                className={css`
                  height: ${contentHeight};
                  position: relative;
                  z-index: ${zIndex};
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
                              : localize('repliedTo')
                            : appliedRootType === 'subject'
                            ? localize('respondedTo')
                            : appliedRootType === 'user'
                            ? 'posted a profile message'
                            : localize('commentedOn')
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
                    style={{
                      zIndex: 1,
                      position: 'relative'
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
                    style={{
                      position: 'relative'
                    }}
                    expandable
                    contentObj={rootObj}
                  />
                )}
                {contentType === 'comment' && appliedRootType === 'aiStory' && (
                  <ContentListItem
                    hideSideBordersOnMobile
                    style={{
                      position: 'relative'
                    }}
                    expandable
                    contentObj={rootObj}
                  />
                )}
                {(contentType === 'comment' || contentType === 'subject') &&
                  appliedRootType === 'url' &&
                  !contentState.rootObj?.notFound &&
                  !rootObj.notFound && (
                    <div className={urlCss}>
                      {rootObj.loaded ? (
                        <Embedly small contentId={contentState.rootId} />
                      ) : (
                        <Loading theme={theme || profileTheme} />
                      )}
                    </div>
                  )}
                {contentType === 'comment' && appliedRootType === 'user' ? (
                  <div
                    className={userCommentCss}
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
