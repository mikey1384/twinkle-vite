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
import { useContentState, useLazyLoad } from '~/helpers/hooks';
import { useAppContext, useContentContext } from '~/contexts';
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
  contentId,
  contentType,
  numPreviewComments = 0,
  style = {},
  theme,
  zIndex = 1
}) {
  const [ComponentRef, inView] = useInView({
    threshold: 0
  });
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
  const onSetPlaceholderHeight = useContentContext(
    (v) => v.actions.onSetPlaceholderHeight
  );
  const onSetRewardLevel = useContentContext((v) => v.actions.onSetRewardLevel);
  const onSetVisible = useContentContext((v) => v.actions.onSetVisible);
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
    placeholderHeight: previousPlaceholderHeight,
    rootObj,
    rootType,
    started,
    targetObj,
    visible: previousVisible,
    rootId
  } = contentState;
  const placeholderHeightRef = useRef(previousPlaceholderHeight);
  const [placeholderHeight, setPlaceholderHeight] = useState(
    previousPlaceholderHeight
  );
  const [visible, setVisible] = useState(previousVisible);
  const visibleRef = useRef(null);
  useLazyLoad({
    PanelRef,
    inView,
    onSetPlaceholderHeight: (height) => {
      setPlaceholderHeight(height);
      placeholderHeightRef.current = height;
    },
    onSetVisible: (visible) => {
      setVisible(visible);
      visibleRef.current = visible;
    },
    delay: 1000
  });
  const loading = useRef(false);
  const inputAtBottom = contentType === 'comment';
  const heightNotSet = useMemo(
    () => !previousPlaceholderHeight && !placeholderHeight,
    [placeholderHeight, previousPlaceholderHeight]
  );
  const { started: rootStarted } = useContentState({
    contentType: rootType,
    contentId: rootId
  });

  useEffect(() => {
    return function cleanUp() {
      onSetPlaceholderHeight({
        contentType,
        contentId,
        height: placeholderHeightRef.current
      });
      onSetVisible({
        contentId,
        contentType,
        visible: visibleRef.current
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loaded && !loading.current && contentId) {
      onMount();
    }
    async function onMount() {
      loading.current = true;
      const data = await loadContent({ contentId, contentType });
      onInitContent({
        ...data,
        feedId: contentState.feedId
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
      alwaysShow ||
      !loaded ||
      heightNotSet ||
      visible ||
      inView ||
      started ||
      rootStarted,
    [alwaysShow, heightNotSet, inView, loaded, rootStarted, started, visible]
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
        <div style={style} className={className} ref={ComponentRef}>
          <div
            style={{
              width: '100%',
              marginBottom: '1rem',
              height: contentShown ? 'auto' : placeholderHeight || '15rem'
            }}
          >
            {contentShown && (
              <div
                ref={PanelRef}
                style={{
                  height: !loaded && '15rem',
                  position: 'relative',
                  zIndex
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    zIndex: 3
                  }}
                  className={container}
                >
                  {!loaded && <Loading theme={theme} />}
                  {loaded && (
                    <>
                      <Heading
                        theme={theme}
                        contentObj={contentState}
                        action={
                          commentId
                            ? targetObj.comment.notFound
                              ? localize('repliedOn')
                              : localize('repliedTo')
                            : rootType === 'subject'
                            ? localize('respondedTo')
                            : rootType === 'user'
                            ? localize('leftMessageTo')
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
                          theme={theme}
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
                    theme={theme}
                    targetObj={targetObj}
                    rootObj={rootObj}
                    rootType={contentState.rootType}
                    contentId={contentId}
                    contentType={contentType}
                    onShowTCReplyInput={onShowTCReplyInput}
                  />
                )}
                {contentState.loaded && targetObj?.subject && (
                  <ContentListItem
                    comments={contentState.comments}
                    style={{
                      zIndex: 1,
                      position: 'relative'
                    }}
                    expandable
                    onClick={() =>
                      navigate(`/subjects/${targetObj.subject.id}`)
                    }
                    contentObj={targetObj.subject}
                    onChangeSpoilerStatus={onChangeSpoilerStatus}
                  />
                )}
                {contentType === 'comment' &&
                  contentState.rootType === 'video' && (
                    <ContentListItem
                      style={{
                        position: 'relative'
                      }}
                      expandable
                      onClick={() => navigate(`/videos/${rootObj.id}`)}
                      contentObj={rootObj}
                    />
                  )}
                {(contentType === 'comment' || contentType === 'subject') &&
                  rootType === 'url' &&
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
                      <Embedly small contentId={contentState.rootId} />
                    </div>
                  )}
                {contentType === 'comment' && contentState.rootType === 'user' && (
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
                    <Profile profile={rootObj} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Context.Provider>
    </ErrorBoundary>
  );
}
