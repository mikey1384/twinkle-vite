import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
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
import {
  determineUserCanRewardThis,
  determineXpButtonDisabled
} from '~/helpers';
import { useContentState, useMyLevel } from '~/helpers/hooks';
import {
  useAppContext,
  useContentContext,
  useHomeContext,
  useKeyContext
} from '~/contexts';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import BottomInterface from './BottomInterface';
import {
  centerHomeFeedActionIntentTarget,
  focusHomeFeedCommentIntentTarget,
  type HomeFeedActionIntent
} from '~/helpers/homeFeedActionIntent';
import {
  contentPanelNoRewardContentTypes,
  isContentPanelCommentActionEnabled,
  isContentPanelRecommendActionEnabled,
  isContentPanelRewardActionEnabled
} from '~/helpers/contentActionAvailability';
import { resolveContentRewardLevel } from '~/helpers/rewardLevel';
import { hasSubjectSecretSignal } from '~/helpers/subjectSecretHelpers';

const settingCannotBeChangedLabel = 'This setting cannot be changed';

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
  homeFeedActionIntent,
  inputAtBottom,
  numPreviewComments = 0,
  onConsumeHomeFeedActionIntent,
  onChangeSpoilerStatus,
  theme
}: {
  autoExpand?: boolean;
  commentsShown?: boolean;
  contentObj: any;
  homeFeedActionIntent?: HomeFeedActionIntent | null;
  inputAtBottom?: boolean;
  numPreviewComments?: number;
  onConsumeHomeFeedActionIntent?: () => void;
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

  const level = useKeyContext((v) => v.myState.level);
  const twinkleCoins = useKeyContext((v) => v.myState.twinkleCoins);
  const userId = useKeyContext((v) => v.myState.userId);
  const checkUserChange = useKeyContext((v) => v.helpers.checkUserChange);
  const { canDelete, canEdit, canReward } = useMyLevel();

  const { colorKey: rewardColor } = useRoleColor('reward', {
    themeName: theme,
    fallback: 'pink'
  });

  const onInitContent = useContentContext((v) => v.actions.onInitContent);
  const onSetIsEditing = useContentContext((v) => v.actions.onSetIsEditing);
  const onCloseContent = useContentContext((v) => v.actions.onCloseContent);
  const onSetXpRewardInterfaceShown = useContentContext(
    (v) => v.actions.onSetXpRewardInterfaceShown
  );
  const onDeleteHomeFeedComment = useHomeContext(
    (v) => v.actions.onDeleteComment
  );

  const {
    hasSecretAnswer,
    hasSecretAttachment,
    isEditing,
    secretAnswer,
    secretAttachment,
    secretShown,
    xpRewardInterfaceShown
  } = useContentState({
    contentType,
    contentId
  });

  // Normalize pass types for content state lookup
  const normalizedRootType =
    rootType === 'missionPass' || rootType === 'achievementPass'
      ? 'pass'
      : rootType;
  const rootObj = useContentState({
    contentType: normalizedRootType,
    contentId: rootId
  });

  const subjectState = useContentState({
    contentType: 'subject',
    contentId: targetObj.subject?.id
  });

  const targetSubjectHasSecretMessage = hasSubjectSecretSignal(
    targetObj.subject
  );
  const subjectHasSecretMessage =
    hasSubjectSecretSignal(subjectState) || targetSubjectHasSecretMessage;
  const rootObjHasSecretMessage = hasSubjectSecretSignal(rootObj);

  const contentHasSecretMessage = useMemo(
    () =>
      hasSubjectSecretSignal({
        hasSecretAnswer,
        hasSecretAttachment,
        secretAnswer,
        secretAttachment
      }),
    [hasSecretAnswer, hasSecretAttachment, secretAnswer, secretAttachment]
  );

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
    contentType: normalizedRootType
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

  const CommentInputAreaRef = useRef<any>(null);
  const RewardInterfaceRef = useRef(null);
  const RecommendationInterfaceRef = useRef<HTMLDivElement | null>(null);
  const consumedHomeFeedActionIntentRef = useRef<string | null>(null);
  const rootLoadKeyRef = useRef('');

  const mountedRef = useRef(true);
  useEffect(() => {
    return function cleanup() {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const requestUserId = userId;
    const rootLoadKey = `${normalizedRootType || ''}-${rootId || 0}-${
      requestUserId || 0
    }`;
    if (
      rootId &&
      normalizedRootType &&
      !rootObj?.loaded &&
      rootLoadKeyRef.current !== rootLoadKey
    ) {
      rootLoadKeyRef.current = rootLoadKey;
      initRoot(rootLoadKey, requestUserId);
    }
    async function initRoot(rootLoadKey: string, requestUserId: number) {
      try {
        const data = await loadContent({
          contentId: rootId,
          contentType: normalizedRootType
        });
        if (
          !mountedRef.current ||
          checkUserChange(requestUserId) ||
          rootLoadKeyRef.current !== rootLoadKey
        ) {
          return;
        }
        onInitContent(data);
      } finally {
        if (rootLoadKeyRef.current === rootLoadKey) {
          rootLoadKeyRef.current = '';
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootId, normalizedRootType, rootObj?.loaded, userId]);

  useEffect(() => {
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
      if (!mountedRef.current) return;
      onChangeSpoilerStatus({
        shown: responded,
        subjectId,
        prevSecretViewerId: userId
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    subjectHasSecretMessage,
    subjectId,
    subjectState?.prevSecretViewerId,
    userId
  ]);

  useEffect(() => {
    if (!commentsLoaded && !(numPreviewComments > 0 && previewLoaded)) {
      loadInitialComments(numPreviewComments);
    }

    async function loadInitialComments(numComments: number) {
      if (!numComments) {
        setLoadingComments(true);
      }
      const isPreview = !!numComments;
      const data = await loadComments({
        contentType,
        contentId,
        limit: numComments || commentsLoadLimit,
        isPreview
      });
      if (!mountedRef.current) return;
      onLoadComments({
        ...data,
        contentId,
        contentType,
        isPreview
      });
      setLoadingComments(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commentsLoaded, previewLoaded]);

  const secretHidden = useMemo(() => {
    const contentSecretHidden = !(secretShown || uploader.id === userId);
    const targetSubjectSecretHidden = !(
      subjectSecretShown || subjectUploaderId === userId
    );
    const rootObjSecretHidden = !(
      rootSecretShown || rootObj?.uploader?.id === userId
    );
    return contentType === 'subject' && contentHasSecretMessage
      ? contentSecretHidden
      : targetSubjectHasSecretMessage
        ? targetSubjectSecretHidden
        : rootObjHasSecretMessage && rootObjSecretHidden;
  }, [
    contentHasSecretMessage,
    contentType,
    rootObjHasSecretMessage,
    rootObj?.uploader?.id,
    rootSecretShown,
    secretShown,
    subjectSecretShown,
    targetSubjectHasSecretMessage,
    subjectUploaderId,
    uploader.id,
    userId
  ]);

  const finalRewardLevel = resolveContentRewardLevel({
    content: contentObj,
    rootObj,
    subject: targetObj.subject
  });

  const rewardContext = useMemo(() => {
    if (
      contentObj.byUser ||
      (contentType !== 'video' && contentType !== 'url')
    ) {
      return {};
    }
    if (targetObj.subject?.id && Number(targetObj.subject?.rewardLevel) > 0) {
      return {
        rewardContextType: 'subject',
        rewardContextId: targetObj.subject.id
      };
    }
    if (
      rootId &&
      (rootType === 'subject' || rootType === 'video' || rootType === 'url') &&
      finalRewardLevel > 0
    ) {
      return {
        rewardContextType: rootType,
        rewardContextId: rootId
      };
    }
    return {};
  }, [
    contentObj.byUser,
    contentType,
    finalRewardLevel,
    rootId,
    rootType,
    targetObj.subject?.id,
    targetObj.subject?.rewardLevel
  ]);

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

  const xpButtonDisabled = useMemo(
    () =>
      determineXpButtonDisabled({
        rewardLevel: finalRewardLevel,
        rewards,
        myId: userId,
        xpRewardInterfaceShown
      }),
    [finalRewardLevel, rewards, userId, xpRewardInterfaceShown]
  );

  useEffect(() => {
    onSetXpRewardInterfaceShown({
      contentType,
      contentId,
      shown: xpRewardInterfaceShown && userCanRewardThis
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const isRecommendedByUser = useMemo(() => {
    return (
      recommendations.filter(
        (recommendation: any) => recommendation.userId === userId
      ).length > 0
    );
  }, [recommendations, userId]);

  useEffect(() => {
    const intent = homeFeedActionIntent;
    if (!intent) return;
    if (consumedHomeFeedActionIntentRef.current === intent.nonce) return;

    const rootStatePending = Boolean(
      rootId && normalizedRootType && !rootObj?.loaded && !rootObj?.notFound
    );
    const secretStatePending = Boolean(
      userId &&
      subjectHasSecretMessage &&
      subjectId &&
      subjectState?.prevSecretViewerId !== userId
    );
    if (rootStatePending || secretStatePending) return;

    consumedHomeFeedActionIntentRef.current = intent.nonce;

    if (intent.action === 'comment') {
      if (
        isContentPanelCommentActionEnabled({
          contentType,
          secretHidden
        })
      ) {
        void openCommentsFromHomeFeedIntent();
      }
    }

    if (intent.action === 'reward') {
      if (
        isContentPanelRewardActionEnabled({
          contentType,
          secretHidden,
          userCanRewardThis,
          xpButtonDisabled
        })
      ) {
        onSetXpRewardInterfaceShown({
          contentId,
          contentType,
          shown: true
        });
        centerHomeFeedActionIntentTarget(RewardInterfaceRef);
      }
    }

    if (intent.action === 'recommend') {
      if (
        isContentPanelRecommendActionEnabled({
          contentType,
          secretHidden
        })
      ) {
        setRecommendationInterfaceShown(true);
        centerHomeFeedActionIntentTarget(RecommendationInterfaceRef);
      }
    }

    onConsumeHomeFeedActionIntent?.();
    // onSetXpRewardInterfaceShown/onConsumeHomeFeedActionIntent are stable helpers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    autoExpand,
    commentsShown,
    contentId,
    contentType,
    homeFeedActionIntent?.action,
    homeFeedActionIntent?.nonce,
    normalizedRootType,
    rootId,
    rootObj?.loaded,
    rootObj?.notFound,
    secretHidden,
    subjectHasSecretMessage,
    subjectId,
    subjectState?.prevSecretViewerId,
    userCanRewardThis,
    userId,
    xpButtonDisabled
  ]);

  const moderatorHasDisabledChangeLabel = useMemo(() => {
    return (
      <span>
        <b>{moderatorName}</b> has disabled users from changing this setting for
        this post
      </span>
    );
  }, [moderatorName]);

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

        <>
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
            <div ref={RecommendationInterfaceRef}>
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
            </div>
          )}

          {xpRewardInterfaceShown &&
            !contentPanelNoRewardContentTypes.has(contentType) && (
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
                rewardContextType={rewardContext.rewardContextType}
                rewardContextId={rewardContext.rewardContextId}
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
              alwaysShowInput={!autoExpand}
              autoExpand={
                (autoExpand && !secretHidden) ||
                (contentType === 'subject' && secretHidden)
              }
              comments={comments}
              commentsLoadLimit={commentsLoadLimit}
              commentsShown={commentsShown && !secretHidden}
              numInputRows={!commentsShown && !autoExpand ? 1 : undefined}
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
              onPreviewClick={handleExpandComments}
              onLoadMoreComments={onLoadMoreComments}
              onLoadMoreReplies={onLoadMoreReplies}
              onLoadRepliesOfReply={onLoadRepliesOfReply}
              onReplySubmit={onReplySubmit}
              onRewardCommentEdit={onEditRewardComment}
              parent={contentObj}
              rootContent={rootObj}
              showSecretButtonAvailable={
                contentType === 'subject' && secretHidden
              }
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
        </>
      </div>

      {deleteConfirmModalShown && (
        <ConfirmModal
          onConfirm={() => {
            setDeleteConfirmModalShown(false);
            handleDeleteThisContent();
          }}
          onHide={() => setDeleteConfirmModalShown(false)}
          title={`Remove ${
            contentType.charAt(0).toUpperCase() + contentType.slice(1)
          }`}
        />
      )}

      {closeConfirmModalShown && (
        <ConfirmModal
          onConfirm={() => {
            setCloseConfirmModalShown(false);
            handleCloseThisContent();
          }}
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
      contentHasSecretMessage &&
      !secretShown
    ) {
      await refreshSubjectAfterSecretUnlock();
      await handleExpandComments();
      if (!mountedRef.current) return;
      onChangeSpoilerStatus({
        shown: true,
        subjectId,
        prevSecretViewerId: userId
      });
    } else {
      onCommentSubmit(params);
    }
  }

  async function refreshSubjectAfterSecretUnlock() {
    if (!subjectId) return;
    const requestUserId = userId;
    const data = await loadContent({
      contentId: subjectId,
      contentType: 'subject'
    });
    if (!mountedRef.current || !data || checkUserChange(requestUserId)) return;
    onInitContent(data);
  }

  function onSecretAnswerClick() {
    CommentInputAreaRef.current?.focus?.();
  }

  async function handleCloseThisContent() {
    const {
      isClosedBy,
      cannotChange,
      moderatorName: modName
    } = await closeContent({ contentType, contentId: id });

    if (!mountedRef.current) return;

    if (cannotChange) {
      setModeratorName(modName);
      setCannotChangeModalShown(true);
    } else {
      onCloseContent({
        contentType,
        contentId: id,
        userId: isClosedBy
      });
    }
  }

  async function handleDeleteThisContent() {
    await deleteContent({ contentType, id });
    if (!mountedRef.current) return;

    if (contentType === 'comment') {
      onDeleteComment(id);
      onDeleteHomeFeedComment(id);
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
    if (!mountedRef.current) return;
    onLoadComments({ ...data, contentId, contentType });
    onSetCommentsShown({ contentId, contentType });
    setLoadingComments(false);
  }

  async function openCommentsFromHomeFeedIntent() {
    if (!commentsShown && !(autoExpand && !secretHidden)) {
      await handleExpandComments();
    }
    if (!mountedRef.current) return;

    focusHomeFeedCommentIntentTarget(CommentInputAreaRef);
  }
}
