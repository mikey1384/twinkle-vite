import React, { useEffect, useRef, useState } from 'react';
import GradientButton from '~/components/Buttons/GradientButton';
import ContentContainer from './ContentContainer';
import { socket } from '~/constants/io';
import { useAppContext } from '~/contexts';

export default function Reading({
  attemptId,
  difficulty,
  displayedSection,
  imageGeneratedCount,
  MainRef,
  onSetAttemptId,
  onSetDisplayedSection,
  onSetIsCloseLocked,
  onSetIsGameStarted,
  onSetResetNumber,
  onSetStory,
  storyType,
  topic,
  topicKey
}: {
  attemptId: number;
  difficulty: number;
  displayedSection: string;
  imageGeneratedCount: number;
  loadStoryComplete: boolean;
  MainRef: React.RefObject<any>;
  onSetAttemptId: (v: number) => void;
  onSetDisplayedSection: (v: string) => void;
  onSetIsCloseLocked: (v: boolean) => void;
  onSetIsGameStarted: (v: boolean) => void;
  onSetResetNumber: (v: any) => void;
  onSetStory: (v: string) => void;
  storyType: string;
  topic: string;
  topicKey: string;
}) {
  const finishedStoryIdRef = useRef(0);
  const loadAIStory = useAppContext((v) => v.requestHelpers.loadAIStory);
  const loadAIStoryQuestions = useAppContext(
    (v) => v.requestHelpers.loadAIStoryQuestions
  );
  const [solveObj, setSolveObj] = useState({
    numCorrect: 0,
    isGraded: false
  });
  const [explanation, setExplanation] = useState('');
  const [storyLoadError, setStoryLoadError] = useState(false);
  const [storyId, setStoryId] = useState(0);
  const [loadStoryComplete, setLoadStoryComplete] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [questionsLoadError, setQuestionsLoadError] = useState(false);
  const [questionsButtonEnabled, setQuestionsButtonEnabled] = useState(false);
  const [questionsLoaded, setQuestionsLoaded] = useState(false);
  const [story, setStory] = useState('');
  const [userChoiceObj, setUserChoiceObj] = useState({});

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
        setStoryId(storyObj.id);
        onSetStory(storyObj.story);
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
        handleLoadQuestions();
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
      setQuestionsButtonEnabled(true);
    }

    function handleAIStoryError(error: any) {
      console.error(`Error while streaming AI Story: ${error}`);
    }

    function handleAIStoryExplanationError() {
      setQuestionsButtonEnabled(true);
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
          onLoadQuestions={handleLoadQuestions}
          onSetDisplayedSection={onSetDisplayedSection}
          onSetUserChoiceObj={setUserChoiceObj}
          onScrollToTop={() => (MainRef.current.scrollTop = 0)}
          onReset={handleReset}
          onSetSolveObj={setSolveObj}
          questionsLoaded={questionsLoaded}
          solveObj={solveObj}
          story={story}
          storyId={storyId}
          userChoiceObj={userChoiceObj}
        />
      )}
    </div>
  );

  async function handleLoadQuestions() {
    setQuestionsLoadError(false);
    if (questionsLoaded) return;
    try {
      const questions = await loadAIStoryQuestions(storyId);
      setQuestions(questions);
      setQuestionsLoaded(true);
    } catch (error) {
      console.error(error);
      setQuestionsLoadError(true);
    }
  }

  function handleReset() {
    onSetResetNumber((prevNumber: number) => prevNumber + 1);
    setStoryId(0);
    onSetStory('');
    setExplanation('');
    setLoadStoryComplete(false);
    onSetIsCloseLocked(false);
    setQuestionsLoaded(false);
    setQuestionsButtonEnabled(false);
    setQuestions([]);
    onSetDisplayedSection('story');
    setUserChoiceObj({});
    setSolveObj({
      numCorrect: 0,
      isGraded: false
    });
    onSetIsGameStarted(false);
  }
}
