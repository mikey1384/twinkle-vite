import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Loading from '~/components/Loading';
import ProgressBar from '~/components/ProgressBar';
import Story from './Story';
import Questions from './Questions';
import SuccessModal from './SuccessModal';
import GradientButton from '~/components/Buttons/GradientButton';
import { useAppContext, useKeyContext } from '~/contexts';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

const rewardTable = {
  1: {
    xp: 500,
    coins: 25
  },
  2: {
    xp: 1000,
    coins: 50
  },
  3: {
    xp: 2500,
    coins: 75
  },
  4: {
    xp: 5000,
    coins: 150
  },
  5: {
    xp: 10000,
    coins: 200
  }
};

ContentContainer.propTypes = {
  attemptId: PropTypes.number,
  difficulty: PropTypes.number.isRequired,
  displayedSection: PropTypes.string.isRequired,
  loading: PropTypes.bool.isRequired,
  loadComplete: PropTypes.bool.isRequired,
  questions: PropTypes.array,
  storyObj: PropTypes.object.isRequired,
  onLoadQuestions: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  onSetSolveObj: PropTypes.func.isRequired,
  onScrollToTop: PropTypes.func.isRequired,
  onSetDisplayedSection: PropTypes.func.isRequired,
  onSetUserChoiceObj: PropTypes.func.isRequired,
  questionsLoadError: PropTypes.bool,
  questionsLoaded: PropTypes.bool,
  solveObj: PropTypes.object.isRequired,
  userChoiceObj: PropTypes.object.isRequired
};

export default function ContentContainer({
  attemptId,
  difficulty,
  displayedSection,
  loading,
  loadComplete,
  questions,
  storyObj,
  onLoadQuestions,
  onReset,
  onSetDisplayedSection,
  onSetSolveObj,
  onSetUserChoiceObj,
  onScrollToTop,
  questionsLoadError,
  questionsLoaded,
  solveObj,
  userChoiceObj
}) {
  const { userId } = useKeyContext((v) => v.myState);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const uploadAIStoryAttempt = useAppContext(
    (v) => v.requestHelpers.uploadAIStoryAttempt
  );
  const [isGrading, setIsGrading] = useState(false);
  const [successModalShown, setSuccessModalShown] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

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
        <div style={{ marginTop: '20vh', padding: '0 2rem' }}>
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
              onSetUserChoiceObj={onSetUserChoiceObj}
              questions={questions}
              onReadAgain={handleReadAgain}
              questionsLoaded={questionsLoaded}
              onGrade={handleGrade}
              onRetryLoadingQuestions={onLoadQuestions}
              questionsLoadError={questionsLoadError}
              isGrading={isGrading}
            />
          )}
          {solveObj.isGraded ? (
            <div
              style={{
                width: '100%',
                marginTop: '5rem',
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              <GradientButton onClick={onReset}>New Story</GradientButton>
            </div>
          ) : null}
        </div>
      )}
      {successModalShown && (
        <SuccessModal
          onHide={() => setSuccessModalShown(false)}
          numQuestions={questions.length}
          difficulty={difficulty}
          rewardTable={rewardTable}
        />
      )}
    </div>
  );

  async function handleGrade() {
    let numCorrect = 0;
    const result = [];
    for (let question of questions) {
      const userChoice = userChoiceObj[question.id];
      if (userChoice === question.answerIndex) {
        numCorrect++;
      }
      result.push({
        questionId: question.id,
        isCorrect: userChoice === question.answerIndex
      });
    }
    const isPassed = numCorrect === questions.length;
    try {
      setIsGrading(true);
      const { newXp, newCoins } = await uploadAIStoryAttempt({
        attemptId,
        difficulty,
        result,
        isPassed
      });
      if (newXp && newCoins) {
        onSetUserState({
          userId,
          newState: { twinkleCoins: newCoins, twinkleXP: newXp }
        });
      }
      onSetSolveObj({
        numCorrect,
        isGraded: true
      });
      if (isPassed) {
        setSuccessModalShown(true);
      }
      setIsGrading(false);
    } catch (error) {
      console.error(error);
    }
  }

  function handleFinishRead() {
    onScrollToTop();
    onSetDisplayedSection('questions');
  }

  function handleReadAgain() {
    onScrollToTop();
    onSetDisplayedSection('story');
  }
}
