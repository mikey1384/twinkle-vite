import React, { useEffect, useMemo, useRef, useState } from 'react';
import Button from '~/components/Button';
import Embedly from '~/components/Embedly';
import Comments from '~/components/Comments';
import Subjects from '~/components/Subjects';
import StarButton from '~/components/Buttons/StarButton';
import LikeButton from '~/components/Buttons/LikeButton';
import RewardButton from '~/components/Buttons/RewardButton';
import Likers from '~/components/Likers';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import UserListModal from '~/components/Modals/UserListModal';
import RewardStatus from '~/components/RewardStatus';
import RecommendationInterface from '~/components/RecommendationInterface';
import RecommendationStatus from '~/components/RecommendationStatus';
import XPRewardInterface from '~/components/XPRewardInterface';
import Icon from '~/components/Icon';
import InvalidPage from '~/components/InvalidPage';
import Loading from '~/components/Loading';
import Description from './Description';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import {
  determineUserCanRewardThis,
  determineXpButtonDisabled
} from '~/helpers';
import { useContentState, useMyLevel } from '~/helpers/hooks';
import { processedURL } from '~/helpers/stringHelpers';
import {
  useAppContext,
  useContentContext,
  useViewContext,
  useExploreContext,
  useKeyContext
} from '~/contexts';
import { useLocation, useParams } from 'react-router-dom';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';

export default function LinkPage() {
  const location = useLocation();
  const { linkId: initialLinkId } = useParams();
  const linkId = Number(initialLinkId);
  const deleteContent = useAppContext((v) => v.requestHelpers.deleteContent);
  const editContent = useAppContext((v) => v.requestHelpers.editContent);
  const loadComments = useAppContext((v) => v.requestHelpers.loadComments);
  const loadContent = useAppContext((v) => v.requestHelpers.loadContent);
  const loadSubjects = useAppContext((v) => v.requestHelpers.loadSubjects);

  const level = useKeyContext((v) => v.myState.level);
  const twinkleCoins = useKeyContext((v) => v.myState.twinkleCoins);
  const userId = useKeyContext((v) => v.myState.userId);
  const { canDelete, canEdit, canReward } = useMyLevel();
  const {
    byUserIndicator: {
      color: byUserIndicatorColor,
      opacity: byUserIndicatorOpacity
    },
    byUserIndicatorText: {
      color: byUserIndicatorTextColor,
      shadow: byUserIndicatorTextShadowColor
    },
    reward: { color: rewardColor }
  } = useKeyContext((v) => v.theme);
  const onEditLinkPage = useExploreContext((v) => v.actions.onEditLinkPage);
  const onLikeLink = useExploreContext((v) => v.actions.onLikeLink);
  const onUpdateNumLinkComments = useExploreContext(
    (v) => v.actions.onUpdateNumLinkComments
  );
  const onDeleteComment = useContentContext((v) => v.actions.onDeleteComment);
  const onDeleteContent = useContentContext((v) => v.actions.onDeleteContent);
  const onEditComment = useContentContext((v) => v.actions.onEditComment);
  const onEditContent = useContentContext((v) => v.actions.onEditContent);
  const onEditRewardComment = useContentContext(
    (v) => v.actions.onEditRewardComment
  );
  const onEditSubject = useContentContext((v) => v.actions.onEditSubject);
  const onInitContent = useContentContext((v) => v.actions.onInitContent);
  const onLikeComment = useContentContext((v) => v.actions.onLikeComment);
  const onLikeContent = useContentContext((v) => v.actions.onLikeContent);
  const onLoadComments = useContentContext((v) => v.actions.onLoadComments);
  const onLoadMoreComments = useContentContext(
    (v) => v.actions.onLoadMoreComments
  );
  const onLoadMoreReplies = useContentContext(
    (v) => v.actions.onLoadMoreReplies
  );
  const onLoadMoreSubjectComments = useContentContext(
    (v) => v.actions.onLoadMoreSubjectComments
  );
  const onLoadMoreSubjectReplies = useContentContext(
    (v) => v.actions.onLoadMoreSubjectReplies
  );
  const onLoadMoreSubjects = useContentContext(
    (v) => v.actions.onLoadMoreSubjects
  );
  const onLoadRepliesOfReply = useContentContext(
    (v) => v.actions.onLoadRepliesOfReply
  );
  const onLoadSubjectRepliesOfReply = useContentContext(
    (v) => v.actions.onLoadSubjectRepliesOfReply
  );
  const onLoadSubjects = useContentContext((v) => v.actions.onLoadSubjects);
  const onLoadSubjectComments = useContentContext(
    (v) => v.actions.onLoadSubjectComments
  );
  const onSetByUserStatus = useContentContext(
    (v) => v.actions.onSetByUserStatus
  );
  const onSetXpRewardInterfaceShown = useContentContext(
    (v) => v.actions.onSetXpRewardInterfaceShown
  );
  const onSetPageTitle = useViewContext((v) => v.actions.onSetPageTitle);
  const onSetRewardLevel = useContentContext((v) => v.actions.onSetRewardLevel);
  const onUploadComment = useContentContext((v) => v.actions.onUploadComment);
  const onUploadReply = useContentContext((v) => v.actions.onUploadReply);
  const onUploadSubject = useContentContext((v) => v.actions.onUploadSubject);

  const {
    byUser,
    comments,
    commentsLoaded,
    commentsLoadMoreButton,
    content,
    isDeleted,
    description,
    likes,
    loaded,
    pinnedCommentId,
    recommendations,
    subjects,
    subjectsLoaded,
    subjectsLoadMoreButton,
    rewards,
    timeStamp,
    title,
    uploader,
    xpRewardInterfaceShown
  } = useContentState({ contentType: 'url', contentId: linkId });

  useEffect(() => {
    if (title) {
      onSetPageTitle(title);
    }
    return () => onSetPageTitle('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  const [loadingComments, setLoadingComments] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [confirmModalShown, setConfirmModalShown] = useState(false);
  const [likesModalShown, setLikesModalShown] = useState(false);
  const [recommendationInterfaceShown, setRecommendationInterfaceShown] =
    useState(false);
  const RewardInterfaceRef = useRef(null);

  useEffect(() => {
    if (!loaded) {
      handleLoadLinkPage();
    }
    if (!commentsLoaded) {
      handleLoadComments();
    }
    if (!subjectsLoaded) {
      handleLoadSubjects();
    }
    async function handleLoadLinkPage() {
      const data = await loadContent({
        contentId: linkId,
        contentType: 'url'
      });
      if (data.notFound) return setNotFound(true);
      onInitContent({
        ...data,
        contentId: linkId,
        contentType: 'url'
      });
    }
    async function handleLoadComments() {
      setLoadingComments(true);
      const { comments: loadedComments, loadMoreButton } = await loadComments({
        contentType: 'url',
        contentId: linkId
      });
      onLoadComments({
        comments: loadedComments,
        contentId: linkId,
        contentType: 'url',
        loadMoreButton
      });
      setLoadingComments(false);
    }
    async function handleLoadSubjects() {
      const { results, loadMoreButton } = await loadSubjects({
        contentType: 'url',
        contentId: linkId
      });
      onLoadSubjects({
        contentId: linkId,
        contentType: 'url',
        subjects: results,
        loadMoreButton
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

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

  const userIsUploader = useMemo(
    () => uploader?.id === userId,
    [uploader?.id, userId]
  );

  const userCanEditThis = useMemo(() => {
    return (canEdit || canDelete) && level > uploader?.level;
  }, [level, canDelete, canEdit, uploader?.level]);
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
        rewardLevel: byUser ? 5 : 0,
        myId: userId,
        xpRewardInterfaceShown,
        rewards
      }),
    [byUser, rewards, userId, xpRewardInterfaceShown]
  );

  useEffect(() => {
    onSetXpRewardInterfaceShown({
      contentType: 'url',
      contentId: linkId,
      shown: xpRewardInterfaceShown && userCanRewardThis
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const madeByLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return <>{uploader?.username}님이 직접 제작한 콘텐츠입니다</>;
    }
    return <>This was made by {uploader?.username}</>;
  }, [uploader?.username]);

  return loaded && !isDeleted ? (
    <div
      className={css`
        margin-top: 1rem;
        @media (max-width: ${mobileMaxWidth}) {
          margin-top: 0;
        }
      `}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        fontSize: '1.7rem',
        paddingBottom: '10rem'
      }}
    >
      <div
        className={css`
          width: 60%;
          background-color: #fff;
          border: 1px solid ${Color.borderGray()};
          padding-bottom: 1rem;
          @media (max-width: ${mobileMaxWidth}) {
            border-top: 0;
            border-left: 0;
            border-right: 0;
            width: 100%;
          }
        `}
      >
        <Description
          key={'description' + linkId}
          uploader={uploader}
          timeStamp={timeStamp}
          title={title}
          url={content}
          userCanEditThis={userCanEditThis}
          description={description}
          linkId={linkId}
          onDelete={() => setConfirmModalShown(true)}
          onEditDone={handleEditLinkPage}
          userIsUploader={userIsUploader}
        />
        {!!byUser && (
          <div
            style={{
              padding: '0.7rem',
              background: Color[byUserIndicatorColor](byUserIndicatorOpacity),
              color: Color[byUserIndicatorTextColor](),
              textShadow: byUserIndicatorTextShadowColor
                ? `0 0 1px ${Color[byUserIndicatorTextShadowColor]()}`
                : 'none',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontWeight: 'bold',
              fontSize: '1.7rem',
              marginTop: '2rem',
              marginBottom: '1rem'
            }}
            className={css`
              margin-left: -1px;
              margin-right: -1px;
              @media (max-width: ${mobileMaxWidth}) {
                margin-left: 0;
                margin-right: 0;
              }
            `}
          >
            {madeByLabel}
          </div>
        )}
        <Embedly
          key={'link' + linkId}
          style={{ marginTop: '2rem' }}
          contentId={linkId}
          loadingHeight="30rem"
        />
        <div
          style={{
            position: 'relative',
            paddingTop: '1.5rem',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <LikeButton
                key={'like' + linkId}
                filled
                style={{ fontSize: '2rem' }}
                contentType="url"
                contentId={linkId}
                onClick={handleLikeLink}
                likes={likes}
              />
              {userCanRewardThis && (
                <RewardButton
                  contentId={linkId}
                  contentType="url"
                  disableReason={xpButtonDisabled}
                  style={{
                    fontSize: '2rem',
                    marginLeft: '1rem'
                  }}
                />
              )}
              <div style={{ position: 'relative' }}>
                <StarButton
                  style={{
                    fontSize: '2rem',
                    marginLeft: '1rem'
                  }}
                  byUser={!!byUser}
                  contentId={linkId}
                  onToggleByUser={handleSetByUserStatus}
                  contentType="url"
                  uploader={uploader}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Likers
                key={'likes' + linkId}
                style={{ marginTop: '0.5rem', fontSize: '1.5rem' }}
                likes={likes}
                userId={userId}
                onLinkClick={() => setLikesModalShown(true)}
              />
            </div>
          </div>
          <Button
            style={{ right: '1rem', bottom: '0.5rem', position: 'absolute' }}
            color={rewardColor}
            skeuomorphic
            filled={isRecommendedByUser}
            disabled={recommendationInterfaceShown}
            onClick={() => setRecommendationInterfaceShown(true)}
          >
            <Icon icon="heart" />
          </Button>
        </div>
        {recommendationInterfaceShown && (
          <RecommendationInterface
            style={{
              marginTop: likes.length > 0 ? '0.5rem' : '1rem',
              marginBottom: 0
            }}
            contentId={linkId}
            contentType="url"
            onHide={() => setRecommendationInterfaceShown(false)}
            recommendations={recommendations}
            rewardLevel={byUser ? 5 : 0}
            content={description}
            uploaderId={uploader?.id}
          />
        )}
        {xpRewardInterfaceShown && (
          <div style={{ padding: '0 1rem' }}>
            <XPRewardInterface
              innerRef={RewardInterfaceRef}
              rewards={rewards}
              rewardLevel={byUser ? 5 : 0}
              contentType="url"
              contentId={linkId}
              noPadding
              onReward={() =>
                setRecommendationInterfaceShown(
                  !isRecommendedByUser && twinkleCoins > 0
                )
              }
              uploaderLevel={uploader?.level}
              uploaderId={uploader.id}
            />
          </div>
        )}
        <RecommendationStatus
          style={{
            marginTop: likes.length > 0 ? '0.5rem' : '1rem',
            marginBottom: recommendationInterfaceShown ? '1rem' : 0
          }}
          contentType="url"
          recommendations={recommendations}
        />
        <RewardStatus
          contentType="url"
          contentId={linkId}
          rewardLevel={byUser ? 5 : 0}
          onCommentEdit={onEditRewardComment}
          className={css`
            margin-top: 1rem;
            font-size: 1.4rem;
            margin-right: -1px;
            margin-left: -1px;
            @media (max-width: ${mobileMaxWidth}) {
              margin-left: 0;
              margin-right: 0;
            }
          `}
          rewards={rewards}
        />
      </div>
      <Subjects
        className={css`
          width: 60%;
          @media (max-width: ${mobileMaxWidth}) {
            width: 100%;
          }
        `}
        contentId={linkId}
        contentType="url"
        loadMoreButton={subjectsLoadMoreButton}
        subjects={subjects}
        onLoadMoreSubjects={onLoadMoreSubjects}
        onLoadSubjectComments={onLoadSubjectComments}
        onSubjectEditDone={onEditSubject}
        onSubjectDelete={(subjectId: number) =>
          onDeleteContent({ contentType: 'subject', contentId: subjectId })
        }
        onSetRewardLevel={onSetRewardLevel}
        uploadSubject={onUploadSubject}
        commentActions={{
          editRewardComment: onEditRewardComment,
          onDelete: handleDeleteComment,
          onEditDone: onEditComment,
          onLikeClick: onLikeComment,
          onLoadMoreComments: onLoadMoreSubjectComments,
          onLoadMoreReplies: onLoadMoreSubjectReplies,
          onLoadRepliesOfReply: onLoadSubjectRepliesOfReply,
          onUploadComment: handleUploadComment,
          onUploadReply: handleUploadReply
        }}
      />
      <Comments
        autoExpand
        comments={comments}
        isLoading={loadingComments}
        inputTypeLabel="comment"
        key={'comments' + linkId}
        loadMoreButton={commentsLoadMoreButton}
        onCommentSubmit={handleUploadComment}
        onDelete={handleDeleteComment}
        onEditDone={onEditComment}
        onLikeClick={onLikeComment}
        onLoadMoreComments={onLoadMoreComments}
        onLoadMoreReplies={onLoadMoreReplies}
        onLoadRepliesOfReply={onLoadRepliesOfReply}
        onReplySubmit={handleUploadReply}
        onRewardCommentEdit={onEditRewardComment}
        parent={{
          contentType: 'url',
          contentId: linkId,
          uploader,
          pinnedCommentId
        }}
        className={css`
          border: 1px solid ${Color.borderGray()};
          padding: 1rem;
          width: 60%;
          background: #fff;
          @media (max-width: ${mobileMaxWidth}) {
            border-left: 0;
            border-right: 0;
            width: 100%;
          }
        `}
        userId={userId}
      />
      {confirmModalShown && (
        <ConfirmModal
          key={'confirm' + linkId}
          title="Remove Link"
          onConfirm={handleDeleteLink}
          onHide={() => setConfirmModalShown(false)}
        />
      )}
      {likesModalShown && (
        <UserListModal
          key={'userlist' + linkId}
          users={likes}
          title="People who liked this"
          onHide={() => setLikesModalShown(false)}
        />
      )}
    </div>
  ) : notFound || isDeleted ? (
    <InvalidPage />
  ) : (
    <Loading style={{ height: '50vh' }} text="Loading Page..." />
  );

  async function handleDeleteLink() {
    await deleteContent({ id: linkId, contentType: 'url' });
    onDeleteContent({ contentId: linkId, contentType: 'url' });
    setConfirmModalShown(false);
  }

  function handleDeleteComment(data: any) {
    onDeleteComment(data);
    onUpdateNumLinkComments({
      id: linkId,
      updateType: 'decrease'
    });
  }

  async function handleEditLinkPage(params: any) {
    const data = await editContent(params);
    const { contentId, editedTitle: title, editedUrl: content } = params;
    onEditContent({
      data: {
        content: processedURL(content),
        title,
        description: data.description
      },
      contentType: 'url',
      contentId
    });
    onEditLinkPage({
      id: linkId,
      title,
      content: processedURL(content)
    });
  }

  function handleLikeLink({
    likes,
    isUnlike
  }: {
    likes: any[];
    isUnlike: boolean;
  }) {
    onLikeContent({ likes, contentType: 'url', contentId: linkId });
    onLikeLink({ likes, id: linkId });
    if (!xpButtonDisabled && userCanRewardThis && !isRewardedByUser) {
      onSetXpRewardInterfaceShown({
        contentId: linkId,
        contentType: 'url',
        shown: !isUnlike
      });
    } else {
      if (!isRecommendedByUser && !canReward) {
        setRecommendationInterfaceShown(!isUnlike);
      }
    }
  }

  function handleSetByUserStatus(byUser: boolean) {
    onSetByUserStatus({ contentId: linkId, contentType: 'url', byUser });
  }

  function handleUploadComment(params: any) {
    onUploadComment(params);
    onUpdateNumLinkComments({
      id: linkId,
      updateType: 'increase'
    });
  }

  function handleUploadReply(data: any) {
    onUploadReply(data);
    onUpdateNumLinkComments({
      id: linkId,
      updateType: 'increase'
    });
  }
}
