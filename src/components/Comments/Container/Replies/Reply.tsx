import React, { memo, useContext, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import LocalContext from '../../Context';
import DropdownButton from '~/components/Buttons/DropdownButton';
import EditTextArea from '~/components/Texts/EditTextArea';
import Icon from '~/components/Icon';
import Likers from '~/components/Likers';
import UserListModal from '~/components/Modals/UserListModal';
import UsernameText from '~/components/Texts/UsernameText';
import ProfilePic from '~/components/ProfilePic';
import Button from '~/components/Button';
import LikeButton from '~/components/Buttons/LikeButton';
import ReplyInputArea from './ReplyInputArea';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import RichText from '~/components/Texts/RichText';
import RecommendationInterface from '~/components/RecommendationInterface';
import RecommendationStatus from '~/components/RecommendationStatus';
import LoginToViewContent from '~/components/LoginToViewContent';
import RewardStatus from '~/components/RewardStatus';
import XPRewardInterface from '~/components/XPRewardInterface';
import ContentFileViewer from '~/components/ContentFileViewer';
import Loading from '~/components/Loading';
import RewardButton from '~/components/Buttons/RewardButton';
import ZeroButton from '~/components/Buttons/ZeroButton';
import { commentContainer } from '../Styles';
import { css } from '@emotion/css';
import { Link } from 'react-router-dom';
import { borderRadius, Color } from '~/constants/css';
import {
  determineUserCanRewardThis,
  determineXpButtonDisabled,
  returnTheme
} from '~/helpers';
import { useContentState, useMyLevel } from '~/helpers/hooks';
import { CIEL_TWINKLE_ID, ZERO_TWINKLE_ID } from '~/constants/defaultValues';
import { timeSince } from '~/helpers/timeStampHelpers';
import { useAppContext, useContentContext, useKeyContext } from '~/contexts';
import {
  getFileInfoFromFileName,
  stringIsEmpty
} from '~/helpers/stringHelpers';
import localize from '~/constants/localize';
import { Comment } from '~/types';

const commentWasDeletedLabel = localize('commentWasDeleted');
const editLabel = localize('edit');
const pinLabel = localize('pin');
const pinnedLabel = localize('pinned');
const peopleWhoLikeThisReplyLabel = localize('peopleWhoLikeThisReply');
const unpinLabel = localize('unpin');
const removeReplyLabel = localize('removeReply');
const repliesLabel = localize('replies');
const replyLabel = localize('reply');

Reply.propTypes = {
  comment: PropTypes.object.isRequired,
  innerRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  deleteReply: PropTypes.func.isRequired,
  disableReason: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  isSubjectPannelComment: PropTypes.bool,
  onLoadRepliesOfReply: PropTypes.func.isRequired,
  onPinReply: PropTypes.func.isRequired,
  onSubmitWithAttachment: PropTypes.func.isRequired,
  parent: PropTypes.object.isRequired,
  pinnedCommentId: PropTypes.number,
  reply: PropTypes.object.isRequired,
  rootContent: PropTypes.object,
  onSubmitReply: PropTypes.func.isRequired,
  subject: PropTypes.object,
  theme: PropTypes.string
};
function Reply({
  comment,
  innerRef = () => null,
  deleteReply,
  disableReason,
  isSubjectPannelComment,
  onLoadRepliesOfReply,
  onPinReply,
  onSubmitWithAttachment,
  parent,
  pinnedCommentId,
  reply,
  reply: {
    isExpanded,
    likes = [],
    recommendations = [],
    rewards = [],
    uploader,
    filePath,
    fileName,
    fileSize,
    isDeleteNotification,
    thumbUrl: initialThumbUrl
  },
  rootContent,
  onSubmitReply,
  subject,
  theme
}: {
  comment: Comment;
  disableReason?: string;
  innerRef?: React.RefObject<any> | ((v?: any) => React.RefObject<any> | null);
  deleteReply: (v: any) => void;
  isSubjectPannelComment?: boolean;
  onLoadRepliesOfReply: (v: any) => void;
  onPinReply: (v: number | null) => void;
  onSubmitWithAttachment: (v: any) => void;
  parent: any;
  pinnedCommentId?: number;
  reply: Comment;
  rootContent?: any;
  subject: any;
  onSubmitReply: (v: any) => void;
  theme?: string;
}) {
  const editContent = useAppContext((v) => v.requestHelpers.editContent);
  const loadReplies = useAppContext((v) => v.requestHelpers.loadReplies);
  const { banned, isAdmin, level, profileTheme, twinkleCoins, userId } =
    useKeyContext((v) => v.myState);
  const { canDelete, canEdit, canReward } = useMyLevel();

  const {
    link: { color: linkColor },
    reward: { color: rewardColor }
  } = useMemo(() => returnTheme(theme || profileTheme), [profileTheme, theme]);
  const onSetIsEditing = useContentContext((v) => v.actions.onSetIsEditing);
  const onSetXpRewardInterfaceShown = useContentContext(
    (v) => v.actions.onSetXpRewardInterfaceShown
  );
  const {
    isEditing,
    thumbUrl: thumbUrlFromContext,
    xpRewardInterfaceShown
  } = useContentState({
    contentType: 'comment',
    contentId: reply.id
  });
  const { onEditDone, onLikeClick, onRewardCommentEdit } =
    useContext(LocalContext);
  const { fileType } = getFileInfoFromFileName(fileName);
  const [isPostingReply, setIsPostingReply] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [userListModalShown, setUserListModalShown] = useState(false);
  const [confirmModalShown, setConfirmModalShown] = useState(false);
  const [recommendationInterfaceShown, setRecommendationInterfaceShown] =
    useState(false);
  const ReplyInputAreaRef: React.RefObject<any> = useRef(null);
  const RewardInterfaceRef = useRef(null);
  const userIsUploader = userId === uploader.id;
  const subjectUploaderId = useMemo(
    () => subject?.uploader?.id || subject?.userId,
    [subject]
  );
  const userIsParentUploader = useMemo(() => {
    if (!userId) {
      return false;
    }
    if (isSubjectPannelComment) {
      return subjectUploaderId === userId;
    }
    return parent.uploader?.id === userId && parent.contentType !== 'comment';
  }, [
    isSubjectPannelComment,
    parent.contentType,
    parent.uploader?.id,
    subjectUploaderId,
    userId
  ]);
  const userIsRootUploader = useMemo(
    () => userId && rootContent?.uploader?.id === userId,
    [rootContent?.uploader?.id, userId]
  );
  const userHasHigherLevel = useMemo(() => {
    return level > (uploader?.level || 0);
  }, [level, uploader?.level]);

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

  const dropdownButtonShown = useMemo(() => {
    if (isDeleteNotification) {
      return false;
    }
    const userCanEditThis = (canEdit || canDelete) && userHasHigherLevel;
    return (
      userIsUploader ||
      userIsParentUploader ||
      userIsRootUploader ||
      userCanEditThis
    );
  }, [
    canDelete,
    canEdit,
    isDeleteNotification,
    userHasHigherLevel,
    userIsParentUploader,
    userIsRootUploader,
    userIsUploader
  ]);

  const userCanRewardThis = useMemo(
    () =>
      determineUserCanRewardThis({
        canReward,
        userLevel: level,
        recommendations,
        uploader,
        userId
      }),
    [level, canReward, recommendations, uploader, userId]
  );

  const rewardLevel = useMemo(() => {
    if (parent.contentType === 'subject' && parent.rewardLevel > 0) {
      return parent.rewardLevel;
    }
    if (parent.rootType === 'subject' && rootContent?.rewardLevel > 0) {
      return rootContent.rewardLevel;
    }
    if (parent.contentType === 'video' || parent.contentType === 'url') {
      if (subject?.rewardLevel) {
        return subject?.rewardLevel;
      }
      if (parent.rewardLevel > 0) {
        return 1;
      }
    }
    if (parent.rootType === 'video' || parent.rootType === 'url') {
      if (subject?.rewardLevel) {
        return subject?.rewardLevel;
      }
      if (rootContent?.rewardLevel > 0) {
        return 1;
      }
    }
    return 0;
  }, [
    parent.contentType,
    parent.rewardLevel,
    parent.rootType,
    rootContent,
    subject
  ]);

  const xpButtonDisabled = useMemo(
    () =>
      determineXpButtonDisabled({
        myId: userId,
        rewardLevel,
        xpRewardInterfaceShown,
        rewards
      }),
    [userId, rewardLevel, xpRewardInterfaceShown, rewards]
  );

  const replyIsEmpty = useMemo(
    () => stringIsEmpty(reply.content),
    [reply.content]
  );

  const timeSincePost = useMemo(
    () => timeSince(reply.timeStamp),
    [reply.timeStamp]
  );

  const dropdownMenuItems = useMemo(() => {
    const items = [];
    if (userIsUploader || canEdit) {
      items.push({
        label: (
          <>
            <Icon icon="pencil-alt" />
            <span style={{ marginLeft: '1rem' }}>{editLabel}</span>
          </>
        ),
        onClick: () =>
          onSetIsEditing({
            contentId: reply.id,
            contentType: 'comment',
            isEditing: true
          })
      });
    }
    if (
      (userIsParentUploader || userIsRootUploader || isAdmin) &&
      !banned?.posting
    ) {
      items.push({
        label: (
          <>
            <Icon icon={['fas', 'thumbtack']} />
            <span style={{ marginLeft: '1rem' }}>
              {pinnedCommentId === reply.id ? unpinLabel : pinLabel}
            </span>
          </>
        ),
        onClick: () =>
          onPinReply(pinnedCommentId === reply.id ? null : reply.id)
      });
    }
    if (userIsUploader || canDelete) {
      items.push({
        label: (
          <>
            <Icon icon="trash-alt" />
            <span style={{ marginLeft: '1rem' }}>{removeReplyLabel}</span>
          </>
        ),
        onClick: () => setConfirmModalShown(true)
      });
    }
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    canDelete,
    canEdit,
    pinnedCommentId,
    reply.id,
    userIsParentUploader,
    userIsUploader
  ]);

  return !(isDeleteNotification && !reply.numReplies) && !reply.isDeleted ? (
    <ErrorBoundary componentPath="Comments/Replies/Reply">
      <div className={commentContainer} ref={innerRef}>
        {pinnedCommentId === reply.id && (
          <div
            className={css`
              line-height: 1;
              font-size: 1.3rem;
              font-weight: bold;
              color: ${Color.darkerGray()};
              margin-bottom: 0.2rem;
            `}
          >
            <Icon icon={['fas', 'thumbtack']} />
            <span
              className={css`
                margin-left: 0.7rem;
              `}
            >
              {pinnedLabel}
            </span>
          </div>
        )}
        <div className="content-wrapper">
          {isDeleteNotification ? null : (
            <div
              className={css`
                display: flex;
                width: 7rem;
                margin-top: 1rem;
                justify-content: center;
              `}
            >
              <div
                className={css`
                  width: 5rem;
                `}
              >
                <ProfilePic
                  style={{ width: '100%' }}
                  userId={uploader.id}
                  profilePicUrl={uploader.profilePicUrl || ''}
                />
              </div>
            </div>
          )}
          <section>
            <div
              className={css`
                height: ${isDeleteNotification ? '0.3rem' : 'auto'};
              `}
            >
              {isDeleteNotification ? null : (
                <UsernameText className="username" user={uploader} />
              )}{' '}
              {isDeleteNotification ? null : (
                <small className="timestamp">
                  <Link to={`/comments/${reply.id}`}>{timeSincePost}</Link>
                </small>
              )}
            </div>
            <div>
              {reply.targetObj?.comment?.uploader &&
                !!reply.replyId &&
                reply.replyId !== comment.id && (
                  <ErrorBoundary componentPath="Comments/Replies/Reply/to">
                    <span className="to" style={{ color: Color[linkColor]() }}>
                      to:{' '}
                      <UsernameText user={reply.targetObj.comment.uploader} />
                    </span>
                  </ErrorBoundary>
                )}
              {filePath &&
                !isDeleteNotification &&
                (userId ? (
                  <div
                    className={css`
                      width: 100%;
                      padding-top: 2rem;
                    `}
                  >
                    <ContentFileViewer
                      theme={theme}
                      contentId={reply.id}
                      contentType="comment"
                      fileName={fileName}
                      filePath={filePath}
                      fileSize={Number(fileSize)}
                      thumbUrl={thumbUrlFromContext || initialThumbUrl}
                      videoHeight="100%"
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        marginBottom: replyIsEmpty
                          ? fileType === 'audio'
                            ? '2rem'
                            : '1rem'
                          : 0
                      }}
                    />
                  </div>
                ) : (
                  <LoginToViewContent />
                ))}
              {isEditing ? (
                <EditTextArea
                  allowEmptyText={!!filePath}
                  style={{ marginBottom: '1rem' }}
                  contentId={reply.id}
                  contentType="comment"
                  text={reply.content}
                  onCancel={() =>
                    onSetIsEditing({
                      contentId: reply.id,
                      contentType: 'comment',
                      isEditing: false
                    })
                  }
                  onEditDone={handleEditDone}
                />
              ) : (
                <div>
                  {isDeleteNotification ? (
                    <div
                      className={css`
                        color: ${Color.gray()};
                        font-weight: bold;
                        margin: 1rem 0;
                        padding: 0.5rem 0;
                        border-radius: ${borderRadius};
                      `}
                    >
                      {commentWasDeletedLabel}
                    </div>
                  ) : !replyIsEmpty ? (
                    <RichText
                      isAIMessage={
                        uploader?.id === Number(ZERO_TWINKLE_ID) ||
                        uploader?.id === Number(CIEL_TWINKLE_ID)
                      }
                      voice={
                        uploader?.id === Number(CIEL_TWINKLE_ID) ? 'nova' : ''
                      }
                      theme={theme}
                      contentType="comment"
                      contentId={reply.id}
                      section="reply"
                      className="comment__content"
                    >
                      {(reply.content || '').trimEnd()}
                    </RichText>
                  ) : null}
                  <div
                    className={css`
                      height: 1em;
                    `}
                  />
                  <div
                    className={css`
                      margin-top: 1rem;
                      display: flex;
                      justify-content: space-between;
                    `}
                  >
                    <div>
                      <div className="comment__buttons">
                        {isDeleteNotification ? null : (
                          <LikeButton
                            contentId={reply.id}
                            contentType="comment"
                            onClick={handleLikeClick}
                            likes={likes}
                            theme={theme}
                          />
                        )}
                        {isDeleteNotification &&
                        (reply.numReplies === 0 || reply.isExpanded) ? (
                          <div
                            className={css`
                              height: 1rem;
                            `}
                          />
                        ) : (
                          <Button
                            transparent
                            style={{
                              marginLeft: isDeleteNotification ? 0 : '1rem'
                            }}
                            onClick={handleReplyClick}
                            disabled={loadingReplies}
                          >
                            <Icon icon="comment-alt" />
                            <span
                              style={{
                                marginLeft: '0.7rem'
                              }}
                            >
                              {!isExpanded && reply.numReplies > 1
                                ? repliesLabel
                                : replyLabel}
                              {loadingReplies ? (
                                <Icon
                                  style={{ marginLeft: '0.7rem' }}
                                  icon="spinner"
                                  pulse
                                />
                              ) : !isExpanded && reply.numReplies > 0 ? (
                                ` (${reply.numReplies})`
                              ) : (
                                ''
                              )}
                            </span>
                          </Button>
                        )}
                        {userCanRewardThis && !isDeleteNotification && (
                          <RewardButton
                            style={{ marginLeft: '1rem' }}
                            contentId={reply.id}
                            contentType="comment"
                            disableReason={xpButtonDisabled}
                            theme={theme}
                          />
                        )}
                      </div>
                      {isDeleteNotification ? null : (
                        <small>
                          <Likers
                            theme={theme}
                            className="comment__likes"
                            userId={userId}
                            likes={reply.likes}
                            onLinkClick={() => setUserListModalShown(true)}
                          />
                        </small>
                      )}
                    </div>
                    {isDeleteNotification ? null : (
                      <div
                        className={css`
                          display: flex;
                          align-items: center;
                          justify-content: center;
                        `}
                      >
                        <Button
                          color={rewardColor}
                          filled={isRecommendedByUser}
                          disabled={recommendationInterfaceShown}
                          onClick={() => setRecommendationInterfaceShown(true)}
                        >
                          <Icon icon="heart" />
                        </Button>
                        {!!userId && !replyIsEmpty && (
                          <ZeroButton
                            contentId={reply.id}
                            contentType="comment"
                            content={reply.content}
                            style={{ marginLeft: '1rem' }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {isDeleteNotification ? null : (
              <RecommendationStatus
                style={{ marginTop: '0.5rem' }}
                contentType="comment"
                recommendations={recommendations}
                theme={theme}
              />
            )}
            {recommendationInterfaceShown && (
              <RecommendationInterface
                style={{ marginTop: '0.5rem' }}
                contentId={reply.id}
                contentType="comment"
                onHide={() => setRecommendationInterfaceShown(false)}
                recommendations={recommendations}
                rewardLevel={rewardLevel}
                content={reply.content}
                theme={theme}
                uploaderId={uploader.id}
              />
            )}
            {xpRewardInterfaceShown && (
              <XPRewardInterface
                innerRef={RewardInterfaceRef}
                rewardLevel={rewardLevel}
                rewards={rewards}
                contentType="comment"
                contentId={reply.id}
                onReward={() =>
                  setRecommendationInterfaceShown(
                    !isRecommendedByUser && twinkleCoins > 0
                  )
                }
                uploaderLevel={uploader.level || 0}
                uploaderId={uploader.id}
              />
            )}
            {isDeleteNotification ? null : (
              <RewardStatus
                noMarginForEditButton
                contentType="comment"
                contentId={reply.id}
                rewardLevel={rewardLevel}
                onCommentEdit={onRewardCommentEdit}
                style={{
                  fontSize: '1.5rem',
                  marginTop: '0.5rem'
                }}
                theme={theme}
                rewards={rewards}
              />
            )}
            <div
              className={css`
                position: relative;
              `}
            >
              {isDeleteNotification ? null : (
                <ReplyInputArea
                  disableReason={disableReason}
                  innerRef={ReplyInputAreaRef}
                  onSubmit={handleSubmitReply}
                  onSubmitWithAttachment={onSubmitWithAttachment}
                  parent={parent}
                  rootCommentId={reply.commentId}
                  style={{
                    marginTop: '0.5rem'
                  }}
                  targetCommentPoster={reply.uploader}
                  theme={theme}
                  targetCommentId={reply.id}
                />
              )}
              {isPostingReply && (
                <Loading
                  style={{
                    position: 'absolute',
                    top: '7rem',
                    zIndex: 100,
                    height: 0
                  }}
                />
              )}
            </div>
          </section>
        </div>
        {userListModalShown && (
          <UserListModal
            onHide={() => setUserListModalShown(false)}
            title={peopleWhoLikeThisReplyLabel}
            users={reply.likes}
          />
        )}
        {confirmModalShown && (
          <ConfirmModal
            onHide={() => setConfirmModalShown(false)}
            title="Remove Reply"
            onConfirm={() => deleteReply(reply.id)}
          />
        )}
        {!!dropdownButtonShown && !isEditing && (
          <div className="dropdown-wrapper">
            <DropdownButton
              skeuomorphic
              icon="chevron-down"
              opacity={0.8}
              menuProps={dropdownMenuItems}
            />
          </div>
        )}
      </div>
    </ErrorBoundary>
  ) : null;

  async function handleEditDone(editedReply: string) {
    try {
      const { content } = await editContent({
        editedComment: editedReply,
        contentId: reply.id,
        contentType: 'comment'
      });
      onEditDone({ editedComment: content, commentId: reply.id });
      onSetIsEditing({
        contentId: reply.id,
        contentType: 'comment',
        isEditing: false
      });
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  }

  function handleLikeClick({
    likes,
    isUnlike
  }: {
    likes: object[];
    isUnlike: boolean;
  }) {
    if (!xpButtonDisabled && userCanRewardThis && !isRewardedByUser) {
      onSetXpRewardInterfaceShown({
        contentId: reply.id,
        contentType: 'comment',
        shown: !isUnlike
      });
    } else {
      if (!isRecommendedByUser && !canReward) {
        setRecommendationInterfaceShown(!isUnlike);
      }
    }
    onLikeClick({ commentId: reply.id, likes });
  }

  async function handleReplyClick() {
    try {
      if (!isDeleteNotification) {
        ReplyInputAreaRef.current.focus();
      }
      if (isExpanded || !reply.numReplies) {
        return;
      }
      setLoadingReplies(true);
      const { replies, loadMoreButton } = await loadReplies({
        commentId: reply.id,
        isLoadingRepliesOfReply: true,
        isReverse: true
      });
      if (typeof replies.length === 'number') {
        onLoadRepliesOfReply({
          replies,
          commentId: reply.commentId,
          replyId: reply.id,
          contentId: parent.contentId,
          contentType: parent.contentType,
          loadMoreButton
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReplies(false);
    }
  }

  async function handleSubmitReply(params: object) {
    try {
      setIsPostingReply(true);
      await onSubmitReply(params);
    } catch (error) {
      console.error('Error submitting reply:', error);
      throw error;
    } finally {
      setIsPostingReply(false);
    }
  }
}

export default memo(Reply);
