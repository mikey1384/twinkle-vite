import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import LocalContext from '../Context';
import UserListModal from '~/components/Modals/UserListModal';
import Comments from '~/components/Comments';
import MainContent from './MainContent';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import XPRewardInterface from '~/components/XPRewardInterface';
import RecommendationInterface from '~/components/RecommendationInterface';
import RewardStatus from '~/components/RewardStatus';
import RecommendationStatus from '~/components/RecommendationStatus';
import ErrorBoundary from '~/components/ErrorBoundary';
import AlertModal from '~/components/Modals/AlertModal';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { determineUserCanRewardThis, returnTheme } from '~/helpers';
import { useContentState, useMyLevel } from '~/helpers/hooks';
import { useAppContext, useContentContext, useKeyContext } from '~/contexts';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import localize from '~/constants/localize';
import BottomInterface from './BottomInterface';

const settingCannotBeChangedLabel = localize('settingCannotBeChanged');

Body.propTypes = {
  autoExpand: PropTypes.bool,
  commentsShown: PropTypes.bool,
  contentObj: PropTypes.object.isRequired,
  inputAtBottom: PropTypes.bool,
  numPreviewComments: PropTypes.number,
  onChangeSpoilerStatus: PropTypes.func.isRequired,
  theme: PropTypes.string
};
export default function Body({
  autoExpand = false,
  commentsShown = false,
  contentObj,
  contentObj: {
    commentsLoaded,
    contentId,
    rewardLevel,
    id,
    comments = [],
    commentsLoadMoreButton = false,
    isNotification,
    likes = [],
    previewLoaded,
    recommendations = [],
    rootId,
    rootType,
    rewards = [],
    targetObj = {},
    contentType,
    uploader = {}
  },
  inputAtBottom,
  numPreviewComments = 0,
  onChangeSpoilerStatus,
  theme
}: {
  autoExpand?: boolean;
  commentsShown?: boolean;
  contentObj: any;
  inputAtBottom?: boolean;
  numPreviewComments?: number;
  onChangeSpoilerStatus: (params: object) => void;
  theme: string;
}) {
  const closeContent = useAppContext((v) => v.requestHelpers.closeContent);
  const deleteContent = useAppContext((v) => v.requestHelpers.deleteContent);
  const loadComments = useAppContext((v) => v.requestHelpers.loadComments);
  const loadContent = useAppContext((v) => v.requestHelpers.loadContent);
  const checkIfUserResponded = useAppContext(
    (v) => v.requestHelpers.checkIfUserResponded
  );

  const { level, profileTheme, twinkleCoins, userId } = useKeyContext(
    (v) => v.myState
  );
  const { canDelete, canEdit, canReward } = useMyLevel();

  const {
    reward: { color: rewardColor }
  } = useMemo(() => returnTheme(theme || profileTheme), [profileTheme, theme]);

  const onInitContent = useContentContext((v) => v.actions.onInitContent);
  const onSetIsEditing = useContentContext((v) => v.actions.onSetIsEditing);
  const onCloseContent = useContentContext((v) => v.actions.onCloseContent);
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

  const rootObj = useContentState({
    contentType: rootType,
    contentId: rootId
  });

  useEffect(() => {
    if (rootId && rootType && !rootObj?.loaded) {
      initRoot();
    }

    async function initRoot() {
      const data = await loadContent({
        contentId: rootId,
        contentType: rootType
      });
      onInitContent(data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subjectState = useContentState({
    contentType: 'subject',
    contentId: targetObj.subject?.id
  });

  const subjectHasSecretMessage = useMemo(
    () =>
      !!subjectState?.secretAnswer ||
      !!subjectState?.secretAttachment ||
      !!targetObj.subject?.secretAnswer ||
      !!targetObj.subject?.secretAttachment,
    [
      targetObj.subject?.secretAnswer,
      targetObj.subject?.secretAttachment,
      subjectState?.secretAnswer,
      subjectState?.secretAttachment
    ]
  );

  useEffect(() => {
    const subjectId = targetObj.subject?.id;
    if (
      userId &&
      subjectHasSecretMessage &&
      subjectId &&
      subjectState?.prevSecretViewerId !== userId
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
  }, [targetObj.subject?.id, subjectState?.prevSecretViewerId, userId]);

  const subjectId = useMemo(() => {
    if (contentType === 'subject') {
      return contentId;
    }
    return targetObj.subject?.id;
  }, [contentId, contentType, targetObj.subject?.id]);
  const subjectUploaderId = useMemo(() => {
    if (contentType === 'subject') {
      return uploader.id;
    }
    return targetObj.subject?.uploader?.id || targetObj.subject?.userId;
  }, [
    contentType,
    targetObj.subject?.uploader?.id,
    targetObj.subject?.userId,
    uploader.id
  ]);
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
  } = useContext<{ [key: string]: any }>(LocalContext);
  const [userListModalShown, setUserListModalShown] = useState(false);
  const [moderatorName, setModeratorName] = useState('');
  const [cannotChangeModalShown, setCannotChangeModalShown] = useState(false);
  const [deleteConfirmModalShown, setDeleteConfirmModalShown] = useState(false);
  const [closeConfirmModalShown, setCloseConfirmModalShown] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [recommendationInterfaceShown, setRecommendationInterfaceShown] =
    useState(false);
  const CommentInputAreaRef: React.RefObject<any> = useRef(null);
  const RewardInterfaceRef = useRef(null);

  const isRecommendedByUser = useMemo(() => {
    return (
      recommendations.filter(
        (recommendation: { userId: number }) => recommendation.userId === userId
      ).length > 0
    );
  }, [recommendations, userId]);

  const moderatorHasDisabledChangeLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return (
        <span>
          <b>{moderatorName}</b>님이 이 설정을 변경하지 못하도록 설정하였습니다
        </span>
      );
    }
    return (
      <span>
        <b>{moderatorName}</b> has disabled users from changing this setting for
        this post
      </span>
    );
  }, [moderatorName]);

  const secretHidden = useMemo(() => {
    const contentSecretHidden = !(secretShown || uploader.id === userId);
    const targetSubjectSecretHidden = !(
      subjectSecretShown || subjectUploaderId === userId
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
    subjectUploaderId,
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
      : targetObj.subject?.rewardLevel || rootRewardLevel || 0;
  }, [contentObj.byUser, rootObj.rewardLevel, rootType, targetObj.subject]);

  const disableReason = useMemo(() => {
    const isClosedBy = contentObj?.isClosedBy || rootObj?.isClosedBy;
    if (isClosedBy) {
      return `${
        isClosedBy.id === userId ? 'You' : isClosedBy.username
      } disabled comments for this ${
        contentObj?.isClosedBy ? contentType : rootType
      }`;
    }
    return undefined;
  }, [
    contentObj?.isClosedBy,
    contentType,
    rootObj?.isClosedBy,
    rootType,
    userId
  ]);

  useEffect(() => {
    if (!commentsLoaded && !(numPreviewComments > 0 && previewLoaded)) {
      loadInitialComments(numPreviewComments);
    }

    async function loadInitialComments(numPreviewComments: number) {
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
        userLevel: level,
        canReward,
        recommendations,
        uploader,
        userId
      }),
    [level, canReward, recommendations, uploader, userId]
  );

  useEffect(() => {
    onSetXpRewardInterfaceShown({
      contentType,
      contentId,
      shown: xpRewardInterfaceShown && userCanRewardThis
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return (
    <ErrorBoundary componentPath="ContentPanel/Body/index">
      <div
        className={css`
          width: 100%;
        `}
      >
        <MainContent
          contentId={contentId}
          contentType={contentType}
          contentObj={contentObj}
          secretHidden={secretHidden}
          theme={theme}
          userId={userId}
          onClickSecretAnswer={onSecretAnswerClick}
        />
        <BottomInterface
          userLevel={level}
          autoExpand={autoExpand}
          canDelete={!!canDelete}
          canEdit={!!canEdit}
          canReward={!!canReward}
          commentsShown={commentsShown}
          CommentInputAreaRef={CommentInputAreaRef}
          contentObj={contentObj}
          finalRewardLevel={finalRewardLevel}
          isEditing={isEditing}
          isRecommendedByUser={isRecommendedByUser}
          onByUserStatusChange={onByUserStatusChange}
          onExpandComments={handleExpandComments}
          onSetCloseConfirmModalShown={setCloseConfirmModalShown}
          onSetDeleteConfirmModalShown={setDeleteConfirmModalShown}
          onSetIsEditing={onSetIsEditing}
          onSetRewardLevel={onSetRewardLevel}
          onSetRecommendationInterfaceShown={setRecommendationInterfaceShown}
          onSetUserListModalShown={setUserListModalShown}
          onSetXpRewardInterfaceShown={onSetXpRewardInterfaceShown}
          recommendationInterfaceShown={recommendationInterfaceShown}
          rewardColor={rewardColor}
          secretHidden={secretHidden}
          subjectUploaderId={subjectUploaderId}
          theme={theme}
          userCanRewardThis={userCanRewardThis}
          userId={userId}
          xpRewardInterfaceShown={xpRewardInterfaceShown}
        />
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
            rootType={rootType}
            onHide={() => setRecommendationInterfaceShown(false)}
            recommendations={recommendations}
            rewardLevel={finalRewardLevel}
            content={contentObj?.content}
            theme={theme}
            uploaderId={uploader.id}
          />
        )}
        {xpRewardInterfaceShown && contentType !== 'aiStory' && (
          <XPRewardInterface
            innerRef={RewardInterfaceRef}
            contentType={contentType}
            contentId={contentId}
            onReward={() =>
              setRecommendationInterfaceShown(
                !isRecommendedByUser && twinkleCoins > 0
              )
            }
            rewardLevel={finalRewardLevel}
            uploaderLevel={uploader.level}
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
            disableReason={disableReason}
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
      {deleteConfirmModalShown && (
        <ConfirmModal
          onConfirm={handleDeleteThisContent}
          onHide={() => setDeleteConfirmModalShown(false)}
          title={`Remove ${
            contentType.charAt(0).toUpperCase() + contentType.slice(1)
          }`}
        />
      )}
      {closeConfirmModalShown && (
        <ConfirmModal
          onConfirm={handleCloseThisContent}
          onHide={() => setCloseConfirmModalShown(false)}
          title={`${disableReason ? 'Reopen' : 'Close'} ${
            contentType.charAt(0).toUpperCase() + contentType.slice(1)
          }`}
          description={`Are you sure you want to ${
            disableReason ? 'reopen' : 'close'
          } the comment section of this ${contentType}?`}
          descriptionFontSize="1.7rem"
        />
      )}
      {cannotChangeModalShown && (
        <AlertModal
          title={settingCannotBeChangedLabel}
          content={moderatorHasDisabledChangeLabel}
          onHide={() => setCannotChangeModalShown(false)}
        />
      )}
    </ErrorBoundary>
  );

  async function handleCommentSubmit(params: object) {
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

  function onSecretAnswerClick() {
    CommentInputAreaRef.current?.focus?.();
  }

  async function handleCloseThisContent() {
    const {
      isClosedBy,
      cannotChange,
      moderatorName: modName
    } = await closeContent({
      contentType,
      contentId: id
    });
    if (cannotChange) {
      setModeratorName(modName);
      return setCannotChangeModalShown(true);
    }
    onCloseContent({
      contentType,
      contentId: id,
      userId: isClosedBy
    });
    setCloseConfirmModalShown(false);
  }

  async function handleDeleteThisContent() {
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
}
