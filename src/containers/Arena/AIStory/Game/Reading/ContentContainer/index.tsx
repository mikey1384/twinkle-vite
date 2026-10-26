import React, { useEffect, useState } from 'react';
import ArenaButton from '../../../../ArenaButton';
import ArenaLoader from '../../../../ArenaLoader';
import Story from './Story';
import Questions from './Questions';
import { mobileMaxWidth, tabletMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

export default function ContentContainer({
  difficulty,
  displayedSection,
  explanation,
  explanationStreamComplete,
  isGrading,
  loading,
  loadComplete,
  questions,
  onLoadQuestions,
  onReset,
  onGrade,
  onOpenClearScreen,
  onSetDisplayedSection,
  onSetUserChoiceObj,
  questionsButtonEnabled,
  questionsLoadError,
  questionsLoaded,
  story,
  storyStreamComplete,
  storyId,
  solveObj,
  userChoiceObj
}: {
  difficulty: number;
  displayedSection: string;
  explanation: string;
  explanationStreamComplete: boolean;
  isGrading: boolean;
  loading: boolean;
  loadComplete: boolean;
  questions: any[];
  onLoadQuestions: (storyId: number) => void;
  onReset: () => void;
  onGrade: () => void;
  onOpenClearScreen: () => void;
  onSetDisplayedSection: (section: string) => void;
  onSetSolveObj: (solveObj: any) => void;
  onSetUserChoiceObj: (userChoiceObj: any) => void;
  questionsButtonEnabled: boolean;
  questionsLoadError: boolean;
  questionsLoaded: boolean;
  solveObj: any;
  story: string;
  storyStreamComplete: boolean;
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
            justify-content: center;
            align-items: center;
            padding: 0 2rem;
            @media (max-width: ${tabletMaxWidth}) {
              width: 70%;
            }
            @media (max-width: ${mobileMaxWidth}) {
              width: 100%;
            }
          `}
        >
          <ArenaLoader text="Writing your story…" progress={loadingProgress} />
        </div>
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            marginTop: '2rem',
            padding: '2rem',
            fontSize: '1.7rem'
          }}
        >
          {displayedSection === 'story' ? (
            <Story
              storyId={storyId}
              isGraded={solveObj.isGraded}
              story={story}
              storyStreamComplete={storyStreamComplete}
              explanation={explanation}
              explanationStreamComplete={explanationStreamComplete}
              questionsButtonEnabled={questionsButtonEnabled}
              onFinishRead={handleFinishRead}
            />
          ) : (
            <Questions
              difficulty={difficulty}
              solveObj={solveObj}
              userChoiceObj={userChoiceObj}
              onSetUserChoiceObj={onSetUserChoiceObj}
              questions={questions}
              storyId={storyId}
              onReadAgain={handleReadAgain}
              questionsLoaded={questionsLoaded}
              onGrade={onGrade}
              onLoadQuestions={onLoadQuestions}
              onOpenClearScreen={onOpenClearScreen}
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
              <ArenaButton onClick={onReset}>New Story</ArenaButton>
            </div>
          ) : null}
        </div>
      )}
    </>
  );

  function handleFinishRead() {
    onSetDisplayedSection('questions');
  }

  function handleReadAgain() {
    onSetDisplayedSection('story');
  }
}
