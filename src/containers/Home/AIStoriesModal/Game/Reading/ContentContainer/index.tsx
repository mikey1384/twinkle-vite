import React, { useEffect, useState } from 'react';
import Loading from '~/components/Loading';
import ProgressBar from '~/components/ProgressBar';
import Story from './Story';
import Questions from './Questions';
import GradientButton from '~/components/Buttons/GradientButton';
import { mobileMaxWidth, tabletMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

export default function ContentContainer({
  displayedSection,
  explanation,
  isGrading,
  loading,
  loadComplete,
  questions,
  onLoadQuestions,
  onReset,
  onGrade,
  onSetDisplayedSection,
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
  displayedSection: string;
  explanation: string;
  isGrading: boolean;
  loading: boolean;
  loadComplete: boolean;
  questions: any[];
  onLoadQuestions: (storyId: number) => void;
  onReset: () => void;
  onGrade: () => void;
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
              storyId={storyId}
              onReadAgain={handleReadAgain}
              questionsLoaded={questionsLoaded}
              onGrade={onGrade}
              onLoadQuestions={onLoadQuestions}
              questionsLoadError={questionsLoadError}
              isGrading={isGrading}
            />
          )}
          {solveObj.isGraded ? (
            <div
              style={{
                width: '100%',
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
    </>
  );

  function handleFinishRead() {
    onScrollToTop();
    onSetDisplayedSection('questions');
  }

  function handleReadAgain() {
    onScrollToTop();
    onSetDisplayedSection('story');
  }
}
