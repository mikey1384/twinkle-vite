import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import DropdownButton from '~/components/Buttons/DropdownButton';
import Likers from '~/components/Likers';
import UserListModal from '~/components/Modals/UserListModal';
import EditTextArea from '~/components/Texts/EditTextArea';
import UsernameText from '~/components/Texts/UsernameText';
import ProfilePic from '~/components/ProfilePic';
import Button from '~/components/Button';
import LikeButton from '~/components/Buttons/LikeButton';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import RichText from '~/components/Texts/RichText';
import RewardStatus from '~/components/RewardStatus';
import RecommendationInterface from '~/components/RecommendationInterface';
import RecommendationStatus from '~/components/RecommendationStatus';
import SecretComment from '~/components/SecretComment';
import XPRewardInterface from '~/components/XPRewardInterface';
import SubjectLink from '../SubjectLink';
import Icon from '~/components/Icon';
import LoginToViewContent from '~/components/LoginToViewContent';
import ContentFileViewer from '~/components/ContentFileViewer';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import { commentContainer } from '../Styles';
import { timeSince } from '~/helpers/timeStampHelpers';
import { useContentState, useMyLevel } from '~/helpers/hooks';
import {
  determineUserCanRewardThis,
  determineXpButtonDisabled,
  returnTheme
} from '~/helpers';
import { borderRadius, Color } from '~/constants/css';
import {
  getFileInfoFromFileName,
  stringIsEmpty
} from '~/helpers/stringHelpers';
import { useAppContext, useContentContext, useKeyContext } from '~/contexts';
import LocalContext from '../../Context';
import localize from '~/constants/localize';

const pinLabel = localize('pin');
const unpinLabel = localize('unpin');

export default function SearchedComment({
  comment,
  isSubjectPannelComment,
  parent,
  pinnedCommentId,
  rootContent = {},
  subject,
  theme,
  comment: {
    id: commentId,
    uploader,
    numReplies,
    filePath,
    fileName,
    fileSize,
    isNotification,
    thumbUrl: originalThumbUrl
  }
}: {
  comment: {
    commentId?: number;
    content: string;
    id: number;
    likes?: any[];
    numReplies: number;
    profilePicUrl?: string;
    recommendationInterfaceShown?: boolean;
    recommendations?: [];
    replies?: any[];
    replyId?: number;
    rewards?: any[];
    targetObj?: any;
    targetUserName?: string;
    targetUserId?: number;
    timeStamp: number | string;
    uploader?: any;
    filePath?: string;
    fileName: string;
    fileSize?: number | string;
    thumbUrl?: string;
    isNotification?: number | boolean;
  };
  isSubjectPannelComment?: boolean;
  pinnedCommentId?: number;
  parent: any;
  rootContent?: {
    rewardLevel?: number;
    contentType?: string;
  };
  subject: any;
  theme: string;
}) {
  const loadContent = useAppContext((v) => v.requestHelpers.loadContent);
  const onInitContent = useContentContext((v) => v.actions.onInitContent);
  const {
    isDeleted,
    isEditing,
    likes = comment?.likes || [],
    recommendations = comment?.recommendations || [],
    rewards = comment?.rewards || [],
    loaded,
    thumbUrl: thumbUrlFromContext,
    xpRewardInterfaceShown,
    content
  } = useContentState({
    contentType: 'comment',
    contentId: comment.id
  });
  useEffect(() => {
    if (!loaded) {
      init();
    }
    async function init() {
      const data = await loadContent({
        contentId: comment?.id,
        contentType: 'comment',
        isPinnedComment: true
      });
      onInitContent({
        contentId: comment?.id,
        contentType: 'comment',
        ...data
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comment?.id]);

  subject = subject || comment.targetObj?.subject || {};
  const subjectUploaderId = useMemo(
    () => subject.uploader?.id || subject?.userId,
    [subject]
  );
  const { fileType } = getFileInfoFromFileName(fileName);
  const navigate = useNavigate();
  const checkIfUserResponded = useAppContext(
    (v) => v.requestHelpers.checkIfUserResponded
  );
  const editContent = useAppContext((v) => v.requestHelpers.editContent);
  const updateCommentPinStatus = useAppContext(
    (v) => v.requestHelpers.updateCommentPinStatus
  );

  const { banned, isAdmin, level, profileTheme, twinkleCoins, userId } =
    useKeyContext((v) => v.myState);
  const { canDelete, canEdit, canReward } = useMyLevel();

  const {
    link: { color: linkColor },
    reward: { color: rewardColor }
  } = useMemo(() => returnTheme(theme || profileTheme), [profileTheme, theme]);
  const onChangeSpoilerStatus = useContentContext(
    (v) => v.actions.onChangeSpoilerStatus
  );
  const onSetIsEditing = useContentContext((v) => v.actions.onSetIsEditing);
  const onSetXpRewardInterfaceShown = useContentContext(
    (v) => v.actions.onSetXpRewardInterfaceShown
  );
  const onUpdateCommentPinStatus = useContentContext(
    (v) => v.actions.onUpdateCommentPinStatus
  );

  const thumbUrl = useMemo(
    () => thumbUrlFromContext || originalThumbUrl,
    [originalThumbUrl, thumbUrlFromContext]
  );
  const subjectState = useContentState({
    contentType: 'subject',
    contentId: subject.id
  });
  const { onDelete, onEditDone, onLikeClick, onRewardCommentEdit } =
    useContext(LocalContext);

  const [recommendationInterfaceShown, setRecommendationInterfaceShown] =
    useState(false);
  const [userListModalShown, setUserListModalShown] = useState(false);
  const [confirmModalShown, setConfirmModalShown] = useState(false);
  const RewardInterfaceRef = useRef(null);

  const subjectId = useMemo(
    () => subjectState?.id || subject?.id,
    [subject?.id, subjectState?.id]
  );
  const subjectHasSecretMessage = useMemo(
    () => !!subjectState?.secretAnswer || !!subject?.secretAnswer,
    [subject?.secretAnswer, subjectState?.secretAnswer]
  );
  const isCommentForASubjectWithSecretMessage = useMemo(
    () => !!parent?.secretAnswer || !!parent?.secretAttachment,
    [parent?.secretAnswer, parent?.secretAttachment]
  );
  const isRecommendedByUser = useMemo(() => {
    return (
      recommendations.filter(
        (recommendation: { userId: number }) => recommendation.userId === userId
      ).length > 0
    );
  }, [recommendations, userId]);

  const isRewardedByUser = useMemo(() => {
    return (
      rewards.filter(
        (reward: { rewarderId: number }) => reward.rewarderId === userId
      ).length > 0
    );
  }, [rewards, userId]);

  const rewardLevel = useMemo(() => {
    if (parent.contentType === 'subject' && parent.rewardLevel > 0) {
      return parent.rewardLevel;
    }
    if (
      rootContent.contentType === 'subject' &&
      (rootContent.rewardLevel || 0) > 0
    ) {
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
    if (
      rootContent.contentType === 'video' ||
      rootContent.contentType === 'url'
    ) {
      if (subject?.rewardLevel) {
        return subject?.rewardLevel;
      }
      if ((rootContent.rewardLevel || 0) > 0) {
        return 1;
      }
    }
    return 0;
  }, [
    parent.contentType,
    parent.rewardLevel,
    rootContent.contentType,
    rootContent.rewardLevel,
    subject
  ]);

  const userIsUploader = useMemo(
    () => uploader.id === userId,
    [uploader.id, userId]
  );
  const userIsParentUploader = useMemo(
    () =>
      userId &&
      parent.contentType !== 'comment' &&
      parent.uploader?.id === userId,
    [parent.contentType, parent.uploader?.id, userId]
  );
  const userHasHigherLevel = useMemo(() => {
    return level > uploader?.level;
  }, [level, uploader?.level]);
  const dropdownButtonShown = useMemo(() => {
    if (isNotification) {
      return false;
    }
    const userCanEditThis = (canEdit || canDelete) && userHasHigherLevel;
    return userIsUploader || userCanEditThis || userIsParentUploader;
  }, [
    canDelete,
    canEdit,
    isNotification,
    userHasHigherLevel,
    userIsParentUploader,
    userIsUploader
  ]);

  const dropdownMenuItems = useMemo(() => {
    const items = [];
    if (
      (userIsUploader || canEdit) &&
      !isNotification &&
      (!isCommentForASubjectWithSecretMessage ||
        (userIsUploader && userIsParentUploader))
    ) {
      items.push({
        label: (
          <>
            <Icon icon="pencil-alt" />
            <span style={{ marginLeft: '1rem' }}>Edit</span>
          </>
        ),
        onClick: () =>
          onSetIsEditing({
            contentId: comment.id,
            contentType: 'comment',
            isEditing: true
          })
      });
    }
    if (
      (userIsParentUploader || isAdmin) &&
      !isNotification &&
      !banned?.posting
    ) {
      items.push({
        label: (
          <>
            <Icon icon={['fas', 'thumbtack']} />
            <span style={{ marginLeft: '1rem' }}>
              {pinnedCommentId === comment.id ? unpinLabel : pinLabel}
            </span>
          </>
        ),
        onClick: () =>
          handlePinComment(pinnedCommentId === comment.id ? null : comment.id)
      });
    }
    if (userIsUploader || canDelete) {
      items.push({
        label: (
          <>
            <Icon icon="trash-alt" />
            <span style={{ marginLeft: '1rem' }}>Remove</span>
          </>
        ),
        onClick: () => setConfirmModalShown(true)
      });
    }
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    banned?.posting,
    canDelete,
    canEdit,
    comment.id,
    isCommentForASubjectWithSecretMessage,
    isAdmin,
    isNotification,
    pinnedCommentId,
    userIsParentUploader,
    userIsUploader
  ]);

  const userCanRewardThis = useMemo(
    () =>
      determineUserCanRewardThis({
        canReward,
        userLevel: level,
        uploader,
        userId,
        recommendations
      }),
    [level, canReward, recommendations, uploader, userId]
  );

  const isCommentForContentSubject = useMemo(
    () => parent.contentType !== 'subject' && !parent.subjectId && subject,
    [parent.contentType, parent.subjectId, subject]
  );

  const isHidden = useMemo(() => {
    const secretShown =
      subjectState.secretShown || subjectUploaderId === userId;
    return subjectHasSecretMessage && !secretShown;
  }, [
    subjectUploaderId,
    subjectHasSecretMessage,
    subjectState.secretShown,
    userId
  ]);

  const xpButtonDisabled = useMemo(() => {
    return determineXpButtonDisabled({
      rewardLevel,
      myId: userId,
      xpRewardInterfaceShown,
      rewards
    });
  }, [rewardLevel, rewards, userId, xpRewardInterfaceShown]);

  useEffect(() => {
    if (
      userId &&
      subjectHasSecretMessage &&
      subjectId &&
      subjectState.prevSecretViewerId !== userId
    ) {
      handleCheckSecretShown();
    }
    if (!userId) {
      onChangeSpoilerStatus({
        shown: false,
        subjectId
      });
    }

    async function handleCheckSecretShown() {
      const { responded } = await checkIfUserResponded(subjectId);
      onChangeSpoilerStatus({
        shown: responded,
        subjectId,
        prevSecretViewerId: userId
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId, subjectState.prevSecretViewerId, userId]);

  return isDeleted ? null : (
    <>
      <div className={commentContainer}>
        {pinnedCommentId === comment.id && (
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
            <span style={{ marginLeft: '0.7rem' }}>Pinned</span>
          </div>
        )}
        <div className="content-wrapper">
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
                userId={uploader?.id}
                profilePicUrl={uploader?.profilePicUrl}
              />
            </div>
          </div>
          {dropdownButtonShown && !isEditing && (
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
            <div>
              <UsernameText className="username" user={uploader} />{' '}
              <small className="timestamp">
                <a
                  className={css`
                    &:hover {
                      text-decoration: ${isNotification ? 'none' : 'underline'};
                    }
                  `}
                  style={{ cursor: isNotification ? 'default' : 'pointer' }}
                  onClick={() =>
                    isNotification ? null : navigate(`/comments/${comment.id}`)
                  }
                >
                  {timeSince(comment.timeStamp)}
                </a>
              </small>
            </div>
            <div style={{ width: '100%' }}>
              {comment.targetUserId &&
                !!comment.replyId &&
                comment.replyId !== parent.contentId && (
                  <span className="to" style={{ color: Color[linkColor]() }}>
                    to:{' '}
                    <UsernameText
                      user={{
                        username: comment.targetUserName || '',
                        id: comment.targetUserId
                      }}
                    />
                  </span>
                )}
              {isCommentForContentSubject && (
                <SubjectLink theme={theme} subject={subject} />
              )}
              {filePath &&
                (userId ? (
                  <div style={{ width: '100%', paddingTop: '3rem' }}>
                    <ContentFileViewer
                      theme={theme}
                      contentId={comment.id}
                      contentType="comment"
                      fileName={fileName}
                      filePath={filePath}
                      fileSize={Number(fileSize)}
                      thumbUrl={thumbUrl}
                      videoHeight="100%"
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        marginBottom: stringIsEmpty(content)
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
                  contentType="comment"
                  contentId={comment.id}
                  text={content}
                  onCancel={() =>
                    onSetIsEditing({
                      contentId: comment.id,
                      contentType: 'comment',
                      isEditing: false
                    })
                  }
                  onEditDone={handleEditDone}
                />
              ) : (
                <div style={{ width: '100%' }}>
                  {isHidden ? (
                    <SecretComment
                      onClick={() => navigate(`/subjects/${subject?.id}`)}
                    />
                  ) : isNotification ? (
                    <div
                      style={{
                        color: Color.gray(),
                        fontWeight: 'bold',
                        margin: '1rem 0',
                        borderRadius
                      }}
                    >
                      {uploader.username} viewed the secret message
                    </div>
                  ) : (
                    !stringIsEmpty(content) && (
                      <RichText
                        contentType="comment"
                        contentId={commentId}
                        section="pinned"
                        className="comment__content"
                      >
                        {(content || '').trim()}
                      </RichText>
                    )
                  )}
                  <div style={{ height: '1em' }} />
                  {!isHidden && !isNotification && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div className="comment__buttons">
                          <LikeButton
                            theme={theme}
                            contentType="comment"
                            contentId={comment.id}
                            onClick={handleLikeClick}
                            likes={likes}
                          />
                          <Button
                            transparent
                            style={{ marginLeft: '1rem' }}
                            onClick={() => navigate(`/comments/${comment.id}`)}
                          >
                            <Icon icon="comment-alt" />
                            <span style={{ marginLeft: '1rem' }}>
                              {numReplies > 1 &&
                              parent.contentType === 'comment'
                                ? 'Replies'
                                : 'Reply'}
                              {numReplies > 0 ? ` (${numReplies})` : ''}
                            </span>
                          </Button>
                          {userCanRewardThis && (
                            <Button
                              color={rewardColor}
                              style={{ marginLeft: '0.7rem' }}
                              onClick={() =>
                                onSetXpRewardInterfaceShown({
                                  contentId: commentId,
                                  contentType: 'comment',
                                  shown: true
                                })
                              }
                              disabled={!!xpButtonDisabled}
                            >
                              <Icon icon="certificate" />
                              <span style={{ marginLeft: '0.7rem' }}>
                                {xpButtonDisabled || 'Reward'}
                              </span>
                            </Button>
                          )}
                        </div>
                        <Likers
                          theme={theme}
                          className="comment__likes"
                          userId={userId}
                          likes={likes}
                          onLinkClick={() => setUserListModalShown(true)}
                        />
                      </div>
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
                    </div>
                  )}
                </div>
              )}
            </div>
            <RecommendationStatus
              style={{ marginTop: likes.length > 0 ? '0.5rem' : '1rem' }}
              contentType="comment"
              recommendations={recommendations}
              theme={theme}
            />
            {recommendationInterfaceShown && (
              <RecommendationInterface
                style={{ marginTop: likes.length > 0 ? '0.5rem' : '1rem' }}
                contentId={commentId}
                contentType="comment"
                onHide={() => setRecommendationInterfaceShown(false)}
                recommendations={recommendations}
                rewardLevel={rewardLevel}
                content={content}
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
                contentId={comment.id}
                onReward={() =>
                  setRecommendationInterfaceShown(
                    !isRecommendedByUser && twinkleCoins > 0
                  )
                }
                uploaderLevel={uploader.level}
                uploaderId={uploader.id}
              />
            )}
            <RewardStatus
              contentType="comment"
              contentId={comment.id}
              rewardLevel={rewardLevel}
              noMarginForEditButton
              onCommentEdit={onRewardCommentEdit}
              style={{
                fontSize: '1.5rem',
                marginTop: likes?.length > 0 ? '0.5rem' : '1rem'
              }}
              rewards={rewards}
              theme={theme}
            />
          </section>
        </div>
        {userListModalShown && (
          <UserListModal
            onHide={() => setUserListModalShown(false)}
            title="People who liked this comment"
            users={likes}
          />
        )}
      </div>
      {confirmModalShown && (
        <ConfirmModal
          onHide={() => setConfirmModalShown(false)}
          title="Remove Comment"
          onConfirm={() => onDelete(comment.id)}
        />
      )}
    </>
  );

  async function handleEditDone(editedComment: string) {
    try {
      await editContent({
        editedComment,
        contentId: comment.id,
        contentType: 'comment'
      });
      onEditDone({ editedComment, commentId: comment.id });
      onSetIsEditing({
        contentId: comment.id,
        contentType: 'comment',
        isEditing: false
      });
      Promise.resolve();
    } catch (error) {
      Promise.reject(error);
    }
  }

  function handleLikeClick({
    likes,
    isUnlike
  }: {
    likes: any[];
    isUnlike: boolean;
  }) {
    if (!xpButtonDisabled && userCanRewardThis && !isRewardedByUser) {
      onSetXpRewardInterfaceShown({
        contentId: comment.id,
        contentType: 'comment',
        shown: !isUnlike
      });
    } else {
      if (!isRecommendedByUser && !canReward) {
        setRecommendationInterfaceShown(!isUnlike);
      }
    }
    onLikeClick({ commentId: comment.id, likes });
  }

  async function handlePinComment(commentId: number | null) {
    const root = parent.contentType === 'comment' ? rootContent : parent;
    const contentId = isSubjectPannelComment
      ? subject.id
      : root.contentId || root.id;
    const contentType = isSubjectPannelComment ? 'subject' : root.contentType;
    await updateCommentPinStatus({
      commentId,
      contentId,
      contentType
    });
    onUpdateCommentPinStatus({
      contentId,
      contentType,
      commentId
    });
  }
}
