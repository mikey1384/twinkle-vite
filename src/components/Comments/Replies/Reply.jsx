import { memo, useContext, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import LocalContext from '../Context';
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
import LongText from '~/components/Texts/LongText';
import RecommendationInterface from '~/components/RecommendationInterface';
import RecommendationStatus from '~/components/RecommendationStatus';
import LoginToViewContent from '~/components/LoginToViewContent';
import RewardStatus from '~/components/RewardStatus';
import XPRewardInterface from '~/components/XPRewardInterface';
import ContentFileViewer from '~/components/ContentFileViewer';
import { commentContainer } from '../Styles';
import { Link } from 'react-router-dom';
import { borderRadius, Color } from '~/constants/css';
import {
  determineUserCanRewardThis,
  determineXpButtonDisabled
} from '~/helpers';
import { useContentState, useTheme } from '~/helpers/hooks';
import { timeSince } from '~/helpers/timeStampHelpers';
import { useAppContext, useContentContext, useKeyContext } from '~/contexts';
import {
  getFileInfoFromFileName,
  stringIsEmpty
} from '~/helpers/stringHelpers';
import localize from '~/constants/localize';

const commentWasDeletedLabel = localize('commentWasDeleted');
const editLabel = localize('edit');
const pinLabel = localize('pin');
const pinnedLabel = localize('pinned');
const peopleWhoLikeThisReplyLabel = localize('peopleWhoLikeThisReply');
const unpinLabel = localize('unpin');
const removeReplyLabel = localize('removeReply');
const repliesLabel = localize('replies');
const replyLabel = localize('reply');
const rewardLabel = localize('reward');

Reply.propTypes = {
  comment: PropTypes.shape({
    id: PropTypes.number.isRequired
  }),
  innerRef: PropTypes.func,
  deleteReply: PropTypes.func.isRequired,
  isSubjectPannelComment: PropTypes.bool,
  onLoadRepliesOfReply: PropTypes.func,
  onPinReply: PropTypes.func,
  onSubmitWithAttachment: PropTypes.func.isRequired,
  parent: PropTypes.object.isRequired,
  pinnedCommentId: PropTypes.number,
  reply: PropTypes.shape({
    commentId: PropTypes.number.isRequired,
    content: PropTypes.string.isRequired,
    isExpanded: PropTypes.bool,
    isDeleted: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]),
    filePath: PropTypes.string,
    fileName: PropTypes.string,
    fileSize: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    thumbUrl: PropTypes.string,
    id: PropTypes.number.isRequired,
    likes: PropTypes.array,
    numReplies: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    originType: PropTypes.string,
    recommendations: PropTypes.array,
    profilePicUrl: PropTypes.string,
    replyId: PropTypes.number,
    rewards: PropTypes.array,
    targetObj: PropTypes.object,
    targetUserId: PropTypes.number,
    targetUserName: PropTypes.string,
    isDeleteNotification: PropTypes.oneOfType([
      PropTypes.bool,
      PropTypes.number
    ]),
    timeStamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      .isRequired,
    uploader: PropTypes.object.isRequired
  }),
  rootContent: PropTypes.object,
  subject: PropTypes.object,
  onSubmitReply: PropTypes.func.isRequired,
  theme: PropTypes.string
};

function Reply({
  comment,
  innerRef = () => {},
  deleteReply,
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
}) {
  const editContent = useAppContext((v) => v.requestHelpers.editContent);
  const loadReplies = useAppContext((v) => v.requestHelpers.loadReplies);
  const {
    authLevel,
    banned,
    canDelete,
    canEdit,
    canReward,
    isCreator,
    profileTheme,
    twinkleCoins,
    userId
  } = useKeyContext((v) => v.myState);
  const {
    link: { color: linkColor },
    reward: { color: rewardColor }
  } = useTheme(theme || profileTheme);
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
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [userListModalShown, setUserListModalShown] = useState(false);
  const [confirmModalShown, setConfirmModalShown] = useState(false);
  const [recommendationInterfaceShown, setRecommendationInterfaceShown] =
    useState(false);
  const ReplyInputAreaRef = useRef(null);
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
  const userIsHigherAuth = authLevel > uploader.authLevel;

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
    const userCanEditThis = (canEdit || canDelete) && userIsHigherAuth;
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
    userIsHigherAuth,
    userIsParentUploader,
    userIsRootUploader,
    userIsUploader
  ]);

  const userCanRewardThis = useMemo(
    () =>
      determineUserCanRewardThis({
        canReward,
        authLevel,
        recommendations,
        uploader,
        userId
      }),
    [authLevel, canReward, recommendations, uploader, userId]
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
      (userIsParentUploader || userIsRootUploader || isCreator) &&
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
            style={{
              lineHeight: 1,
              fontSize: '1.3rem',
              fontWeight: 'bold',
              color: Color.darkerGray(),
              marginBottom: '0.2rem'
            }}
          >
            <Icon icon={['fas', 'thumbtack']} />
            <span style={{ marginLeft: '0.7rem' }}>{pinnedLabel}</span>
          </div>
        )}
        <div className="content-wrapper">
          {isDeleteNotification ? null : (
            <div
              style={{
                display: 'flex',
                width: '7rem',
                marginTop: '1rem',
                justifyContent: 'center'
              }}
            >
              <div style={{ width: '5rem' }}>
                <ProfilePic
                  style={{ width: '100%' }}
                  userId={uploader.id}
                  profilePicUrl={uploader.profilePicUrl}
                />
              </div>
            </div>
          )}
          {!!dropdownButtonShown && !isEditing && (
            <div className="dropdown-wrapper">
              <DropdownButton
                skeuomorphic
                icon="chevron-down"
                color="darkerGray"
                opacity={0.8}
                menuProps={dropdownMenuItems}
              />
            </div>
          )}
          <section>
            <div
              style={{
                height: isDeleteNotification ? '0.3rem' : 'auto'
              }}
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
                (userId ? (
                  <div style={{ width: '100%', paddingTop: '2rem' }}>
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
                      style={{
                        color: Color.gray(),
                        fontWeight: 'bold',
                        margin: '1rem 0',
                        padding: '0.5rem 0',
                        borderRadius
                      }}
                    >
                      {commentWasDeletedLabel}
                    </div>
                  ) : !replyIsEmpty ? (
                    <LongText
                      theme={theme}
                      contentType="comment"
                      contentId={reply.id}
                      section="reply"
                      className="comment__content"
                    >
                      {reply.content}
                    </LongText>
                  ) : null}
                  <div
                    style={{
                      marginTop: '1rem',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}
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
                            small
                          />
                        )}
                        {isDeleteNotification &&
                        (reply.numReplies === 0 || reply.isExpanded) ? (
                          <div style={{ height: '1rem' }} />
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
                          <Button
                            color={rewardColor}
                            style={{ marginLeft: '1rem' }}
                            onClick={() =>
                              onSetXpRewardInterfaceShown({
                                contentId: reply.id,
                                contentType: 'comment',
                                shown: true
                              })
                            }
                            disabled={!!xpButtonDisabled}
                          >
                            <Icon icon="certificate" />
                            <span style={{ marginLeft: '0.7rem' }}>
                              {xpButtonDisabled || rewardLabel}
                            </span>
                          </Button>
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
                      <div>
                        <Button
                          color={rewardColor}
                          filled={isRecommendedByUser}
                          disabled={recommendationInterfaceShown}
                          onClick={() => setRecommendationInterfaceShown(true)}
                        >
                          <Icon icon="heart" />
                        </Button>
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
                uploaderAuthLevel={uploader.authLevel}
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
                rewards={rewards}
                uploaderName={uploader.username}
              />
            )}
            {isDeleteNotification ? null : (
              <ReplyInputArea
                innerRef={ReplyInputAreaRef}
                onSubmit={onSubmitReply}
                onSubmitWithAttachment={onSubmitWithAttachment}
                parent={parent}
                rootCommentId={reply.commentId}
                style={{
                  marginTop: '0.5rem'
                }}
                theme={theme}
                targetCommentId={reply.id}
              />
            )}
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
      </div>
    </ErrorBoundary>
  ) : null;

  async function handleEditDone(editedReply) {
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
  }

  function handleLikeClick({ likes, isUnlike }) {
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
    if (!isDeleteNotification) {
      ReplyInputAreaRef.current.focus();
    }
    if (isExpanded || !reply.numReplies) {
      return;
    }
    setLoadingReplies(true);
    const { replies, loadMoreButton } = await loadReplies({
      commentId: reply.id,
      isReverse: true
    });
    if (replies.length > 0) {
      onLoadRepliesOfReply({
        replies,
        commentId: reply.commentId,
        replyId: reply.id,
        contentId: parent.contentId,
        contentType: parent.contentType,
        loadMoreButton
      });
    }
    setLoadingReplies(false);
  }
}

export default memo(Reply);
