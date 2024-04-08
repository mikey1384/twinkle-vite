import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
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
import { container } from './Styles';
import { placeholderHeights } from '~/constants/state';
import { useContentState, useLazyLoad } from '~/helpers/hooks';
import { useAppContext, useContentContext, useKeyContext } from '~/contexts';
import { useNavigate } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import localize from '~/constants/localize';

ContentPanel.propTypes = {
  alwaysShow: PropTypes.bool,
  autoExpand: PropTypes.bool,
  className: PropTypes.string,
  commentsLoadLimit: PropTypes.number,
  contentId: PropTypes.number.isRequired,
  contentType: PropTypes.string.isRequired,
  rootType: PropTypes.string,
  numPreviewComments: PropTypes.number,
  style: PropTypes.object,
  theme: PropTypes.string,
  zIndex: PropTypes.number
};
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
  theme,
  zIndex = 1
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
  theme?: string;
  zIndex?: number;
}) {
  const previousPlaceholderHeight = useMemo(
    () => placeholderHeights[`${contentType}-${contentId}`],
    [contentId, contentType]
  );
  const [ComponentRef, inView] = useInView();
  const [isVisible, setIsVisible] = useState(false);
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
  useLazyLoad({
    inView,
    PanelRef,
    onSetIsVisible: setIsVisible,
    onSetPlaceholderHeight: (height: number) => {
      const newHeight = height + 10;
      setPlaceholderHeight(newHeight);
      placeholderHeightRef.current = newHeight;
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
    () =>
      alwaysShow || !loaded || inView || started || rootStarted || isVisible,
    [alwaysShow, inView, isVisible, loaded, rootStarted, started]
  );

  const componentHeight = useMemo(() => {
    return contentShown ? 'auto' : placeholderHeight || '15rem';
  }, [contentShown, placeholderHeight]);

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
            style={{
              height: componentHeight
            }}
          >
            {contentShown && (
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
                    innerStyle={{ paddingTop: '0.5rem' }}
                    onClick={() =>
                      navigate(`/subjects/${targetObj.subject.id}`)
                    }
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
                    innerStyle={{ paddingTop: '1rem' }}
                    expandable
                    onClick={() => navigate(`/videos/${rootObj.id}`)}
                    contentObj={rootObj}
                  />
                )}
                {contentType === 'comment' && appliedRootType === 'aiStory' && (
                  <ContentListItem
                    hideSideBordersOnMobile
                    style={{
                      position: 'relative'
                    }}
                    innerStyle={{ paddingTop: '0.5rem' }}
                    expandable
                    onClick={() => navigate(`/ai-stories/${rootObj.id}`)}
                    contentObj={rootObj}
                  />
                )}
                {(contentType === 'comment' || contentType === 'subject') &&
                  appliedRootType === 'url' &&
                  !contentState.rootObj?.notFound &&
                  !rootObj.notFound && (
                    <div
                      className={css`
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
                      `}
                    >
                      {rootObj.loaded ? (
                        <Embedly small contentId={contentState.rootId} />
                      ) : (
                        <Loading theme={theme || profileTheme} />
                      )}
                    </div>
                  )}
                {contentType === 'comment' && appliedRootType === 'user' ? (
                  <div
                    className={css`
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
                    `}
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
            )}
          </div>
        </div>
      </Context.Provider>
    </ErrorBoundary>
  );
}
