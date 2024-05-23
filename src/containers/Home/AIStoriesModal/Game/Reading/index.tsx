import React, { useEffect, useRef, useState } from 'react';
import GradientButton from '~/components/Buttons/GradientButton';
import ContentContainer from './ContentContainer';
import { socket } from '~/constants/io';
import { useAppContext } from '~/contexts';

export default function Reading({
  difficulty,
  displayedSection,
  isGrading,
  MainRef,
  onLoadQuestions,
  onGrade,
  onSetAttemptId,
  onSetDisplayedSection,
  onSetIsCloseLocked,
  onSetIsGameStarted,
  onSetQuestions,
  onSetQuestionsLoaded,
  onSetQuestionsButtonEnabled,
  onSetResetNumber,
  onSetSolveObj,
  onSetStoryId,
  onSetUserChoiceObj,
  questions,
  questionsButtonEnabled,
  questionsLoaded,
  questionsLoadError,
  solveObj,
  storyId,
  storyType,
  topic,
  topicKey,
  userChoiceObj
}: {
  attemptId: number;
  difficulty: number;
  displayedSection: string;
  isGrading: boolean;
  MainRef: React.RefObject<any>;
  onLoadQuestions: (storyId: number) => void;
  onGrade: () => void;
  onSetAttemptId: (v: number) => void;
  onSetDisplayedSection: (v: string) => void;
  onSetIsCloseLocked: (v: boolean) => void;
  onSetIsGameStarted: (v: boolean) => void;
  onSetQuestions: (v: any) => void;
  onSetQuestionsLoaded: (v: boolean) => void;
  onSetQuestionsButtonEnabled: (v: boolean) => void;
  onSetResetNumber: (v: any) => void;
  onSetSolveObj: (v: any) => void;
  onSetStoryId: (v: number) => void;
  onSetUserChoiceObj: (v: any) => void;
  questions: any[];
  questionsButtonEnabled: boolean;
  questionsLoaded: boolean;
  questionsLoadError: boolean;
  solveObj: any;
  storyId: number;
  storyType: string;
  topic: string;
  topicKey: string;
  userChoiceObj: any;
}) {
  const finishedStoryIdRef = useRef(0);
  const loadAIStory = useAppContext((v) => v.requestHelpers.loadAIStory);
  const [explanation, setExplanation] = useState('');
  const [storyLoadError, setStoryLoadError] = useState(false);
  const [loadStoryComplete, setLoadStoryComplete] = useState(false);
  const [story, setStory] = useState('');

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
        setStory(storyObj.story);
        setExplanation(storyObj.explanation);
        setLoadStoryComplete(true);
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
        setStory(story);
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
        setExplanation(explanation);
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
                onClick={() => handleReset()}
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
          onReset={handleReset}
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

  function handleReset() {
    onSetResetNumber((prevNumber: number) => prevNumber + 1);
    onSetStoryId(0);
    setStory('');
    setExplanation('');
    setLoadStoryComplete(false);
    onSetIsCloseLocked(false);
    onSetQuestionsLoaded(false);
    onSetQuestionsButtonEnabled(false);
    onSetQuestions([]);
    onSetDisplayedSection('story');
    onSetUserChoiceObj({});
    onSetSolveObj({
      numCorrect: 0,
      isGraded: false
    });
    onSetIsGameStarted(false);
  }
}
