import React from 'react';
import GradientButton from '~/components/Buttons/GradientButton';
import ContentContainer from './ContentContainer';
import { socket } from '~/constants/io';
import { useAppContext } from '~/contexts';

export default function Reading({
  attemptId,
  difficulty,
  displayedSection,
  explanation,
  imageGeneratedCount,
  loadStoryComplete,
  loadingTopic,
  MainRef,
  onLoadQuestions,
  onLoadTopic,
  onSetAttemptId,
  onSetDisplayedSection,
  onSetExplanation,
  onSetLoadStoryComplete,
  onSetStory,
  onSetStoryId,
  onSetStoryLoadError,
  onSetTopicLoadError,
  onSetUserChoiceObj,
  onSetSolveObj,
  handleReset,
  questions,
  questionsButtonEnabled,
  questionsLoaded,
  questionsLoadError,
  solveObj,
  story,
  storyId,
  storyLoadError,
  storyType,
  topic,
  topicKey,
  topicLoadError,
  userChoiceObj
}: {
  attemptId: number;
  difficulty: number;
  displayedSection: string;
  explanation: string;
  imageGeneratedCount: number;
  loadStoryComplete: boolean;
  loadingTopic: boolean;
  MainRef: React.RefObject<any>;
  onLoadQuestions: () => void;
  onLoadTopic: (v: any) => void;
  onSetAttemptId: (v: number) => void;
  onSetDisplayedSection: (v: string) => void;
  onSetExplanation: (v: string) => void;
  onSetLoadStoryComplete: (v: boolean) => void;
  onSetStory: (v: string) => void;
  onSetStoryId: (v: number) => void;
  onSetStoryLoadError: (v: boolean) => void;
  onSetTopicLoadError: (v: boolean) => void;
  onSetUserChoiceObj: (v: any) => void;
  onSetSolveObj: (v: any) => void;
  onSetQuestions: (v: any) => void;
  onSetQuestionsButtonEnabled: (v: boolean) => void;
  onSetQuestionsLoaded: (v: boolean) => void;
  handleReset: () => void;
  questions: any[];
  questionsButtonEnabled: boolean;
  questionsLoaded: boolean;
  questionsLoadError: boolean;
  solveObj: any;
  story: string;
  storyId: number;
  storyLoadError: boolean;
  storyType: string;
  topic: string;
  topicKey: string;
  topicLoadError: boolean;
  userChoiceObj: any;
}) {
  const loadAIStory = useAppContext((v) => v.requestHelpers.loadAIStory);

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
      ) : topicLoadError ? (
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
        </div>
      )}
    </>
  );

  async function handleGenerateStory(isOnError?: boolean) {
    if (isOnError) {
      handleReset();
    }
    onSetStoryLoadError(false);
    onSetGenerateButtonPressed(true);
    try {
      const { attemptId: newAttemptId, storyObj } = await loadAIStory({
        difficulty,
        topic,
        topicKey,
        type: storyType
      });
      onSetAttemptId(newAttemptId);
      onSetStoryId(storyObj.id);
      onSetStory(storyObj.story);
      onSetExplanation(storyObj.explanation);
      onSetLoadStoryComplete(true);
      socket.emit('generate_ai_story', {
        difficulty,
        topic,
        type: storyType,
        storyId: storyObj.id
      });
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error(error);
      onSetStoryLoadError(true);
    }
  }
}
