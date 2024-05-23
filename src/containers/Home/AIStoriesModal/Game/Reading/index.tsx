import React, { useEffect, useRef, useState } from 'react';
import GradientButton from '~/components/Buttons/GradientButton';
import ContentContainer from './ContentContainer';
import { socket } from '~/constants/io';
import { useAppContext } from '~/contexts';

export default function Reading({
  difficulty,
  displayedSection,
  explanation,
  isGrading,
  loadStoryComplete,
  MainRef,
  onLoadQuestions,
  onGrade,
  onReset,
  onSetAttemptId,
  onSetDisplayedSection,
  onSetExplanation,
  onSetIsCloseLocked,
  onSetLoadStoryComplete,
  onSetQuestionsButtonEnabled,
  onSetSolveObj,
  onSetStory,
  onSetStoryId,
  onSetUserChoiceObj,
  questions,
  questionsButtonEnabled,
  questionsLoaded,
  questionsLoadError,
  solveObj,
  story,
  storyId,
  storyType,
  topic,
  topicKey,
  userChoiceObj
}: {
  difficulty: number;
  displayedSection: string;
  explanation: string;
  isGrading: boolean;
  loadStoryComplete: boolean;
  MainRef: React.RefObject<any>;
  onLoadQuestions: (storyId: number) => void;
  onGrade: () => void;
  onReset: () => void;
  onSetAttemptId: (v: number) => void;
  onSetDisplayedSection: (v: string) => void;
  onSetExplanation: (v: string) => void;
  onSetIsCloseLocked: (v: boolean) => void;
  onSetLoadStoryComplete: (v: boolean) => void;
  onSetQuestionsButtonEnabled: (v: boolean) => void;
  onSetSolveObj: (v: any) => void;
  onSetStory: (v: string) => void;
  onSetStoryId: (v: number) => void;
  onSetUserChoiceObj: (v: any) => void;
  questions: any[];
  questionsButtonEnabled: boolean;
  questionsLoaded: boolean;
  questionsLoadError: boolean;
  solveObj: any;
  story: string;
  storyId: number;
  storyType: string;
  topic: string;
  topicKey: string;
  userChoiceObj: any;
}) {
  const finishedStoryIdRef = useRef(0);
  const loadAIStory = useAppContext((v) => v.requestHelpers.loadAIStory);
  const [storyLoadError, setStoryLoadError] = useState(false);

  useEffect(() => {
    if (!solveObj.isGraded) {
      handleGenerateStory();
    }

    async function handleGenerateStory() {
      setStoryLoadError(false);
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
        onSetIsCloseLocked(true);
        socket.emit('generate_ai_story', {
          difficulty,
          topic,
          type: storyType,
          storyId: storyObj.id
        });
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(error);
        setStoryLoadError(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solveObj?.isGraded]);

  useEffect(() => {
    socket.on('ai_story_updated', handleAIStoryUpdated);
    socket.on('ai_story_finished', handleAIStoryFinished);
    socket.on('ai_story_explanation_updated', handleAIStoryExplanationUpdated);
    socket.on(
      'ai_story_explanation_finished',
      handleAIStoryExplanationFinished
    );
    socket.on('ai_story_story_error', handleAIStoryError);
    socket.on('ai_story_explanation_error', handleAIStoryExplanationError);

    function handleAIStoryUpdated({
      storyId: streamedStoryId,
      story
    }: {
      storyId: number;
      story: string;
    }) {
      if (streamedStoryId === storyId) {
        onSetStory(story);
      }
    }

    function handleAIStoryFinished(storyId: number) {
      if (finishedStoryIdRef.current !== storyId) {
        finishedStoryIdRef.current = storyId;
        onLoadQuestions(storyId);
        socket.emit('generate_ai_story_explanations', {
          storyId: Number(storyId),
          story
        });
      }
    }

    function handleAIStoryExplanationUpdated({
      storyId: streamedStoryId,
      explanation
    }: {
      storyId: number;
      explanation: string;
    }) {
      if (streamedStoryId === storyId) {
        onSetExplanation(explanation);
      }
    }

    function handleAIStoryExplanationFinished() {
      onSetQuestionsButtonEnabled(true);
    }

    function handleAIStoryError(error: any) {
      console.error(`Error while streaming AI Story: ${error}`);
    }

    function handleAIStoryExplanationError() {
      onSetQuestionsButtonEnabled(true);
    }

    return function cleanUp() {
      socket.removeListener('ai_story_updated', handleAIStoryUpdated);
      socket.removeListener('ai_story_finished', handleAIStoryFinished);
      socket.removeListener(
        'ai_story_explanation_updated',
        handleAIStoryExplanationUpdated
      );
      socket.removeListener(
        'ai_story_explanation_finished',
        handleAIStoryExplanationFinished
      );
      socket.removeListener('ai_story_story_error', handleAIStoryError);
      socket.removeListener(
        'ai_story_explanation_error',
        handleAIStoryExplanationError
      );
    };
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        height: '100%'
      }}
    >
      {storyLoadError ? (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div>
            <p style={{ fontWeight: 'bold', fontSize: '1.7rem' }}>
              Oops, something went wrong. Try again
            </p>
            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              <GradientButton
                style={{ marginTop: '5rem' }}
                onClick={() => onReset()}
              >
                Retry
              </GradientButton>
            </div>
          </div>
        </div>
      ) : (
        <ContentContainer
          displayedSection={displayedSection}
          explanation={explanation}
          isGrading={isGrading}
          loading={story?.length < 10}
          loadComplete={loadStoryComplete}
          onGrade={onGrade}
          questions={questions}
          questionsButtonEnabled={questionsButtonEnabled}
          questionsLoadError={questionsLoadError}
          onLoadQuestions={onLoadQuestions}
          onSetDisplayedSection={onSetDisplayedSection}
          onSetUserChoiceObj={onSetUserChoiceObj}
          onScrollToTop={() => (MainRef.current.scrollTop = 0)}
          onReset={onReset}
          onSetSolveObj={onSetSolveObj}
          questionsLoaded={questionsLoaded}
          solveObj={solveObj}
          story={story}
          storyId={storyId}
          userChoiceObj={userChoiceObj}
        />
      )}
    </div>
  );
}
