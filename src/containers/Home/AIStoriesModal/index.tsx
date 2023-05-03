import React, { useEffect, useRef, useState } from 'react';
import Modal from '~/components/Modal';
import { useAppContext } from '~/contexts';
import FilterBar from '~/components/FilterBar';
import Game from './Game';
import Rankings from './Rankings';

export default function AIStoriesModal({ onHide }: { onHide: () => void }) {
  const MainRef: React.RefObject<any> = useRef(null);
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
  const [loadingStory, setLoadingStory] = useState(false);
  const [storyObj, setStoryObj] = useState({});
  const [questions, setQuestions] = useState([]);
  const [questionsLoaded, setQuestionsLoaded] = useState(false);
  const [questionsLoadError, setQuestionsLoadError] = useState(false);
  const [userChoiceObj, setUserChoiceObj] = useState({});
  const loadAIStoryTopic = useAppContext(
    (v) => v.requestHelpers.loadAIStoryTopic
  );
  const [topic, setTopic] = useState('');
  const [topicKey, setTopicKey] = useState('');
  const [storyType, setStoryType] = useState('');
  const [loadingTopic, setLoadingTopic] = useState(false);
  const [topicLoadError, setTopicLoadError] = useState(false);
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

  return (
    <Modal
      closeWhenClickedOutside={
        !dropdownShown && (!loadStoryComplete || activeTab === 'rankings')
      }
      modalStyle={{
        height: '80vh'
      }}
      large
      onHide={onHide}
    >
      {(!generateButtonPressed || solveObj.isGraded) && (
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
            difficulty={difficulty}
            displayedSection={displayedSection}
            loadingStory={loadingStory}
            loadingTopic={loadingTopic}
            generateButtonPressed={generateButtonPressed}
            loadStoryComplete={loadStoryComplete}
            onHide={onHide}
            onLoadTopic={handleLoadTopic}
            onSetAttemptId={setAttemptId}
            onSetDropdownShown={setDropdownShown}
            onSetResetNumber={setResetNumber}
            onSetDifficulty={setDifficulty}
            onSetDisplayedSection={setDisplayedSection}
            onSetGenerateButtonPressed={setGenerateButtonPressed}
            onSetLoadingStory={setLoadingStory}
            onSetLoadStoryComplete={onSetLoadStoryComplete}
            onSetQuestions={setQuestions}
            onSetQuestionsLoaded={setQuestionsLoaded}
            onSetQuestionsLoadError={setQuestionsLoadError}
            onSetSolveObj={setSolveObj}
            onSetStoryLoadError={setStoryLoadError}
            onSetStoryObj={setStoryObj}
            onSetUserChoiceObj={setUserChoiceObj}
            onSetTopicLoadError={setTopicLoadError}
            questions={questions}
            questionsLoadError={questionsLoadError}
            questionsLoaded={questionsLoaded}
            solveObj={solveObj}
            storyObj={storyObj}
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
      const { topic, topicKey, type } = await tryLoadTopic({
        difficulty,
        retries: 3,
        timeout: 1000,
        currentRequestId
      });
      if (currentRequestId === requestRef.current) {
        setTopic(topic);
        setStoryType(type);
        setTopicKey(topicKey);
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
        const { topic, topicKey, type } = await loadAIStoryTopic(difficulty);
        if (currentRequestId === requestRef.current) {
          return { topic, topicKey, type };
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

  function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
