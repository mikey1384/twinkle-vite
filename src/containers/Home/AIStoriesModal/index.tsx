import React, { useEffect, useRef, useState } from 'react';
import Modal from '~/components/Modal';
import FilterBar from '~/components/FilterBar';
import Game from './Game';
import Rankings from './Rankings';
import Button from '~/components/Button';
import SuccessModal from './SuccessModal';
import { useAppContext } from '~/contexts';

const rewardTable = {
  1: {
    xp: 500,
    coins: 25
  },
  2: {
    xp: 1000,
    coins: 50
  },
  3: {
    xp: 2500,
    coins: 75
  },
  4: {
    xp: 5000,
    coins: 150
  },
  5: {
    xp: 10000,
    coins: 200
  }
};

export default function AIStoriesModal({ onHide }: { onHide: () => void }) {
  const MainRef: React.RefObject<any> = useRef(null);
  const [resetNumber, setResetNumber] = useState(0);
  const [activeTab, setActiveTab] = useState('game');
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [displayedSection, setDisplayedSection] = useState('story');
  const [rankingsTab, setRankingsTab] = useState('all');
  const [attemptId, setAttemptId] = useState(0);
  const loadedDifficulty = localStorage.getItem('story-difficulty');
  const [difficulty, setDifficulty] = useState(Number(loadedDifficulty) || 3);
  const [dropdownShown, setDropdownShown] = useState(false);
  const loadAIStoryTopic = useAppContext(
    (v) => v.requestHelpers.loadAIStoryTopic
  );
  const [imageGeneratedCount, setImageGeneratedCount] = useState(0);
  const [readCount, setReadCount] = useState(0);
  const [questions, setQuestions] = useState<any[]>([]);
  const [topic, setTopic] = useState('');
  const [topicKey, setTopicKey] = useState('');
  const [successModalShown, setSuccessModalShown] = useState(false);
  const [storyId, setStoryId] = useState(0);
  const [storyType, setStoryType] = useState('');
  const [loadingTopic, setLoadingTopic] = useState(false);
  const [topicLoadError, setTopicLoadError] = useState(false);
  const [usermenuShown, setUsermenuShown] = useState(false);
  const [isCloseLocked, setIsCloseLocked] = useState(false);
  const [gameMode, setGameMode] = useState('read');
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
        !dropdownShown && (!isCloseLocked || activeTab === 'rankings')
      }
      modalStyle={{
        height: '80vh'
      }}
      wrapped
      large
      onHide={handleHide}
    >
      {!isGameStarted && (
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
            difficulty={Number(difficulty)}
            displayedSection={displayedSection}
            gameMode={gameMode}
            isGameStarted={isGameStarted}
            onSetIsGameStarted={setIsGameStarted}
            loadingTopic={loadingTopic}
            onLoadTopic={handleLoadTopic}
            onSetAttemptId={setAttemptId}
            onSetDropdownShown={setDropdownShown}
            onSetGameMode={setGameMode}
            onSetResetNumber={setResetNumber}
            onSetStoryId={setStoryId}
            onSetDifficulty={setDifficulty}
            onSetDisplayedSection={setDisplayedSection}
            onSetIsCloseLocked={setIsCloseLocked}
            onSetQuestions={setQuestions}
            onSetSuccessModalShown={setSuccessModalShown}
            onSetTopicLoadError={setTopicLoadError}
            readCount={readCount}
            questions={questions}
            storyId={storyId}
            MainRef={MainRef}
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
      <footer style={{ justifyContent: 'center' }}>
        <Button transparent onClick={onHide}>
          Close
        </Button>
      </footer>
      {successModalShown && (
        <SuccessModal
          imageGeneratedCount={imageGeneratedCount}
          isListening={gameMode === 'listen'}
          onHide={() => setSuccessModalShown(false)}
          numQuestions={questions.length}
          difficulty={difficulty}
          rewardTable={rewardTable}
          storyId={storyId}
        />
      )}
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
      const { topic, topicKey, type, imageGeneratedCount, readCount } =
        await tryLoadTopic({
          difficulty,
          retries: 3,
          timeout: 1000,
          currentRequestId
        });
      if (currentRequestId === requestRef.current) {
        setTopic(topic);
        setStoryType(type);
        setTopicKey(topicKey);
        setImageGeneratedCount(imageGeneratedCount);
        setReadCount(readCount);
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
        const { topic, topicKey, type, imageGeneratedCount, readCount } =
          await loadAIStoryTopic(difficulty);
        if (currentRequestId === requestRef.current) {
          return { topic, topicKey, type, imageGeneratedCount, readCount };
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

  function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
