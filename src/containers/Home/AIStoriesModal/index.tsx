import React, { useEffect, useRef, useState } from 'react';
import Modal from '~/components/Modal';
import { useAppContext } from '~/contexts';
import FilterBar from '~/components/FilterBar';
import Game from './Game';
import Rankings from './Rankings';
import { socket } from '~/constants/io';

export default function AIStoriesModal({ onHide }: { onHide: () => void }) {
  const MainRef: React.RefObject<any> = useRef(null);
  const finishedStoryIdRef = useRef(0);
  const [solveObj, setSolveObj] = useState({
    numCorrect: 0,
    isGraded: false
  });
  const [resetNumber, setResetNumber] = useState(0);
  const [activeTab, setActiveTab] = useState('game');
  const [displayedSection, setDisplayedSection] = useState('story');
  const [rankingsTab, setRankingsTab] = useState('all');
  const [attemptId, setAttemptId] = useState(0);
  const loadedDifficulty = localStorage.getItem('story-difficulty');
  const [difficulty, setDifficulty] = useState(Number(loadedDifficulty) || 3);
  const [loadStoryComplete, onSetLoadStoryComplete] = useState(false);
  const [dropdownShown, setDropdownShown] = useState(false);
  const [generateButtonPressed, setGenerateButtonPressed] = useState(false);
  const [storyLoadError, setStoryLoadError] = useState(false);
  const [questionsButtonEnabled, setQuestionsButtonEnabled] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [questionsLoaded, setQuestionsLoaded] = useState(false);
  const [questionsLoadError, setQuestionsLoadError] = useState(false);
  const [userChoiceObj, setUserChoiceObj] = useState({});
  const loadAIStoryTopic = useAppContext(
    (v) => v.requestHelpers.loadAIStoryTopic
  );
  const loadAIStoryQuestions = useAppContext(
    (v) => v.requestHelpers.loadAIStoryQuestions
  );
  const [imageGeneratedCount, setImageGeneratedCount] = useState(0);
  const [topic, setTopic] = useState('');
  const [topicKey, setTopicKey] = useState('');
  const [explanation, setExplanation] = useState('');
  const [storyId, setStoryId] = useState(0);
  const [story, setStory] = useState('');
  const [storyType, setStoryType] = useState('');
  const [loadingTopic, setLoadingTopic] = useState(false);
  const [topicLoadError, setTopicLoadError] = useState(false);
  const [usermenuShown, setUsermenuShown] = useState(false);
  const requestRef: React.MutableRefObject<any> = useRef(null);

  useEffect(() => {
    localStorage.setItem('story-difficulty', String(difficulty));
    const currentRequestId = Math.random();
    requestRef.current = currentRequestId;
    if (difficulty && currentRequestId) {
      handleLoadTopic({ difficulty, currentRequestId });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty, resetNumber]);

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
    <Modal
      closeWhenClickedOutside={
        !dropdownShown && (!loadStoryComplete || activeTab === 'rankings')
      }
      modalStyle={{
        height: '80vh'
      }}
      large
      onHide={handleHide}
    >
      {(!generateButtonPressed || solveObj.isGraded || storyLoadError) && (
        <header style={{ padding: 0 }}>
          <FilterBar
            style={{
              height: '6rem',
              marginBottom: 0
            }}
          >
            <nav
              className={activeTab === 'game' ? 'active' : ''}
              onClick={() => setActiveTab('game')}
            >
              Game
            </nav>
            <nav
              className={activeTab === 'rankings' ? 'active' : ''}
              onClick={() => setActiveTab('rankings')}
            >
              Rankings
            </nav>
          </FilterBar>
        </header>
      )}
      <main
        style={{
          height: '100%',
          padding: 0,
          overflow: 'scroll',
          justifyContent: 'flex-start',
          alignItems: 'center'
        }}
        ref={MainRef}
      >
        {activeTab === 'game' && (
          <Game
            attemptId={attemptId}
            explanation={explanation}
            difficulty={difficulty}
            displayedSection={displayedSection}
            imageGeneratedCount={imageGeneratedCount}
            loadingTopic={loadingTopic}
            generateButtonPressed={generateButtonPressed}
            loadStoryComplete={loadStoryComplete}
            onHide={handleHide}
            onLoadQuestions={handleLoadQuestions}
            onLoadTopic={handleLoadTopic}
            onSetAttemptId={setAttemptId}
            onSetDropdownShown={setDropdownShown}
            onSetResetNumber={setResetNumber}
            onSetDifficulty={setDifficulty}
            onSetDisplayedSection={setDisplayedSection}
            onSetExplanation={setExplanation}
            onSetGenerateButtonPressed={setGenerateButtonPressed}
            onSetLoadStoryComplete={onSetLoadStoryComplete}
            onSetQuestions={setQuestions}
            onSetQuestionsButtonEnabled={setQuestionsButtonEnabled}
            onSetQuestionsLoaded={setQuestionsLoaded}
            onSetQuestionsLoadError={setQuestionsLoadError}
            onSetSolveObj={setSolveObj}
            onSetStory={setStory}
            onSetStoryId={setStoryId}
            onSetStoryLoadError={setStoryLoadError}
            onSetUserChoiceObj={setUserChoiceObj}
            onSetTopicLoadError={setTopicLoadError}
            questions={questions}
            questionsLoadError={questionsLoadError}
            questionsButtonEnabled={questionsButtonEnabled}
            questionsLoaded={questionsLoaded}
            story={story}
            storyId={storyId}
            solveObj={solveObj}
            userChoiceObj={userChoiceObj}
            MainRef={MainRef}
            storyLoadError={storyLoadError}
            storyType={storyType}
            topic={topic}
            topicKey={topicKey}
            topicLoadError={topicLoadError}
          />
        )}
        {activeTab === 'rankings' && (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            <Rankings
              onSetRankingsTab={setRankingsTab}
              onSetUsermenuShown={setUsermenuShown}
              rankingsTab={rankingsTab}
            />
          </div>
        )}
      </main>
    </Modal>
  );

  async function handleLoadTopic({
    difficulty,
    currentRequestId
  }: {
    difficulty: number;
    currentRequestId: number;
  }) {
    setLoadingTopic(true);
    try {
      const { topic, topicKey, type, imageGeneratedCount } = await tryLoadTopic(
        {
          difficulty,
          retries: 3,
          timeout: 1000,
          currentRequestId
        }
      );
      if (currentRequestId === requestRef.current) {
        setTopic(topic);
        setStoryType(type);
        setTopicKey(topicKey);
        setImageGeneratedCount(imageGeneratedCount);
        setLoadingTopic(false);
      }
    } catch (error) {
      console.error('Failed to load topic:', error);
      setTopicLoadError(true);
    }
  }

  async function tryLoadTopic({
    difficulty,
    retries,
    timeout,
    currentRequestId
  }: {
    difficulty: number;
    retries: number;
    timeout: number;
    currentRequestId: number;
  }) {
    for (let i = 0; i < retries; i++) {
      try {
        const { topic, topicKey, type, imageGeneratedCount } =
          await loadAIStoryTopic(difficulty);
        if (currentRequestId === requestRef.current) {
          return { topic, topicKey, type, imageGeneratedCount };
        } else {
          return {};
        }
      } catch (error) {
        console.error(`Error on attempt ${i + 1}:`, error);
        if (i < retries - 1) {
          await sleep(timeout);
        }
      }
    }
    throw new Error('Failed to load topic after maximum retries');
  }

  async function handleHide() {
    if (!usermenuShown) onHide();
  }

  async function handleLoadQuestions() {
    setQuestionsLoadError(false);
    if (questionsLoaded) return;
    try {
      const questions = await loadAIStoryQuestions({
        story,
        storyId
      });
      setQuestions(questions);
      setQuestionsLoaded(true);
    } catch (error) {
      console.error(error);
      setQuestionsLoadError(true);
    }
  }

  function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
