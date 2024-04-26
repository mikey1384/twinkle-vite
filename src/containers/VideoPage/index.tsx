import React, { useEffect, useMemo, useRef, useState } from 'react';
import InvalidPage from '~/components/InvalidPage';
import Comments from '~/components/Comments';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import request from 'axios';
import queryString from 'query-string';
import ErrorBoundary from '~/components/ErrorBoundary';
import Subjects from '~/components/Subjects';
import RewardStatus from '~/components/RewardStatus';
import Loading from '~/components/Loading';
import Details from './Details';
import NavMenu from './NavMenu';
import URL from '~/constants/URL';
import Content from './Content';
import { Routes, Route, useLocation, useParams } from 'react-router-dom';
import { Color, tabletMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { fetchedVideoCodeFromURL } from '~/helpers/stringHelpers';
import { useContentState } from '~/helpers/hooks';
import {
  useAppContext,
  useContentContext,
  useViewContext,
  useExploreContext,
  useKeyContext
} from '~/contexts';
import localize from '~/constants/localize';

const commentOnThisVideoLabel = localize('commentOnThisVideo');

export default function VideoPage() {
  const { search } = useLocation();
  const { videoId: initialVideoId } = useParams();
  const videoId = Number(initialVideoId);
  const [changingPage, setChangingPage] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [confirmModalShown, setConfirmModalShown] = useState(false);
  const [isNotFound, setIsNotFound] = useState(false);
  const CommentInputAreaRef = useRef(null);
  const isMounted = useRef(true);

  const deleteContent = useAppContext((v) => v.requestHelpers.deleteContent);
  const editContent = useAppContext((v) => v.requestHelpers.editContent);
  const fetchPlaylistsContaining = useAppContext(
    (v) => v.requestHelpers.fetchPlaylistsContaining
  );
  const loadComments = useAppContext((v) => v.requestHelpers.loadComments);
  const loadSubjects = useAppContext((v) => v.requestHelpers.loadSubjects);
  const { userId } = useKeyContext((v) => v.myState);
  const onChangeVideoByUserStatus = useExploreContext(
    (v) => v.actions.onChangeVideoByUserStatus
  );
  const onEditVideoThumbs = useExploreContext(
    (v) => v.actions.onEditVideoThumbs
  );
  const onSetThumbRewardLevel = useExploreContext(
    (v) => v.actions.onSetThumbRewardLevel
  );
  const onAddTags = useContentContext((v) => v.actions.onAddTags);
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
  const onLoadTags = useContentContext((v) => v.actions.onLoadTags);
  const onSetByUserStatus = useContentContext(
    (v) => v.actions.onSetByUserStatus
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
    rewardLevel,
    likes,
    loaded,
    notFound,
    pinnedCommentId,
    questions,
    recommendations,
    rewards,
    subjects,
    subjectsLoaded,
    subjectsLoadMoreButton,
    tags,
    timeStamp,
    title,
    uploader,
    views
  } = useContentState({ contentType: 'video', contentId: videoId });
  const isVideoUnavailable = useMemo(
    () => !!notFound || !!isNotFound || !!isDeleted,
    [isDeleted, isNotFound, notFound]
  );

  useEffect(() => {
    isMounted.current = true;
    return function cleanUp() {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (title) {
      onSetPageTitle(title);
    }
    return () => onSetPageTitle('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  useEffect(() => {
    setChangingPage(true);
    setIsNotFound(false);
    if (!loaded) {
      handleLoadVideoPage();
    }
    handleLoadTags();
    if (!commentsLoaded) {
      handleLoadComments();
    }
    if (!subjectsLoaded) {
      handleLoadSubjects();
    }
    setChangingPage(false);
    async function handleLoadVideoPage() {
      try {
        const { data } = await request.get(
          `${URL}/video/page?videoId=${videoId}`
        );
        if (data.notFound) {
          return setIsNotFound(true);
        }
        if (isMounted.current) {
          onInitContent({
            ...data,
            contentId: videoId,
            contentType: 'video'
          });
        }
      } catch (error: any) {
        console.error(error.response || error);
      }
    }
    async function handleLoadComments() {
      setLoadingComments(true);
      const { comments: loadedComments, loadMoreButton } = await loadComments({
        contentType: 'video',
        contentId: videoId
      });
      onLoadComments({
        comments: loadedComments,
        contentId: videoId,
        contentType: 'video',
        loadMoreButton
      });
      setLoadingComments(false);
    }
    async function handleLoadSubjects() {
      const { results, loadMoreButton } = await loadSubjects({
        contentType: 'video',
        contentId: videoId
      });
      onLoadSubjects({
        contentId: videoId,
        contentType: 'video',
        subjects: results,
        loadMoreButton
      });
    }
    async function handleLoadTags() {
      const tags = await fetchPlaylistsContaining({ videoId });
      onLoadTags({ tags, contentId: videoId, contentType: 'video' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);
  const { playlist: playlistId, continue: isContinuing } =
    queryString.parse(search);

  return (
    <ErrorBoundary
      componentPath="VideoPage/index"
      className={css`
        width: CALC(100% - 2rem);
        height: 100%;
        margin-top: 1rem;
        margin-bottom: 1rem;
        @media (max-width: ${tabletMaxWidth}) {
          margin-top: 0;
          width: 100%;
          flex-direction: column;
        }
      `}
    >
      {(!loaded || isVideoUnavailable) && (
        <div
          style={{
            width: '100%',
            position: 'absolute'
          }}
        >
          {isVideoUnavailable ? (
            <InvalidPage text="Video does not exist" />
          ) : (
            <Loading style={{ height: '50vh' }} text="Loading Video..." />
          )}
        </div>
      )}
      <div
        className={css`
          width: 100%;
          height: 100%;
          margin-left: 1rem;
          display: flex;
          justify-content: space-between;
          @media (max-width: ${tabletMaxWidth}) {
            flex-direction: column;
            width: 100%;
            margin: 0;
          }
        `}
      >
        {loaded && !isVideoUnavailable && (
          <div
            className={css`
              width: CALC(70% - 1rem);
              @media (max-width: ${tabletMaxWidth}) {
                width: 100%;
                border: 0;
              }
            `}
          >
            <Routes>
              <Route
                path="/*"
                element={
                  <Content
                    byUser={!!byUser}
                    content={content}
                    isContinuing={!!isContinuing}
                    questions={questions}
                    rewardLevel={rewardLevel}
                    title={title}
                    watchTabActive
                    uploader={uploader}
                    videoId={videoId}
                    playlistId={Number(playlistId)}
                  />
                }
              />
              <Route
                path="/questions"
                element={
                  <Content
                    byUser={!!byUser}
                    content={content}
                    isContinuing={!!isContinuing}
                    questions={questions}
                    rewardLevel={rewardLevel}
                    title={title}
                    uploader={uploader}
                    videoId={videoId}
                    playlistId={Number(playlistId)}
                  />
                }
              />
            </Routes>
            <div
              className={css`
                display: flex;
                flex-direction: column;
                background: #fff;
                margin-top: 1rem;
                border: 1px solid ${Color.borderGray()};
                width: 100%;
                @media (max-width: ${tabletMaxWidth}) {
                  border-left: 0;
                  border-right: 0;
                }
              `}
            >
              <Details
                addTags={onAddTags}
                byUser={!!byUser}
                changingPage={changingPage}
                rewardLevel={rewardLevel}
                likes={likes}
                content={content}
                description={description}
                changeByUserStatus={handleChangeByUserStatus}
                onEditFinish={handleEditVideoPage}
                onDelete={() => setConfirmModalShown(true)}
                onSetRewardLevel={handleSetRewardLevel}
                recommendations={recommendations}
                rewards={rewards}
                tags={tags}
                title={title}
                timeStamp={timeStamp}
                uploader={uploader}
                userId={userId}
                videoId={videoId}
                videoViews={views}
              />
              <RewardStatus
                contentType="video"
                contentId={videoId}
                rewardLevel={byUser ? 5 : 0}
                onCommentEdit={onEditRewardComment}
                style={{
                  fontSize: '1.4rem'
                }}
                rewards={rewards}
              />
            </div>
            <Subjects
              loadMoreButton={subjectsLoadMoreButton}
              subjects={subjects}
              onLoadMoreSubjects={onLoadMoreSubjects}
              onLoadSubjectComments={onLoadSubjectComments}
              onSubjectEditDone={onEditSubject}
              onSubjectDelete={(subjectId: number) =>
                onDeleteContent({
                  contentType: 'subject',
                  contentId: subjectId
                })
              }
              onSetRewardLevel={onSetRewardLevel}
              uploadSubject={onUploadSubject}
              contentId={videoId}
              contentType="video"
              rootRewardLevel={rewardLevel}
              commentActions={{
                editRewardComment: onEditRewardComment,
                onDelete: onDeleteComment,
                onEditDone: onEditComment,
                onLikeClick: onLikeComment,
                onLoadMoreComments: onLoadMoreSubjectComments,
                onLoadMoreReplies: onLoadMoreSubjectReplies,
                onLoadRepliesOfReply: onLoadSubjectRepliesOfReply,
                onUploadComment,
                onUploadReply
              }}
            />
            <div
              className={css`
                background: #fff;
                border: 1px solid ${Color.borderGray()};
                padding: 1rem;
                @media (max-width: ${tabletMaxWidth}) {
                  border-left: 0;
                  border-right: 0;
                }
              `}
            >
              <p
                style={{
                  fontWeight: 'bold',
                  fontSize: '2.5rem',
                  color: Color.darkerGray()
                }}
              >
                {commentOnThisVideoLabel}
              </p>
              <Comments
                autoExpand
                comments={comments}
                inputAreaInnerRef={CommentInputAreaRef}
                inputTypeLabel={'comment'}
                isLoading={loadingComments}
                loadMoreButton={commentsLoadMoreButton}
                onCommentSubmit={onUploadComment}
                onDelete={onDeleteComment}
                onEditDone={onEditComment}
                onLikeClick={onLikeComment}
                onLoadMoreComments={onLoadMoreComments}
                onLoadMoreReplies={onLoadMoreReplies}
                onLoadRepliesOfReply={onLoadRepliesOfReply}
                onReplySubmit={onUploadReply}
                onRewardCommentEdit={onEditRewardComment}
                parent={{
                  contentType: 'video',
                  contentId: videoId,
                  pinnedCommentId,
                  rewardLevel,
                  uploader
                }}
                style={{ paddingTop: '1rem' }}
                userId={userId}
              />
            </div>
            <div
              className={css`
                height: 10rem;
                @media (max-width: ${tabletMaxWidth}) {
                  height: 1rem;
                }
              `}
            />
            {confirmModalShown && (
              <ConfirmModal
                title="Remove Video"
                onHide={() => setConfirmModalShown(false)}
                onConfirm={handleDeleteVideo}
              />
            )}
          </div>
        )}
        {loaded && !isVideoUnavailable && (
          <NavMenu
            videoId={videoId}
            playlistId={playlistId ? Number(playlistId) : null}
            isContinuing={!!isContinuing}
          />
        )}
      </div>
    </ErrorBoundary>
  );

  async function handleDeleteVideo() {
    await deleteContent({ id: videoId, contentType: 'video' });
    onDeleteContent({ contentType: 'video', contentId: videoId });
  }

  async function handleEditVideoPage(params: any) {
    const data = await editContent(params);
    const url = fetchedVideoCodeFromURL(params.editedUrl);
    onEditContent({
      data: {
        title: params.editedTitle,
        description: data.description,
        content: url
      },
      contentType: 'video',
      contentId: videoId
    });
    onEditVideoThumbs({
      videoId,
      title: params.title,
      url
    });
  }

  function handleChangeByUserStatus({
    contentId,
    contentType,
    byUser
  }: {
    contentId: number;
    contentType: string;
    byUser: boolean;
  }) {
    onSetByUserStatus({ contentId, contentType, byUser });
    onChangeVideoByUserStatus({ videoId, byUser });
  }

  function handleSetRewardLevel({
    contentId,
    contentType,
    rewardLevel
  }: {
    contentId: number;
    contentType: string;
    rewardLevel: number;
  }) {
    onSetRewardLevel({ contentType, contentId, rewardLevel });
    onSetThumbRewardLevel({ videoId, rewardLevel });
  }
}
