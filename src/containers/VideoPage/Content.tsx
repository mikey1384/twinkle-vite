import React, { useEffect, useMemo, useState } from 'react';
import Carousel from '~/components/Carousel';
import Button from '~/components/Button';
import XPVideoPlayer from '~/components/XPVideoPlayer';
import PageTab from './PageTab';
import localize from '~/constants/localize';
import CheckListGroup from '~/components/CheckListGroup';
import QuestionsBuilder from './QuestionsBuilder';
import ResultModal from './Modals/ResultModal';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useAppContext, useContentContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';

const addEditQuestionsLabel = localize('addEditQuestions');
const addQuestionsLabel = localize('addQuestions');
const thereAreNoQuestionsLabel = localize('thereAreNoQuestions');

export default function Content({
  byUser,
  content,
  isContinuing,
  onVideoEnd,
  onVideoPlay,
  playlistId,
  questions,
  rewardLevel,
  title,
  watchTabActive,
  uploader,
  videoId
}: {
  byUser?: boolean;
  content: string;
  isContinuing?: boolean;
  onVideoEnd?: () => void;
  onVideoPlay?: () => void;
  playlistId?: number;
  questions: any[];
  rewardLevel?: number;
  title: string;
  watchTabActive?: boolean;
  uploader: { id: number; level: number };
  videoId: number;
}) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [resultModalShown, setResultModalShown] = useState(false);
  const [questionsBuilderShown, setQuestionsBuilderShown] = useState(false);
  const uploadQuestions = useAppContext(
    (v) => v.requestHelpers.uploadQuestions
  );
  const onSetVideoQuestions = useContentContext(
    (v) => v.actions.onSetVideoQuestions
  );
  const level = useKeyContext((v) => v.myState.level);
  const userId = useKeyContext((v) => v.myState.userId);
  useEffect(() => {
    setCurrentSlide(0);
  }, [videoId]);
  const userIsUploader = uploader?.id === userId;
  const userCanEditThis = useMemo(() => {
    return userIsUploader || level > uploader?.level;
  }, [level, uploader?.level, userIsUploader]);

  return (
    <ErrorBoundary componentPath="VideoPage/Content">
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
          watchTabActive={watchTabActive}
          isContinuing={isContinuing}
          playlistId={playlistId}
          questions={questions}
        />
        <div style={{ marginTop: '2rem' }}>
          {!questionsBuilderShown && (
            <XPVideoPlayer
              onPlay={() => onVideoPlay?.()}
              rewardLevel={rewardLevel}
              byUser={!!byUser}
              key={videoId}
              videoId={videoId}
              videoCode={content}
              uploader={uploader}
              minimized={!watchTabActive}
              onVideoEnd={onVideoEnd}
            />
          )}
          {userCanEditThis && !watchTabActive && (
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
              {userCanEditThis && (
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
        {resultModalShown && (
          <ResultModal
            onHide={() => setResultModalShown(false)}
            numberCorrect={numberCorrect}
            totalQuestions={questions.length}
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
    </ErrorBoundary>
  );

  function numberCorrect() {
    const correctAnswers = questions.map((question) => question.correctChoice);
    let number = 0;
    for (let i = 0; i < correctAnswers.length; i++) {
      if (userAnswers[i] + 1 === correctAnswers[i]) number++;
    }
    return number;
  }

  function handleRenderSlides() {
    return questions.map((question, questionIndex) => {
      const filteredChoices = question.choices.filter(
        (choice: any) => !!choice
      );
      const isCurrentSlide = currentSlide === questionIndex;
      const listItems = filteredChoices.map(
        (choice: any, choiceIndex: number) => ({
          label: choice,
          checked: isCurrentSlide && userAnswers[currentSlide] === choiceIndex
        })
      );

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

  function handleSelectChoice(newAnswer: number) {
    setUserAnswers((userAnswers) => ({
      ...userAnswers,
      [currentSlide]: newAnswer
    }));
  }

  async function handleUploadQuestions(questions: any[]) {
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
