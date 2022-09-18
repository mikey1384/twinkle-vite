import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import LocalContext from '../Context';
import LikeButton from '~/components/Buttons/LikeButton';
import StarButton from '~/components/Buttons/StarButton';
import Button from '~/components/Button';
import Likers from '~/components/Likers';
import UserListModal from '~/components/Modals/UserListModal';
import Comments from '~/components/Comments';
import MainContent from './MainContent';
import DropdownButton from '~/components/Buttons/DropdownButton';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import XPRewardInterface from '~/components/XPRewardInterface';
import RecommendationInterface from '~/components/RecommendationInterface';
import RewardStatus from '~/components/RewardStatus';
import RecommendationStatus from '~/components/RecommendationStatus';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import {
  determineUserCanRewardThis,
  determineXpButtonDisabled,
  isMobile,
  scrollElementToCenter
} from '~/helpers';
import { useContentState, useTheme } from '~/helpers/hooks';
import { useAppContext, useContentContext, useKeyContext } from '~/contexts';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import localize from '~/constants/localize';

const commentLabel = localize('comment');
const copiedLabel = localize('copied');
const editLabel = localize('edit');
const removeLabel = localize('remove');
const replyLabel = localize('reply');
const respondLabel = localize('respond');
const rewardLabel = localize('reward');
const deviceIsMobile = isMobile(navigator);

Body.propTypes = {
  autoExpand: PropTypes.bool,
  contentObj: PropTypes.object.isRequired,
  commentsShown: PropTypes.bool,
  inputAtBottom: PropTypes.bool,
  numPreviewComments: PropTypes.number,
  onChangeSpoilerStatus: PropTypes.func.isRequired,
  theme: PropTypes.string
};

export default function Body({
  autoExpand,
  commentsShown,
  contentObj,
  contentObj: {
    commentsLoaded,
    contentId,
    filePath,
    rewardLevel,
    id,
    numComments,
    numReplies,
    comments = [],
    commentsLoadMoreButton = false,
    isNotification,
    likes = [],
    previewLoaded,
    recommendations = [],
    rootId,
    rootType,
    rewards = [],
    rootObj = {},
    targetObj = {},
    contentType,
    uploader = {},
    views
  },
  inputAtBottom,
  numPreviewComments,
  onChangeSpoilerStatus,
  theme
}) {
  const deleteContent = useAppContext((v) => v.requestHelpers.deleteContent);
  const loadComments = useAppContext((v) => v.requestHelpers.loadComments);

  const {
    authLevel,
    canDelete,
    canEdit,
    canReward,
    profileTheme,
    twinkleCoins,
    userId
  } = useKeyContext((v) => v.myState);
  const {
    reward: { color: rewardColor }
  } = useTheme(theme || profileTheme);

  const onSetIsEditing = useContentContext((v) => v.actions.onSetIsEditing);
  const onSetXpRewardInterfaceShown = useContentContext(
    (v) => v.actions.onSetXpRewardInterfaceShown
  );

  const {
    isEditing,
    secretAnswer,
    secretAttachment,
    secretShown,
    xpRewardInterfaceShown
  } = useContentState({
    contentType,
    contentId
  });

  const subjectId = useMemo(() => {
    if (contentType === 'subject') {
      return contentId;
    }
    return targetObj.subject?.id;
  }, [contentId, contentType, targetObj.subject?.id]);
  const { secretShown: rootSecretShown } = useContentState({
    contentId: rootId,
    contentType: rootType
  });
  const { secretShown: subjectSecretShown } = useContentState({
    contentId: subjectId,
    contentType: 'subject'
  });
  const {
    commentsLoadLimit,
    onByUserStatusChange,
    onCommentSubmit,
    onDeleteComment,
    onDeleteContent,
    onEditComment,
    onEditRewardComment,
    onLoadComments,
    onLikeContent,
    onLoadMoreComments,
    onLoadMoreReplies,
    onLoadRepliesOfReply,
    onReplySubmit,
    onSetCommentsShown,
    onSetRewardLevel
  } = useContext(LocalContext);
  const [copiedShown, setCopiedShown] = useState(false);
  const [userListModalShown, setUserListModalShown] = useState(false);
  const [confirmModalShown, setConfirmModalShown] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [recommendationInterfaceShown, setRecommendationInterfaceShown] =
    useState(false);
  const CommentInputAreaRef = useRef(null);
  const RewardInterfaceRef = useRef(null);

  const isRecommendedByUser = useMemo(() => {
    return (
      recommendations.filter(
        (recommendation) => recommendation.userId === userId
      ).length > 0
    );
  }, [recommendations, userId]);

  const isRewardedByUser = useMemo(() => {
    return rewards.filter((reward) => reward.rewarderId === userId).length > 0;
  }, [rewards, userId]);

  const secretHidden = useMemo(() => {
    const contentSecretHidden = !(secretShown || uploader.id === userId);
    const targetSubjectSecretHidden = !(
      subjectSecretShown || targetObj.subject?.uploader?.id === userId
    );
    const rootObjSecretHidden = !(
      rootSecretShown || rootObj?.uploader?.id === userId
    );
    return contentType === 'subject' && (secretAnswer || secretAttachment)
      ? contentSecretHidden
      : targetObj.subject?.secretAnswer || targetObj.subject?.secretAttachment
      ? targetSubjectSecretHidden
      : !!rootObj?.secretAnswer && rootObjSecretHidden;
  }, [
    contentType,
    rootObj?.secretAnswer,
    rootObj?.uploader?.id,
    rootSecretShown,
    secretAnswer,
    secretAttachment,
    secretShown,
    subjectSecretShown,
    targetObj.subject?.secretAnswer,
    targetObj.subject?.secretAttachment,
    targetObj.subject?.uploader?.id,
    uploader.id,
    userId
  ]);

  const finalRewardLevel = useMemo(() => {
    const rootRewardLevel =
      rootType === 'video' || rootType === 'url'
        ? rootObj.rewardLevel > 0
          ? 1
          : 0
        : rootObj.rewardLevel;
    return contentObj.byUser
      ? 5
      : targetObj.subject?.rewardLevel || rootRewardLevel;
  }, [contentObj.byUser, rootObj.rewardLevel, rootType, targetObj.subject]);

  const xpButtonDisabled = useMemo(
    () =>
      determineXpButtonDisabled({
        rewards,
        rewardLevel: finalRewardLevel,
        myId: userId,
        xpRewardInterfaceShown
      }),
    [finalRewardLevel, rewards, userId, xpRewardInterfaceShown]
  );

  const isCommentForSecretSubject = useMemo(() => {
    if (targetObj?.comment) {
      return false;
    }
    return (
      !!targetObj?.subject?.secretAnswer ||
      !!targetObj?.subject?.secretAttachment
    );
  }, [
    targetObj?.comment,
    targetObj?.subject?.secretAnswer,
    targetObj?.subject?.secretAttachment
  ]);

  const userCanDeleteThis = useMemo(() => {
    if (userId === uploader.id) return true;
    return canDelete && authLevel > uploader?.authLevel;
  }, [authLevel, canDelete, uploader.authLevel, uploader.id, userId]);

  const userCanEditThis = useMemo(() => {
    if (userId === uploader.id) return true;
    return canEdit && authLevel > uploader?.authLevel;
  }, [authLevel, canEdit, uploader.authLevel, uploader.id, userId]);

  const editMenuItems = useMemo(() => {
    const items = [];
    if (
      userCanEditThis &&
      (!isCommentForSecretSubject ||
        (targetObj.subject?.uploader?.id &&
          targetObj.subject?.uploader?.id === userId &&
          userId === uploader.id))
    ) {
      items.push({
        label: (
          <>
            <Icon icon="pencil-alt" />
            <span style={{ marginLeft: '1rem' }}>{editLabel}</span>
          </>
        ),
        onClick: () =>
          onSetIsEditing({ contentId, contentType, isEditing: true })
      });
    }
    if (userCanDeleteThis) {
      items.push({
        label: (
          <>
            <Icon icon="trash-alt" />
            <span style={{ marginLeft: '1rem' }}>{removeLabel}</span>
          </>
        ),
        onClick: () => setConfirmModalShown(true)
      });
    }
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canDelete, canEdit, contentId, contentType, uploader.id, userId]);

  const editButtonShown = useMemo(() => {
    return !!editMenuItems?.length;
  }, [editMenuItems?.length]);

  useEffect(() => {
    if (!commentsLoaded && !(numPreviewComments > 0 && previewLoaded)) {
      loadInitialComments(numPreviewComments);
    }

    async function loadInitialComments(numPreviewComments) {
      if (!numPreviewComments) {
        setLoadingComments(true);
      }
      const isPreview = !!numPreviewComments;
      const data = await loadComments({
        contentType,
        contentId,
        limit: numPreviewComments || commentsLoadLimit,
        isPreview
      });
      onLoadComments({
        ...data,
        contentId,
        contentType,
        isPreview
      });
      setLoadingComments(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const userCanRewardThis = useMemo(
    () =>
      determineUserCanRewardThis({
        authLevel,
        canReward,
        recommendations,
        uploader,
        userId
      }),
    [authLevel, canReward, recommendations, uploader, userId]
  );

  useEffect(() => {
    onSetXpRewardInterfaceShown({
      contentType,
      contentId,
      shown: xpRewardInterfaceShown && userCanRewardThis
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const viewsLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return <>조회수 {addCommasToNumber(views)}회</>;
    }
    return (
      <>
        {addCommasToNumber(views)} view
        {`${views > 1 ? 's' : ''}`}
      </>
    );
  }, [views]);

  const numCommentsShown = useMemo(() => {
    if (commentsShown || autoExpand) {
      return false;
    }
    return Number(numComments) > 0 || Number(numReplies) > 0;
  }, [autoExpand, commentsShown, numComments, numReplies]);

  return (
    <ErrorBoundary componentPath="ContentPanel/Body/index">
      <div
        style={{
          width: '100%'
        }}
      >
        <MainContent
          contentId={contentId}
          contentType={contentType}
          secretHidden={secretHidden}
          theme={theme}
          userId={userId}
          onClickSecretAnswer={onSecretAnswerClick}
        />
        {!isEditing && !isNotification && (
          <div
            className="bottom-interface"
            style={{
              marginBottom:
                likes.length > 0 &&
                !(rewards.length > 0) &&
                !commentsShown &&
                !xpRewardInterfaceShown &&
                '0.5rem'
            }}
          >
            <div
              className={css`
                margin-top: ${secretHidden ? '0.5rem' : '1.5rem'};
                display: flex;
                justify-content: space-between;
                align-items: center;
                .left {
                  display: flex;
                  align-items: center;
                  button,
                  span {
                    font-size: 1.4rem;
                  }
                  @media (max-width: ${mobileMaxWidth}) {
                    button,
                    span {
                      font-size: 1rem;
                    }
                  }
                }
                .right {
                  flex-grow: 1;
                  display: flex;
                  justify-content: flex-end;
                  align-items: center;
                  @media (max-width: ${mobileMaxWidth}) {
                    button {
                      font-size: 1rem;
                    }
                  }
                }
              `}
            >
              {contentType !== 'pass' && (
                <div className="left">
                  {!secretHidden && (
                    <LikeButton
                      contentType={contentType}
                      contentId={contentId}
                      likes={likes}
                      key="likeButton"
                      onClick={handleLikeClick}
                      small
                      theme={theme}
                    />
                  )}
                  {!secretHidden && (
                    <Button
                      transparent
                      key="commentButton"
                      className={css`
                        margin-left: 1rem;
                        @media (max-width: ${mobileMaxWidth}) {
                          margin-left: 0.5rem;
                        }
                      `}
                      onClick={handleCommentButtonClick}
                    >
                      <Icon icon="comment-alt" />
                      <span style={{ marginLeft: '0.7rem' }}>
                        {contentType === 'video' || contentType === 'url'
                          ? commentLabel
                          : contentType === 'subject'
                          ? respondLabel
                          : replyLabel}
                      </span>
                      {numCommentsShown ? (
                        <span style={{ marginLeft: '0.5rem' }}>
                          ({numComments || numReplies})
                        </span>
                      ) : null}
                    </Button>
                  )}
                  {userCanRewardThis && !secretHidden && (
                    <Button
                      color={rewardColor}
                      disabled={!!xpButtonDisabled}
                      className={css`
                        margin-left: 1rem;
                        @media (max-width: ${mobileMaxWidth}) {
                          margin-left: 0.5rem;
                        }
                      `}
                      onClick={handleSetXpRewardInterfaceShown}
                    >
                      <Icon icon="certificate" />
                      <span style={{ marginLeft: '0.7rem' }}>
                        {xpButtonDisabled || rewardLabel}
                      </span>
                    </Button>
                  )}
                  {!secretHidden && (
                    <div
                      className={css`
                        margin-left: 0.5rem;
                        @media (max-width: ${mobileMaxWidth}) {
                          margin-left: 0;
                        }
                      `}
                      style={{ position: 'relative' }}
                    >
                      <Button
                        transparent
                        onClick={() => {
                          setCopiedShown(true);
                          handleCopyToClipboard();
                          setTimeout(() => setCopiedShown(false), 700);
                        }}
                      >
                        <Icon icon="copy" />
                      </Button>
                      <div
                        style={{
                          zIndex: 300,
                          display: copiedShown ? 'block' : 'none',
                          marginTop: '0.2rem',
                          position: 'absolute',
                          background: '#fff',
                          fontSize: '1.2rem',
                          padding: '1rem',
                          wordBreak: 'keep-all',
                          border: `1px solid ${Color.borderGray()}`
                        }}
                      >
                        {copiedLabel}
                      </div>
                    </div>
                  )}
                  {editButtonShown ? (
                    <DropdownButton
                      transparent
                      style={{
                        marginLeft: secretHidden ? 0 : '1rem',
                        display: 'inline-block'
                      }}
                      size={contentType !== 'subject' ? 'sm' : null}
                      menuProps={editMenuItems}
                    />
                  ) : null}
                </div>
              )}
              {!secretHidden && (
                <div
                  className="right"
                  style={{ position: 'relative', marginRight: 0 }}
                >
                  <Button
                    color={rewardColor}
                    filled={isRecommendedByUser}
                    disabled={recommendationInterfaceShown}
                    onClick={() => setRecommendationInterfaceShown(true)}
                  >
                    <Icon icon="heart" />
                  </Button>
                  {(contentType === 'subject' ||
                    contentType === 'video' ||
                    contentType === 'url') && (
                    <StarButton
                      style={{ marginLeft: '1rem' }}
                      byUser={!!contentObj.byUser}
                      contentId={contentObj.id}
                      filePath={filePath}
                      rewardLevel={rewardLevel}
                      onSetRewardLevel={onSetRewardLevel}
                      onToggleByUser={handleToggleByUser}
                      contentType={contentType}
                      uploader={uploader}
                    />
                  )}
                </div>
              )}
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '0.5rem',
                marginBottom: '0.5rem'
              }}
            >
              <Likers
                className="content-panel__likes"
                userId={userId}
                likes={likes}
                onLinkClick={() => setUserListModalShown(true)}
                theme={theme}
              />
              {views > 10 && contentType === 'video' && (
                <div
                  style={{
                    fontWeight: 'bold',
                    fontSize: '1.7rem'
                  }}
                >
                  {viewsLabel}
                </div>
              )}
            </div>
          </div>
        )}
        <RecommendationStatus
          style={{ marginBottom: '1rem' }}
          contentType={contentType}
          recommendations={recommendations}
          theme={theme}
        />
        {recommendationInterfaceShown && (
          <RecommendationInterface
            contentId={contentId}
            contentType={contentType}
            onHide={() => setRecommendationInterfaceShown(false)}
            recommendations={recommendations}
            theme={theme}
            uploaderId={uploader.id}
          />
        )}
        {xpRewardInterfaceShown && (
          <XPRewardInterface
            innerRef={RewardInterfaceRef}
            isRecommendedByUser={isRecommendedByUser}
            contentType={contentType}
            contentId={contentId}
            onReward={() =>
              setRecommendationInterfaceShown(
                !isRecommendedByUser && twinkleCoins > 0
              )
            }
            rewardLevel={finalRewardLevel}
            uploaderAuthLevel={uploader.authLevel}
            uploaderId={uploader.id}
            rewards={rewards}
          />
        )}
        <RewardStatus
          theme={theme}
          contentType={contentType}
          contentId={contentId}
          rewardLevel={finalRewardLevel}
          onCommentEdit={onEditRewardComment}
          rewards={rewards}
          className={css`
            margin-top: ${secretHidden && rewardLevel ? '1rem' : ''};
            margin-left: -1px;
            margin-right: -1px;
            @media (max-width: ${mobileMaxWidth}) {
              margin-left: 0px;
              margin-right: 0px;
            }
          `}
        />
        {!isNotification && (
          <Comments
            theme={theme}
            autoExpand={
              (autoExpand && !secretHidden) ||
              (contentType === 'subject' && secretHidden)
            }
            comments={comments}
            commentsLoadLimit={commentsLoadLimit}
            commentsShown={commentsShown && !secretHidden}
            contentId={contentId}
            inputAreaInnerRef={CommentInputAreaRef}
            inputAtBottom={inputAtBottom}
            loadMoreButton={commentsLoadMoreButton}
            inputTypeLabel={contentType === 'comment' ? 'reply' : 'comment'}
            isLoading={loadingComments}
            numPreviews={numPreviewComments}
            onCommentSubmit={handleCommentSubmit}
            onDelete={onDeleteComment}
            onEditDone={onEditComment}
            onLikeClick={({ commentId, likes }) =>
              onLikeContent({
                likes,
                contentId: commentId,
                contentType: 'comment'
              })
            }
            onLoadMoreComments={onLoadMoreComments}
            onLoadMoreReplies={onLoadMoreReplies}
            onPreviewClick={handleExpandComments}
            onLoadRepliesOfReply={onLoadRepliesOfReply}
            onReplySubmit={onReplySubmit}
            onRewardCommentEdit={onEditRewardComment}
            parent={contentObj}
            rootContent={rootObj}
            showSecretButtonAvailable={
              contentType === 'subject' && secretHidden
            }
            subject={contentObj.targetObj?.subject}
            commentsHidden={secretHidden}
            style={{
              padding: '0 1rem 0.5rem 1rem'
            }}
            userId={userId}
          />
        )}
        {userListModalShown && (
          <UserListModal
            onHide={() => setUserListModalShown(false)}
            title={`People who liked this ${contentType}`}
            users={likes}
          />
        )}
      </div>
      {confirmModalShown && (
        <ConfirmModal
          onConfirm={deleteThisContent}
          onHide={() => setConfirmModalShown(false)}
          title={`Remove ${
            contentType.charAt(0).toUpperCase() + contentType.slice(1)
          }`}
        />
      )}
    </ErrorBoundary>
  );

  async function handleCommentSubmit(params) {
    if (
      contentType === 'subject' &&
      (contentObj.secretAnswer || contentObj.secretAttachment) &&
      !secretShown
    ) {
      await handleExpandComments();
      onChangeSpoilerStatus({
        shown: true,
        subjectId,
        prevSecretViewerId: userId
      });
    } else {
      onCommentSubmit(params);
    }
  }

  function handleSetXpRewardInterfaceShown() {
    onSetXpRewardInterfaceShown({
      contentType,
      contentId,
      shown: true
    });
  }

  async function handleCommentButtonClick() {
    if (!commentsShown && !(autoExpand && !secretHidden)) {
      await handleExpandComments();
    }
    if (!deviceIsMobile) {
      CommentInputAreaRef.current?.focus?.();
    }
    scrollElementToCenter(CommentInputAreaRef.current);
  }

  function onSecretAnswerClick() {
    CommentInputAreaRef.current?.focus?.();
  }

  async function deleteThisContent() {
    await deleteContent({ contentType, id });
    if (contentType === 'comment') {
      onDeleteComment(id);
    } else {
      onDeleteContent({ contentType, contentId: id });
    }
  }

  async function handleExpandComments() {
    setLoadingComments(true);
    const data = await loadComments({
      contentType,
      contentId,
      limit: commentsLoadLimit
    });
    onLoadComments({ ...data, contentId, contentType });
    onSetCommentsShown({ contentId, contentType });
    setLoadingComments(false);
  }

  async function handleLikeClick({ isUnlike }) {
    if (!xpButtonDisabled && userCanRewardThis && !isRewardedByUser) {
      onSetXpRewardInterfaceShown({
        contentType,
        contentId,
        shown: !isUnlike
      });
    } else {
      if (!isRecommendedByUser && !canReward) {
        setRecommendationInterfaceShown(!isUnlike);
      }
    }
    if (!isUnlike && !commentsShown) {
      handleExpandComments();
    }
  }

  function handleCopyToClipboard() {
    const textField = document.createElement('textarea');
    textField.innerText = `https://www.twin-kle.com/${
      contentType === 'url' ? 'link' : contentType
    }s/${contentId}`;
    document.body.appendChild(textField);
    textField.select();
    document.execCommand('copy');
    textField.remove();
  }

  function handleToggleByUser(byUser) {
    onByUserStatusChange({ byUser, contentId, contentType });
  }
}
