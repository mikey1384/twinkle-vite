import PropTypes from 'prop-types';
import { memo, useContext, useEffect, useMemo, useRef, useState } from 'react';
import DropdownButton from '~/components/Buttons/DropdownButton';
import Likers from '~/components/Likers';
import UserListModal from '~/components/Modals/UserListModal';
import Replies from './Replies';
import ReplyInputArea from './Replies/ReplyInputArea';
import EditTextArea from '~/components/Texts/EditTextArea';
import UsernameText from '~/components/Texts/UsernameText';
import ProfilePic from '~/components/ProfilePic';
import Button from '~/components/Button';
import LikeButton from '~/components/Buttons/LikeButton';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import LongText from '~/components/Texts/LongText';
import RewardStatus from '~/components/RewardStatus';
import RecommendationInterface from '~/components/RecommendationInterface';
import RecommendationStatus from '~/components/RecommendationStatus';
import SecretComment from '~/components/SecretComment';
import XPRewardInterface from '~/components/XPRewardInterface';
import SubjectLink from './SubjectLink';
import Icon from '~/components/Icon';
import LoginToViewContent from '~/components/LoginToViewContent';
import ContentFileViewer from '~/components/ContentFileViewer';
import Loading from '~/components/Loading';
import RewardButton from '~/components/Buttons/RewardButton';
import ZeroButton from '~/components/Buttons/ZeroButton';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import { commentContainer } from './Styles';
import { timeSince } from '~/helpers/timeStampHelpers';
import {
  determineUserCanRewardThis,
  determineXpButtonDisabled,
  scrollElementToCenter
} from '~/helpers';
import { useContentState, useLazyLoad, useTheme } from '~/helpers/hooks';
import { borderRadius, Color } from '~/constants/css';
import {
  getFileInfoFromFileName,
  stringIsEmpty
} from '~/helpers/stringHelpers';
import { useAppContext, useContentContext, useKeyContext } from '~/contexts';
import { useInView } from 'react-intersection-observer';
import LocalContext from '../Context';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import localize from '~/constants/localize';

const commentWasDeletedLabel = localize('commentWasDeleted');
const editLabel = localize('edit');
const pinLabel = localize('pin');
const pinnedLabel = localize('pinned');
const peopleWhoLikeThisCommentLabel = localize('peopleWhoLikeThisComment');
const unpinLabel = localize('unpin');
const removeCommentLabel = localize('removeComment');
const repliesLabel = localize('replies');
const replyLabel = localize('reply');

Comment.propTypes = {
  isSubjectPannelComment: PropTypes.bool,
  comment: PropTypes.shape({
    commentId: PropTypes.number,
    content: PropTypes.string.isRequired,
    isDeleted: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]),
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    likes: PropTypes.array,
    numReplies: PropTypes.number,
    profilePicUrl: PropTypes.string,
    recommendationInterfaceShown: PropTypes.bool,
    recommendations: PropTypes.array,
    replies: PropTypes.array,
    replyId: PropTypes.number,
    rewards: PropTypes.array,
    targetObj: PropTypes.object,
    targetUserName: PropTypes.string,
    targetUserId: PropTypes.number,
    timeStamp: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
      .isRequired,
    uploader: PropTypes.object.isRequired,
    filePath: PropTypes.string,
    fileName: PropTypes.string,
    fileSize: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    thumbUrl: PropTypes.string,
    isDeleteNotification: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.bool
    ]),
    isNotification: PropTypes.oneOfType([PropTypes.number, PropTypes.bool])
  }).isRequired,
  innerRef: PropTypes.func,
  isPreview: PropTypes.bool,
  parent: PropTypes.object,
  pinnedCommentId: PropTypes.number,
  rootContent: PropTypes.shape({
    contentType: PropTypes.string
  }),
  subject: PropTypes.object,
  theme: PropTypes.string
};

function Comment({
  comment,
  innerRef,
  isSubjectPannelComment,
  isPreview,
  parent,
  pinnedCommentId,
  rootContent = {},
  subject,
  theme,
  comment: {
    id: commentId,
    replies = [],
    likes = [],
    recommendations = [],
    rewards = [],
    uploader,
    numReplies,
    filePath,
    fileName,
    fileSize,
    isNotification,
    isDeleteNotification,
    thumbUrl: originalThumbUrl
  }
}) {
  const [ComponentRef, inView] = useInView({
    threshold: 0
  });
  const PanelRef = useRef(null);
  subject = subject || comment.targetObj?.subject || {};
  const subjectUploaderId = subject.uploader?.id || subject.userId;
  const { fileType } = getFileInfoFromFileName(fileName);
  const navigate = useNavigate();
  const checkIfUserResponded = useAppContext(
    (v) => v.requestHelpers.checkIfUserResponded
  );
  const editContent = useAppContext((v) => v.requestHelpers.editContent);
  const loadReplies = useAppContext((v) => v.requestHelpers.loadReplies);
  const updateCommentPinStatus = useAppContext(
    (v) => v.requestHelpers.updateCommentPinStatus
  );

  const {
    authLevel,
    banned,
    canDelete,
    canEdit,
    canReward,
    isCreator,
    twinkleCoins,
    userId,
    profileTheme
  } = useKeyContext((v) => v.myState);
  const {
    link: { color: linkColor },
    reward: { color: rewardColor }
  } = useTheme(theme || profileTheme);
  const onChangeSpoilerStatus = useContentContext(
    (v) => v.actions.onChangeSpoilerStatus
  );
  const onLoadReplies = useContentContext((v) => v.actions.onLoadReplies);
  const onSetIsEditing = useContentContext((v) => v.actions.onSetIsEditing);
  const onSetCommentPlaceholderHeight = useContentContext(
    (v) => v.actions.onSetCommentPlaceholderHeight
  );
  const onSetCommentVisible = useContentContext(
    (v) => v.actions.onSetCommentVisible
  );
  const onSetXpRewardInterfaceShown = useContentContext(
    (v) => v.actions.onSetXpRewardInterfaceShown
  );
  const onUpdateCommentPinStatus = useContentContext(
    (v) => v.actions.onUpdateCommentPinStatus
  );

  const {
    commentPlaceholderHeight: previousPlaceholderHeight,
    commentVisible: previousVisible,
    isDeleted,
    isEditing,
    thumbUrl: thumbUrlFromContext,
    xpRewardInterfaceShown
  } = useContentState({
    contentType: 'comment',
    contentId: comment.id
  });

  const thumbUrl = useMemo(
    () => thumbUrlFromContext || originalThumbUrl,
    [originalThumbUrl, thumbUrlFromContext]
  );
  const subjectState = useContentState({
    contentType: 'subject',
    contentId: subject.id
  });
  const {
    onDelete,
    onEditDone,
    onLikeClick,
    onLoadMoreReplies,
    onReplySubmit,
    onRewardCommentEdit,
    onSubmitWithAttachment
  } = useContext(LocalContext);

  const [recommendationInterfaceShown, setRecommendationInterfaceShown] =
    useState(false);

  const [placeholderHeight, setPlaceholderHeight] = useState(
    previousPlaceholderHeight
  );
  const placeholderHeightRef = useRef(previousPlaceholderHeight);
  const [visible, setVisible] = useState(previousVisible);
  const visibleRef = useRef(previousVisible);

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
    delay: 1500
  });

  const heightNotSet = useMemo(
    () => !previousPlaceholderHeight && !placeholderHeight,
    [placeholderHeight, previousPlaceholderHeight]
  );

  const [isPostingReply, setIsPostingReply] = useState(false);
  const [userListModalShown, setUserListModalShown] = useState(false);
  const [confirmModalShown, setConfirmModalShown] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [replying, setReplying] = useState(false);
  const prevReplies = useRef(replies);
  const ReplyInputAreaRef = useRef(null);
  const ReplyRefs = {};
  const RewardInterfaceRef = useRef(null);

  const subjectId = useMemo(
    () => subjectState?.id || subject?.id,
    [subject?.id, subjectState?.id]
  );
  const subjectHasSecretMessage = useMemo(
    () =>
      !!subjectState?.secretAnswer ||
      !!subjectState?.secretAttachment ||
      !!subject?.secretAnswer ||
      !!subject?.secretAttachment,
    [
      subject?.secretAnswer,
      subject?.secretAttachment,
      subjectState?.secretAnswer,
      subjectState?.secretAttachment
    ]
  );
  const isCommentForASubjectWithSecretMessage = useMemo(
    () => !!parent?.secretAnswer || !!parent?.secretAttachment,
    [parent?.secretAnswer, parent?.secretAttachment]
  );
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

  const rewardLevel = useMemo(() => {
    if (isPreview) return 0;
    if (parent.contentType === 'subject' && parent.rewardLevel > 0) {
      return parent.rewardLevel;
    }
    if (rootContent.contentType === 'subject' && rootContent.rewardLevel > 0) {
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
      if (rootContent.rewardLevel > 0) {
        return 1;
      }
    }
    return 0;
  }, [
    isPreview,
    parent.contentType,
    parent.rewardLevel,
    rootContent.contentType,
    rootContent.rewardLevel,
    subject
  ]);

  useEffect(() => {
    if (!isPreview) {
      if (replying && replies?.length > prevReplies.current?.length) {
        setReplying(false);
        scrollElementToCenter(ReplyRefs[replies[replies.length - 1].id]);
      }
      prevReplies.current = replies;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replies]);

  const userIsUploader = useMemo(
    () => uploader?.id === userId,
    [uploader?.id, userId]
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
    () => userId && rootContent.uploader?.id === userId,
    [rootContent.uploader?.id, userId]
  );
  const userIsHigherAuth = useMemo(
    () => authLevel > uploader?.authLevel,
    [authLevel, uploader?.authLevel]
  );

  const dropdownMenuItems = useMemo(() => {
    const userCanEditThis = canEdit && userIsHigherAuth;
    const userCanDeleteThis = canDelete && userIsHigherAuth;
    const items = [];
    if (
      (userIsUploader || userCanEditThis) &&
      (!isCommentForASubjectWithSecretMessage ||
        (userIsUploader && userIsParentUploader))
    ) {
      items.push({
        label: (
          <>
            <Icon icon="pencil-alt" />
            <span style={{ marginLeft: '1rem' }}>{editLabel}</span>
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
      (userIsParentUploader || userIsRootUploader || isCreator) &&
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
    if (userIsUploader || userCanDeleteThis) {
      items.push({
        label: (
          <>
            <Icon icon="trash-alt" />
            <span style={{ marginLeft: '1rem' }}>{removeCommentLabel}</span>
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
    isCreator,
    pinnedCommentId,
    userIsHigherAuth,
    userIsParentUploader,
    userIsRootUploader,
    userIsUploader
  ]);

  const dropdownButtonShown = useMemo(() => {
    if (isNotification || isDeleteNotification || isPreview) {
      return false;
    }
    return !!dropdownMenuItems?.length;
  }, [
    dropdownMenuItems?.length,
    isDeleteNotification,
    isNotification,
    isPreview
  ]);

  const userCanRewardThis = useMemo(
    () =>
      determineUserCanRewardThis({
        canReward,
        authLevel,
        uploader,
        userId,
        recommendations
      }),
    [authLevel, canReward, recommendations, uploader, userId]
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
    if (isPreview) return true;
    return determineXpButtonDisabled({
      rewardLevel,
      myId: userId,
      xpRewardInterfaceShown,
      rewards
    });
  }, [isPreview, rewardLevel, rewards, userId, xpRewardInterfaceShown]);

  const contentShown = useMemo(
    () => heightNotSet || visible || inView,
    [heightNotSet, inView, visible]
  );

  const maxLines = useMemo(() => {
    if (isPreview) {
      if (filePath && (fileType === 'video' || fileType === 'image')) {
        return 3;
      }
      return 5;
    }
    return 10;
  }, [filePath, isPreview, fileType]);

  const commentIsEmpty = useMemo(
    () => stringIsEmpty(comment.content),
    [comment.content]
  );

  const timeSincePost = useMemo(
    () => timeSince(comment.timeStamp),
    [comment.timeStamp]
  );

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
  }, [subjectId, subjectState?.prevSecretViewerId, userId]);

  useEffect(() => {
    return function cleanUp() {
      onSetCommentPlaceholderHeight({
        commentId,
        height: placeholderHeightRef.current
      });
      onSetCommentVisible({
        commentId,
        visible: visibleRef.current
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const viewedTheSecretMessageLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return `${uploader?.username}님이 비밀 메시지를 조회했습니다`;
    }
    return `${uploader?.username} viewed the secret message`;
  }, [uploader?.username]);

  const isDisplayed = useMemo(() => {
    if (
      isDeleteNotification &&
      !isPreview &&
      !isCommentForASubjectWithSecretMessage
    ) {
      if (numReplies === 0 && replies.length === 0) {
        return false;
      }
    }
    return !isDeleted && !comment.isDeleted;
  }, [
    comment.isDeleted,
    isDeleteNotification,
    isDeleted,
    isCommentForASubjectWithSecretMessage,
    isPreview,
    numReplies,
    replies.length
  ]);

  return isDisplayed ? (
    <div ref={ComponentRef}>
      <div
        style={{
          height: contentShown ? 'auto' : placeholderHeight + 8 || '9rem',
          ...(isPreview ? { cursor: 'pointer' } : {})
        }}
        className={commentContainer}
        ref={innerRef}
      >
        {contentShown && (
          <div ref={PanelRef}>
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
                <span style={{ marginLeft: '0.7rem' }}>{pinnedLabel}</span>
              </div>
            )}
            <div className="content-wrapper">
              {(!isDeleteNotification ||
                isCommentForASubjectWithSecretMessage) && (
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
              )}
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
                <div
                  style={{
                    height:
                      isDeleteNotification &&
                      !isCommentForASubjectWithSecretMessage
                        ? '0.3rem'
                        : 'auto'
                  }}
                >
                  {(!isDeleteNotification ||
                    isCommentForASubjectWithSecretMessage) && (
                    <UsernameText className="username" user={uploader} />
                  )}{' '}
                  {(!isDeleteNotification ||
                    isCommentForASubjectWithSecretMessage) && (
                    <small className="timestamp">
                      <a
                        className={css`
                          &:hover {
                            text-decoration: ${isNotification ||
                            isDeleteNotification
                              ? 'none'
                              : 'underline'};
                          }
                        `}
                        style={{
                          cursor:
                            isNotification || isDeleteNotification
                              ? 'default'
                              : 'pointer'
                        }}
                        onClick={() =>
                          isNotification || isDeleteNotification
                            ? null
                            : navigate(`/comments/${comment.id}`)
                        }
                      >
                        {timeSincePost}
                      </a>
                    </small>
                  )}
                </div>
                <div style={{ width: '100%' }}>
                  {comment.targetUserId &&
                    !!comment.replyId &&
                    comment.replyId !== parent.contentId && (
                      <span
                        className="to"
                        style={{ color: Color[linkColor]() }}
                      >
                        to:{' '}
                        <UsernameText
                          user={{
                            username: comment.targetUserName,
                            id: comment.targetUserId
                          }}
                        />
                      </span>
                    )}
                  {isCommentForContentSubject && !isDeleteNotification && (
                    <SubjectLink theme={theme} subject={subject} />
                  )}
                  {filePath &&
                    !isDeleteNotification &&
                    (userId ? (
                      <div style={{ width: '100%', paddingTop: '2rem' }}>
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
                            marginBottom: commentIsEmpty
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
                      text={comment.content}
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
                      ) : isNotification || isDeleteNotification ? (
                        <div
                          style={{
                            color: Color.gray(),
                            fontWeight: 'bold',
                            margin: '1rem 0',
                            borderRadius,
                            padding: '0.5rem 0'
                          }}
                        >
                          {isNotification
                            ? viewedTheSecretMessageLabel
                            : commentWasDeletedLabel}
                        </div>
                      ) : !commentIsEmpty ? (
                        <LongText
                          theme={theme}
                          contentId={commentId}
                          contentType="comment"
                          section="comment"
                          maxLines={maxLines}
                          className="comment__content"
                          isPreview={isPreview}
                        >
                          {comment.content}
                        </LongText>
                      ) : null}
                      {!isPreview && !isHidden && !isNotification && (
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between'
                          }}
                        >
                          <div>
                            <div className="comment__buttons">
                              {isDeleteNotification ? null : (
                                <LikeButton
                                  contentType="comment"
                                  contentId={comment.id}
                                  onClick={handleLikeClick}
                                  likes={likes}
                                  theme={theme}
                                />
                              )}
                              {isDeleteNotification &&
                              (numReplies === 0 || replies.length > 0) ? (
                                <div style={{ height: '1rem' }} />
                              ) : (
                                <Button
                                  disabled={loadingReplies}
                                  transparent
                                  style={{
                                    marginLeft: isDeleteNotification
                                      ? 0
                                      : '1rem'
                                  }}
                                  onClick={handleReplyButtonClick}
                                >
                                  <Icon icon="comment-alt" />
                                  <span style={{ marginLeft: '1rem' }}>
                                    {numReplies > 1 &&
                                    parent.contentType === 'comment'
                                      ? repliesLabel
                                      : replyLabel}
                                    {loadingReplies ? (
                                      <Icon
                                        style={{ marginLeft: '0.7rem' }}
                                        icon="spinner"
                                        pulse
                                      />
                                    ) : numReplies > 0 &&
                                      parent.contentType === 'comment' ? (
                                      ` (${numReplies})`
                                    ) : (
                                      ''
                                    )}
                                  </span>
                                </Button>
                              )}
                              {userCanRewardThis && !isDeleteNotification && (
                                <RewardButton
                                  contentId={commentId}
                                  contentType="comment"
                                  disableReason={xpButtonDisabled}
                                  style={{ marginLeft: '0.7rem' }}
                                  theme={theme}
                                />
                              )}
                            </div>
                            {isDeleteNotification ? null : (
                              <Likers
                                theme={theme}
                                className="comment__likes"
                                userId={userId}
                                likes={likes}
                                onLinkClick={() => setUserListModalShown(true)}
                              />
                            )}
                          </div>
                          {isDeleteNotification ? null : (
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center'
                              }}
                            >
                              <Button
                                color={rewardColor}
                                filled={isRecommendedByUser}
                                disabled={recommendationInterfaceShown}
                                onClick={() =>
                                  setRecommendationInterfaceShown(true)
                                }
                              >
                                <Icon icon="heart" />
                              </Button>
                              {!!userId && !commentIsEmpty && (
                                <ZeroButton
                                  contentId={commentId}
                                  contentType="comment"
                                  content={comment.content}
                                  style={{ marginLeft: '1rem' }}
                                />
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {!isPreview && !isDeleteNotification && (
                  <RecommendationStatus
                    style={{ marginTop: likes.length > 0 ? '0.5rem' : '1rem' }}
                    contentType="comment"
                    recommendations={recommendations}
                    theme={theme}
                  />
                )}
                {!isPreview && recommendationInterfaceShown && (
                  <RecommendationInterface
                    style={{ marginTop: likes.length > 0 ? '0.5rem' : '1rem' }}
                    contentId={commentId}
                    contentType="comment"
                    onHide={() => setRecommendationInterfaceShown(false)}
                    recommendations={recommendations}
                    content={comment.content}
                    rewardLevel={rewardLevel}
                    theme={theme}
                    uploaderId={uploader?.id}
                  />
                )}
                {!isPreview && xpRewardInterfaceShown && (
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
                    uploaderAuthLevel={uploader?.authLevel}
                    uploaderId={uploader?.id}
                  />
                )}
                {!isPreview && !isDeleteNotification && (
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
                    theme={theme}
                    rewards={rewards}
                    uploaderName={uploader?.username}
                  />
                )}
                {!isPreview && !isNotification && !isHidden && (
                  <div style={{ position: 'relative' }}>
                    {isDeleteNotification ? null : (
                      <ReplyInputArea
                        innerRef={ReplyInputAreaRef}
                        numReplies={numReplies}
                        onSubmit={submitReply}
                        onSubmitWithAttachment={handleSubmitWithAttachment}
                        parent={parent}
                        rootCommentId={comment.commentId}
                        style={{
                          marginTop: '0.5rem'
                        }}
                        theme={theme}
                        targetCommentId={comment.id}
                      />
                    )}
                    {isPostingReply && (
                      <Loading
                        style={{ position: 'absolute', top: '7rem', height: 0 }}
                      />
                    )}
                    <Replies
                      isSubjectPannelComment={isSubjectPannelComment}
                      pinnedCommentId={pinnedCommentId}
                      subject={subject || {}}
                      userId={userId}
                      replies={replies}
                      comment={comment}
                      parent={parent}
                      rootContent={rootContent}
                      onLoadMoreReplies={onLoadMoreReplies}
                      onPinReply={handlePinComment}
                      onReplySubmit={onReplySubmit}
                      ReplyRefs={ReplyRefs}
                      theme={theme}
                    />
                  </div>
                )}
              </section>
            </div>
          </div>
        )}
        {userListModalShown && (
          <UserListModal
            onHide={() => setUserListModalShown(false)}
            title={peopleWhoLikeThisCommentLabel}
            users={likes}
          />
        )}
      </div>
      {confirmModalShown && (
        <ConfirmModal
          onHide={() => setConfirmModalShown(false)}
          title={removeCommentLabel}
          onConfirm={async () => {
            await onDelete(comment.id);
            setConfirmModalShown(false);
          }}
        />
      )}
    </div>
  ) : null;

  async function handleEditDone(editedComment) {
    try {
      const { content } = await editContent({
        editedComment,
        contentId: comment.id,
        contentType: 'comment'
      });
      onEditDone({ editedComment: content, commentId: comment.id });
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

  function handleLikeClick({ likes, isUnlike }) {
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

  async function handlePinComment(commentId) {
    const root = parent.contentType === 'comment' ? rootContent : parent;
    let contentId = isSubjectPannelComment
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

  async function handleReplyButtonClick() {
    if (numReplies > 0 && parent.contentType === 'comment') {
      try {
        setLoadingReplies(true);
        const { loadMoreButton, replies } = await loadReplies({
          commentId
        });
        onLoadReplies({
          commentId,
          loadMoreButton,
          replies,
          contentType: 'comment',
          contentId: parent.contentId
        });
      } catch (err) {
        console.error(err);
      }
      setLoadingReplies(false);
    }
    if (!isDeleteNotification) ReplyInputAreaRef.current.focus();
  }

  async function handleSubmitWithAttachment(params) {
    setReplying(true);
    await onSubmitWithAttachment(params);
  }

  async function submitReply(reply) {
    setReplying(true);
    setIsPostingReply(true);
    await onReplySubmit(reply);
    setIsPostingReply(false);
  }
}

export default memo(Comment);
