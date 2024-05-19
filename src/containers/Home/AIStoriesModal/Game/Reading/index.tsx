import React from 'react';
import GradientButton from '~/components/Buttons/GradientButton';
import ContentContainer from './ContentContainer';

export default function Reading({
  attemptId,
  difficulty,
  displayedSection,
  explanation,
  imageGeneratedCount,
  generateButtonPressed,
  loadStoryComplete,
  loadingTopic,
  MainRef,
  onLoadQuestions,
  onLoadTopic,
  onSetDisplayedSection,
  onSetTopicLoadError,
  onSetUserChoiceObj,
  onSetSolveObj,
  handleGenerateStory,
  handleReset,
  questions,
  questionsButtonEnabled,
  questionsLoaded,
  questionsLoadError,
  solveObj,
  story,
  storyId,
  storyLoadError,
  topicLoadError,
  userChoiceObj
}: {
  attemptId: number;
  difficulty: number;
  displayedSection: string;
  explanation: string;
  imageGeneratedCount: number;
  generateButtonPressed: boolean;
  loadStoryComplete: boolean;
  loadingTopic: boolean;
  MainRef: React.RefObject<any>;
  onLoadQuestions: () => void;
  onLoadTopic: (v: any) => void;
  onSetDisplayedSection: (v: string) => void;
  onSetGenerateButtonPressed: (v: boolean) => void;
  onSetStoryLoadError: (v: boolean) => void;
  onSetTopicLoadError: (v: boolean) => void;
  onSetUserChoiceObj: (v: any) => void;
  onSetSolveObj: (v: any) => void;
  onSetQuestions: (v: any) => void;
  onSetQuestionsButtonEnabled: (v: boolean) => void;
  onSetQuestionsLoaded: (v: boolean) => void;
  handleGenerateStory: (isOnError?: boolean) => void;
  handleReset: () => void;
  questions: any[];
  questionsButtonEnabled: boolean;
  questionsLoaded: boolean;
  questionsLoadError: boolean;
  solveObj: any;
  story: string;
  storyId: number;
  storyLoadError: boolean;
  topicLoadError: boolean;
  userChoiceObj: any;
}) {
  return (
    <>
      {storyLoadError ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <p style={{ fontWeight: 'bold', fontSize: '1.7rem' }}>
            Oops, something went wrong. Try again
          </p>
          <GradientButton
            style={{ marginTop: '5rem' }}
            onClick={() => handleGenerateStory(true)}
          >
            Retry
          </GradientButton>
        </div>
      ) : generateButtonPressed ? (
        <ContentContainer
          attemptId={attemptId}
          difficulty={Number(difficulty)}
          displayedSection={displayedSection}
          explanation={explanation}
          imageGeneratedCount={imageGeneratedCount}
          loading={story?.length < 10}
          loadComplete={loadStoryComplete}
          questions={questions}
          questionsButtonEnabled={questionsButtonEnabled}
          questionsLoadError={questionsLoadError}
          onLoadQuestions={onLoadQuestions}
          onSetDisplayedSection={onSetDisplayedSection}
          onSetUserChoiceObj={onSetUserChoiceObj}
          onScrollToTop={() => (MainRef.current.scrollTop = 0)}
          onReset={handleReset}
          onSetSolveObj={onSetSolveObj}
          questionsLoaded={questionsLoaded}
          solveObj={solveObj}
          story={story}
          storyId={storyId}
          userChoiceObj={userChoiceObj}
        />
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          {topicLoadError ? (
            <div
              style={{
                marginTop: '5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}
            >
              <p>There was an error initializing AI Story</p>
              <GradientButton
                style={{ marginTop: '3rem' }}
                onClick={() => {
                  onSetTopicLoadError(false);
                  onLoadTopic({ difficulty });
                }}
              >
                Retry
              </GradientButton>
            </div>
          ) : (
            <GradientButton
              onClick={() => handleGenerateStory()}
              loading={loadingTopic}
            >
              Generate a Story
            </GradientButton>
          )}
        </div>
      )}
    </>
  );
}
