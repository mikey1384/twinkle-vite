import React, { useEffect, useState } from 'react';
import Loading from '~/components/Loading';
import ProgressBar from '~/components/ProgressBar';
import Story from './Story';
import Questions from './Questions';
import SuccessModal from './SuccessModal';
import GradientButton from '~/components/Buttons/GradientButton';
import { useAppContext, useKeyContext } from '~/contexts';
import { mobileMaxWidth, tabletMaxWidth } from '~/constants/css';
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

export default function ContentContainer({
  attemptId,
  difficulty,
  displayedSection,
  explanation,
  imageGeneratedCount,
  loading,
  loadComplete,
  questions,
  onLoadQuestions,
  onReset,
  onSetDisplayedSection,
  onSetSolveObj,
  onSetUserChoiceObj,
  onScrollToTop,
  questionsButtonEnabled,
  questionsLoadError,
  questionsLoaded,
  story,
  storyId,
  solveObj,
  userChoiceObj
}: {
  attemptId: number;
  difficulty: number;
  displayedSection: string;
  explanation: string;
  imageGeneratedCount: number;
  loading: boolean;
  loadComplete: boolean;
  questions: any[];
  onLoadQuestions: () => void;
  onReset: () => void;
  onSetDisplayedSection: (section: string) => void;
  onSetSolveObj: (solveObj: any) => void;
  onSetUserChoiceObj: (userChoiceObj: any) => void;
  onScrollToTop: () => void;
  questionsButtonEnabled: boolean;
  questionsLoadError: boolean;
  questionsLoaded: boolean;
  solveObj: any;
  story: string;
  storyId: number;
  userChoiceObj: any;
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
    <>
      {loading ? (
        <div
          className={css`
            width: 50%;
            height: 100%;
            display: flex;
            flex-direction: column;
            padding: 0 2rem;
            @media (max-width: ${tabletMaxWidth}) {
              width: 70%;
            }
            @media (max-width: ${mobileMaxWidth}) {
              width: 100%;
            }
          `}
        >
          <div
            className={css`
              margin-top: CALC(50% - 13rem);
            `}
          >
            <Loading text="Generating a Story..." />
            <ProgressBar progress={loadingProgress} />
          </div>
        </div>
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            marginTop: '10rem',
            padding: '2rem',
            fontSize: '1.7rem'
          }}
        >
          {displayedSection === 'story' && (
            <Story
              isGraded={solveObj.isGraded}
              story={story}
              explanation={explanation}
              questionsButtonEnabled={questionsButtonEnabled}
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
                paddingBottom: '10rem',
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
          imageGeneratedCount={imageGeneratedCount}
          onHide={() => setSuccessModalShown(false)}
          numQuestions={questions.length}
          difficulty={difficulty}
          rewardTable={rewardTable}
          storyId={storyId}
        />
      )}
    </>
  );

  async function handleGrade() {
    let numCorrect = 0;
    const result = [];
    for (const question of questions) {
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
