import React, { useEffect, useRef, useState } from 'react';
import GradientButton from '~/components/Buttons/GradientButton';
import ContentContainer from './ContentContainer';
import { socket } from '~/constants/sockets/api';
import { useAppContext, useKeyContext } from '~/contexts';
import { trackEvent } from '~/helpers/analytics';
import { waitForSocketAuthReady } from '~/helpers/socketAuthReady';

const STORY_GENERATION_ACCEPT_TIMEOUT_MS = 10000;

interface AIStoryGenerationAck {
  accepted: boolean;
  error?: string;
}

type AIStoryRequestEvent =
  'generate_ai_story' | 'generate_ai_story_explanations';

function emitAIStoryRequestWithAck(
  event: AIStoryRequestEvent,
  payload: Record<string, unknown>
) {
  return new Promise<void>((resolve, reject) => {
    socket
      .timeout(STORY_GENERATION_ACCEPT_TIMEOUT_MS)
      .emit(
        event,
        payload,
        (timeoutError: Error | null, result?: AIStoryGenerationAck) => {
          if (timeoutError) {
            reject(new Error('AI Story request was not accepted'));
            return;
          }
          if (!result?.accepted) {
            reject(new Error(result?.error || 'AI Story request was rejected'));
            return;
          }
          resolve();
        }
      );
  });
}

export default function Reading({
  difficulty,
  displayedSection,
  explanation,
  isDisabled,
  isGrading,
  loadStoryComplete,
  MainRef,
  onLoadQuestions,
  onGrade,
  onOpenSuccessModal,
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
  isDisabled: boolean;
  isGrading: boolean;
  loadStoryComplete: boolean;
  MainRef: React.RefObject<any>;
  onLoadQuestions: (storyId: number) => void;
  onGrade: () => void;
  onOpenSuccessModal: () => void;
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
  const userId = useKeyContext((v) => v.myState.userId);
  const loadAIStory = useAppContext((v) => v.requestHelpers.loadAIStory);
  const [storyLoadError, setStoryLoadError] = useState(false);

  useEffect(() => {
    if (!solveObj.isGraded && !isDisabled && userId) {
      handleGenerateStory();
    }

    async function handleGenerateStory() {
      setStoryLoadError(false);
      try {
        await waitForSocketAuthReady(
          userId,
          STORY_GENERATION_ACCEPT_TIMEOUT_MS
        );
        const { attemptId: newAttemptId, storyObj } = await loadAIStory({
          difficulty,
          topic,
          topicKey,
          type: storyType
        });
        onSetAttemptId(newAttemptId);
        onSetStoryId(storyObj.id);
        trackEvent('ai_story_start', {
          difficulty,
          story_type: storyType
        });
        onSetStory(storyObj.story);
        onSetExplanation(storyObj.explanation);
        onSetLoadStoryComplete(true);
        onSetIsCloseLocked(true);
        await emitAIStoryRequestWithAck('generate_ai_story', {
          difficulty,
          topic,
          type: storyType,
          storyId: storyObj.id
        });
      } catch (error) {
        console.error(error);
        onSetIsCloseLocked(false);
        setStoryLoadError(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solveObj?.isGraded, userId]);

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

    async function handleAIStoryFinished(streamedStoryId: number) {
      if (
        streamedStoryId === storyId &&
        finishedStoryIdRef.current !== streamedStoryId
      ) {
        finishedStoryIdRef.current = streamedStoryId;
        onLoadQuestions(streamedStoryId);
        try {
          await waitForSocketAuthReady(
            userId,
            STORY_GENERATION_ACCEPT_TIMEOUT_MS
          );
          await emitAIStoryRequestWithAck('generate_ai_story_explanations', {
            storyId: Number(streamedStoryId),
            difficulty
          });
        } catch (error) {
          console.error('Failed to start AI Story explanations:', error);
          onSetQuestionsButtonEnabled(true);
        }
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
      const failedStoryId = Number(
        error && typeof error === 'object' ? error.storyId : error
      );
      if (failedStoryId && failedStoryId !== storyId) return;
      console.error('Error while streaming AI Story:', error);
      onSetIsCloseLocked(false);
      setStoryLoadError(true);
    }

    function handleAIStoryExplanationError() {
      onSetQuestionsButtonEnabled(true);
    }

    return function cleanUp() {
      socket.off('ai_story_updated', handleAIStoryUpdated);
      socket.off('ai_story_finished', handleAIStoryFinished);
      socket.off(
        'ai_story_explanation_updated',
        handleAIStoryExplanationUpdated
      );
      socket.off(
        'ai_story_explanation_finished',
        handleAIStoryExplanationFinished
      );
      socket.off('ai_story_story_error', handleAIStoryError);
      socket.off('ai_story_explanation_error', handleAIStoryExplanationError);
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
          onOpenSuccessModal={onOpenSuccessModal}
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
