import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Loading from '~/components/Loading';
import ProgressBar from '~/components/ProgressBar';
import Story from './Story';
import Questions from './Questions';
import SuccessModal from './SuccessModal';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

ContentContainer.propTypes = {
  difficulty: PropTypes.number.isRequired,
  loading: PropTypes.bool.isRequired,
  loadComplete: PropTypes.bool.isRequired,
  questions: PropTypes.array,
  storyObj: PropTypes.object.isRequired,
  onLoadQuestions: PropTypes.func.isRequired,
  onScrollToTop: PropTypes.func.isRequired,
  questionsLoaded: PropTypes.bool
};

export default function ContentContainer({
  difficulty,
  loading,
  loadComplete,
  questions,
  storyObj,
  onLoadQuestions,
  onScrollToTop,
  questionsLoaded
}) {
  const [solveObj, setSolveObj] = useState({
    numCorrect: 0,
    isGraded: false
  });
  const [successModalShown, setSuccessModalShown] = useState(false);
  const [userChoiceObj, setUserChoiceObj] = useState({});
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [displayedSection, setDisplayedSection] = useState('story');

  useEffect(() => {
    if (!loadComplete && loadingProgress < 99) {
      setTimeout(() => {
        setLoadingProgress(loadingProgress + 1);
      }, 500);
    }
    if (loadComplete) {
      setLoadingProgress(100);
    }
  }, [loadComplete, loading, loadingProgress]);

  return (
    <div
      className={css`
        width: 50%;
        @media (max-width: ${mobileMaxWidth}) {
          width: 100%;
        }
      `}
    >
      {loading ? (
        <div style={{ marginTop: '20vh' }}>
          <Loading text="Generating a Story..." />
          <ProgressBar progress={loadingProgress} />
        </div>
      ) : (
        <div
          style={{
            width: '100%',
            marginTop: displayedSection === 'story' ? '60vh' : '10rem',
            padding: '2rem',
            fontSize: '1.7rem'
          }}
        >
          {displayedSection === 'story' && (
            <Story
              isGraded={solveObj.isGraded}
              story={storyObj.story}
              explanation={storyObj.explanation}
              questionsLoaded={questionsLoaded}
              onLoadQuestions={onLoadQuestions}
              onFinishRead={handleFinishRead}
            />
          )}
          {displayedSection === 'questions' && (
            <Questions
              solveObj={solveObj}
              userChoiceObj={userChoiceObj}
              onSetUserChoiceObj={setUserChoiceObj}
              questions={questions}
              onReadAgain={handleReadAgain}
              questionsLoaded={questionsLoaded}
              onGrade={handleGrade}
            />
          )}
        </div>
      )}
      {successModalShown && (
        <SuccessModal
          onHide={() => setSuccessModalShown(false)}
          numQuestions={questions.length}
          difficulty={difficulty}
        />
      )}
    </div>
  );

  function handleGrade() {
    let numCorrect = 0;
    for (let question of questions) {
      const userChoice = userChoiceObj[question.id];
      if (userChoice === question.answerIndex) {
        numCorrect++;
      }
    }
    setSolveObj({
      numCorrect,
      isGraded: true
    });
    if (numCorrect === questions.length) {
      setSuccessModalShown(true);
    }
  }

  function handleFinishRead() {
    onScrollToTop();
    setDisplayedSection('questions');
  }

  function handleReadAgain() {
    onScrollToTop();
    setDisplayedSection('story');
  }
}
