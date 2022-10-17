import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Carousel from '~/components/Carousel';
import Button from '~/components/Button';
import XPVideoPlayer from '~/components/XPVideoPlayer';
import PageTab from './PageTab';
import localize from '~/constants/localize';
import CheckListGroup from '~/components/CheckListGroup';
import QuestionsBuilder from './QuestionsBuilder';
import ResultModal from './Modals/ResultModal';
import { useAppContext, useContentContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';

const addEditQuestionsLabel = localize('addEditQuestions');
const addQuestionsLabel = localize('addQuestions');
const thereAreNoQuestionsLabel = localize('thereAreNoQuestions');

Content.propTypes = {
  byUser: PropTypes.bool,
  content: PropTypes.string,
  isContinuing: PropTypes.bool,
  playlistId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  questions: PropTypes.array,
  rewardLevel: PropTypes.number,
  title: PropTypes.string,
  watchTabActive: PropTypes.bool,
  uploader: PropTypes.shape({
    id: PropTypes.number.isRequired,
    authLevel: PropTypes.number
  }),
  videoId: PropTypes.number.isRequired
};

export default function Content({
  byUser,
  content,
  isContinuing,
  playlistId,
  questions,
  rewardLevel,
  title,
  watchTabActive,
  uploader,
  videoId
}) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [resultModalShown, setResultModalShown] = useState(false);
  const [questionsBuilderShown, setQuestionsBuilderShown] = useState(false);
  const uploadQuestions = useAppContext(
    (v) => v.requestHelpers.uploadQuestions
  );
  const onSetVideoQuestions = useContentContext(
    (v) => v.actions.onSetVideoQuestions
  );
  const { authLevel, canEdit, userId } = useKeyContext((v) => v.myState);
  useEffect(() => {
    setCurrentSlide(0);
  }, [videoId]);
  const userIsUploader = uploader?.id === userId;
  const userCanEditThis = !!canEdit && authLevel >= uploader?.authLevel;

  return (
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
  );

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
