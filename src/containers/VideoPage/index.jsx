import React, { useEffect, useRef, useState } from 'react';
import Carousel from '~/components/Carousel';
import Button from '~/components/Button';
import XPVideoPlayer from '~/components/XPVideoPlayer';
import InvalidPage from '~/components/InvalidPage';
import CheckListGroup from '~/components/CheckListGroup';
import Comments from '~/components/Comments';
import ResultModal from './Modals/ResultModal';
import QuestionsBuilder from './QuestionsBuilder';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import request from 'axios';
import queryString from 'query-string';
import ErrorBoundary from '~/components/ErrorBoundary';
import Subjects from '~/components/Subjects';
import RewardStatus from '~/components/RewardStatus';
import Loading from '~/components/Loading';
import Details from './Details';
import NavMenu from './NavMenu';
import PageTab from './PageTab';
import URL from '~/constants/URL';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Color, mobileMaxWidth } from '~/constants/css';
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

const addEditQuestionsLabel = localize('addEditQuestions');
const addQuestionsLabel = localize('addQuestions');
const commentOnThisVideoLabel = localize('commentOnThisVideo');
const thereAreNoQuestionsLabel = localize('thereAreNoQuestions');

export default function VideoPage() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const { videoId: initialVideoId } = useParams();
  const videoId = Number(initialVideoId);
  const [changingPage, setChangingPage] = useState(false);
  const [watchTabActive, setWatchTabActive] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loadingComments, setLoadingComments] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const [resultModalShown, setResultModalShown] = useState(false);
  const [confirmModalShown, setConfirmModalShown] = useState(false);
  const [questionsBuilderShown, setQuestionsBuilderShown] = useState(false);
  const [videoUnavailable, setVideoUnavailable] = useState(false);
  const CommentInputAreaRef = useRef(null);
  const prevDeleted = useRef(false);

  const deleteContent = useAppContext((v) => v.requestHelpers.deleteContent);
  const editContent = useAppContext((v) => v.requestHelpers.editContent);
  const fetchPlaylistsContaining = useAppContext(
    (v) => v.requestHelpers.fetchPlaylistsContaining
  );
  const loadComments = useAppContext((v) => v.requestHelpers.loadComments);
  const loadSubjects = useAppContext((v) => v.requestHelpers.loadSubjects);
  const uploadQuestions = useAppContext(
    (v) => v.requestHelpers.uploadQuestions
  );
  const { authLevel, canEdit, userId } = useKeyContext((v) => v.myState);
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
  const onSetRewardLevel = useContentContext((v) => v.actions.onSetRewardLevel);
  const onSetVideoQuestions = useContentContext(
    (v) => v.actions.onSetVideoQuestions
  );
  const onUploadComment = useContentContext((v) => v.actions.onUploadComment);
  const onUploadReply = useContentContext((v) => v.actions.onUploadReply);
  const onUploadSubject = useContentContext((v) => v.actions.onUploadSubject);
  const onSetContentNav = useViewContext((v) => v.actions.onSetContentNav);

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

  useEffect(() => {
    if (!prevDeleted.current && isDeleted) {
      onSetContentNav('');
      navigate('/videos');
    }
    prevDeleted.current = isDeleted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDeleted, loaded]);

  useEffect(() => {
    setChangingPage(true);
    setCurrentSlide(0);
    setWatchTabActive(true);
    setVideoUnavailable(false);
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
          return setVideoUnavailable(true);
        }
        onInitContent({
          ...data,
          contentId: videoId,
          contentType: 'video'
        });
      } catch (error) {
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
  const userIsUploader = uploader?.id === userId;
  const userCanEditThis = !!canEdit && authLevel >= uploader?.authLevel;

  return (
    <ErrorBoundary
      componentPath="VideoPage/index"
      className={css`
        width: CALC(100% - 2rem);
        height: 100%;
        margin-top: 1rem;
        margin-bottom: 1rem;
        @media (max-width: ${mobileMaxWidth}) {
          margin-top: 0;
          width: 100%;
          flex-direction: column;
        }
      `}
    >
      {(!loaded || videoUnavailable) && (
        <div>
          {videoUnavailable ? (
            <InvalidPage text="Video does not exist" />
          ) : (
            <Loading text="Loading Video..." />
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
          @media (max-width: ${mobileMaxWidth}) {
            flex-direction: column;
            width: 100%;
            margin: 0;
          }
        `}
      >
        {loaded && !videoUnavailable && content && (
          <div
            className={css`
              width: CALC(70% - 1rem);
              @media (max-width: ${mobileMaxWidth}) {
                width: 100%;
                border: 0;
              }
            `}
          >
            <div
              className={css`
                width: 100%;
                background: #fff;
                margin-bottom: 1rem;
                padding: 1rem;
                border: 1px solid ${Color.borderGray()};
                padding-top: 0;
                @media (max-width: ${mobileMaxWidth}) {
                  border-top: 0;
                  border-left: 0;
                  border-right: 0;
                }
              `}
            >
              <PageTab
                questions={questions}
                watchTabActive={watchTabActive}
                onWatchTabClick={() => setWatchTabActive(true)}
                onQuestionTabClick={() => setWatchTabActive(false)}
              />
              <div style={{ marginTop: '2rem' }}>
                {!questionsBuilderShown && (
                  <XPVideoPlayer
                    autoplay
                    rewardLevel={rewardLevel}
                    byUser={!!byUser}
                    key={videoId}
                    videoId={videoId}
                    videoCode={content}
                    title={title}
                    uploader={uploader}
                    minimized={!watchTabActive}
                  />
                )}
                {(userIsUploader || userCanEditThis) && !watchTabActive && (
                  <div style={{ marginTop: rewardLevel ? '1rem' : 0 }}>
                    <a
                      style={{
                        cursor: 'pointer',
                        fontSize: '1.5rem'
                      }}
                      onClick={() => setQuestionsBuilderShown(true)}
                    >
                      {addEditQuestionsLabel}
                    </a>
                  </div>
                )}
                {!watchTabActive && questions.length > 0 && (
                  <Carousel
                    allowDrag={false}
                    progressBar
                    slidesToShow={1}
                    slidesToScroll={1}
                    slideIndex={currentSlide}
                    afterSlide={setCurrentSlide}
                    onFinish={() => setResultModalShown(true)}
                  >
                    {handleRenderSlides()}
                  </Carousel>
                )}
                {!watchTabActive && questions.length === 0 && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      fontSize: '2rem',
                      height: '15rem'
                    }}
                  >
                    <p>{thereAreNoQuestionsLabel}.</p>
                    {(userIsUploader || userCanEditThis) && (
                      <Button
                        style={{ marginTop: '2rem', fontSize: '2rem' }}
                        skeuomorphic
                        color="darkerGray"
                        onClick={() => setQuestionsBuilderShown(true)}
                      >
                        {addQuestionsLabel}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div
              className={css`
                display: flex;
                flex-direction: column;
                background: #fff;
                margin-top: 1rem;
                border: 1px solid ${Color.borderGray()};
                width: 100%;
                @media (max-width: ${mobileMaxWidth}) {
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
                uploaderName={uploader.username}
              />
            </div>
            <Subjects
              loadMoreButton={subjectsLoadMoreButton}
              subjects={subjects}
              onLoadMoreSubjects={onLoadMoreSubjects}
              onLoadSubjectComments={onLoadSubjectComments}
              onSubjectEditDone={onEditSubject}
              onSubjectDelete={(subjectId) =>
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
                @media (max-width: ${mobileMaxWidth}) {
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
                @media (max-width: ${mobileMaxWidth}) {
                  height: 1rem;
                }
              `}
            />
            {resultModalShown && (
              <ResultModal
                onHide={() => setResultModalShown(false)}
                numberCorrect={numberCorrect}
                totalQuestions={questions.length}
              />
            )}
            {confirmModalShown && (
              <ConfirmModal
                title="Remove Video"
                onHide={() => setConfirmModalShown(false)}
                onConfirm={handleDeleteVideo}
              />
            )}
            {questionsBuilderShown && (
              <QuestionsBuilder
                questions={questions}
                title={title}
                videoCode={content}
                onSubmit={handleUploadQuestions}
                onHide={() => setQuestionsBuilderShown(false)}
              />
            )}
          </div>
        )}
        {loaded && (
          <NavMenu
            videoId={videoId}
            playlistId={playlistId}
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

  async function handleEditVideoPage(params) {
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

  function handleChangeByUserStatus({ contentId, contentType, byUser }) {
    onSetByUserStatus({ contentId, contentType, byUser });
    onChangeVideoByUserStatus({ videoId, byUser });
  }

  function numberCorrect() {
    const correctAnswers = questions.map((question) => question.correctChoice);
    let numberCorrect = 0;
    for (let i = 0; i < correctAnswers.length; i++) {
      if (userAnswers[i] + 1 === correctAnswers[i]) numberCorrect++;
    }
    return numberCorrect;
  }

  function handleRenderSlides() {
    return questions.map((question, questionIndex) => {
      const filteredChoices = question.choices.filter((choice) => !!choice);
      const isCurrentSlide = currentSlide === questionIndex;
      const listItems = filteredChoices.map((choice, choiceIndex) => ({
        label: choice,
        checked: isCurrentSlide && userAnswers[currentSlide] === choiceIndex
      }));

      return (
        <div key={questionIndex}>
          <div>
            <h3
              style={{ marginTop: '1rem' }}
              dangerouslySetInnerHTML={{ __html: question.title }}
            />
          </div>
          <CheckListGroup
            inputType="radio"
            listItems={listItems}
            onSelect={handleSelectChoice}
            style={{ marginTop: '1.5rem', paddingRight: '1rem' }}
          />
        </div>
      );
    });
  }

  function handleSelectChoice(newAnswer) {
    setUserAnswers((userAnswers) => ({
      ...userAnswers,
      [currentSlide]: newAnswer
    }));
  }

  function handleSetRewardLevel({ contentId, contentType, rewardLevel }) {
    onSetRewardLevel({ contentType, contentId, rewardLevel });
    onSetThumbRewardLevel({ videoId, rewardLevel });
  }

  async function handleUploadQuestions(questions) {
    const data = await uploadQuestions({ questions, videoId });
    onSetVideoQuestions({
      contentType: 'video',
      contentId: videoId,
      questions: data
    });
    setCurrentSlide(0);
    setUserAnswers({});
  }
}
