import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import { useAppContext } from '~/contexts';
import FilterBar from '~/components/FilterBar';
import Game from './Game';
import Rankings from './Rankings';

AIStoriesModal.propTypes = {
  onHide: PropTypes.func.isRequired
};

export default function AIStoriesModal({ onHide }) {
  const MainRef = useRef();
  const [solveObj, setSolveObj] = useState({
    numCorrect: 0,
    isGraded: false
  });
  const [resetNumber, setResetNumber] = useState(0);
  const [activeTab, setActiveTab] = useState('game');
  const [rankingsTab, setRankingsTab] = useState('all');
  const [attemptId, setAttemptId] = useState(null);
  const loadedDifficulty = localStorage.getItem('story-difficulty');
  const [difficulty, setDifficulty] = useState(Number(loadedDifficulty) || 3);
  const [loadStoryComplete, onSetLoadStoryComplete] = useState(false);
  const [dropdownShown, setDropdownShown] = useState(false);
  const [generateButtonPressed, setGenerateButtonPressed] = useState(false);
  const loadAIStoryTopic = useAppContext(
    (v) => v.requestHelpers.loadAIStoryTopic
  );
  const [topic, setTopic] = useState('');
  const [storyType, setStoryType] = useState('');
  const [loadingTopic, setLoadingTopic] = useState(false);
  const [topicLoadError, setTopicLoadError] = useState(false);

  useEffect(() => {
    localStorage.setItem('story-difficulty', difficulty);
    handleLoadTopic(difficulty);
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
              className={activeTab === 'game' ? 'active' : null}
              onClick={() => setActiveTab('game')}
            >
              Game
            </nav>
            <nav
              className={activeTab === 'rankings' ? 'active' : null}
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
            loadingTopic={loadingTopic}
            generateButtonPressed={generateButtonPressed}
            loadStoryComplete={loadStoryComplete}
            onHide={onHide}
            onLoadTopic={handleLoadTopic}
            onSetAttemptId={setAttemptId}
            onSetDropdownShown={setDropdownShown}
            onSetResetNumber={setResetNumber}
            onSetDifficulty={setDifficulty}
            onSetGenerateButtonPressed={setGenerateButtonPressed}
            onSetLoadStoryComplete={onSetLoadStoryComplete}
            onSetSolveObj={setSolveObj}
            onSetTopicLoadError={setTopicLoadError}
            solveObj={solveObj}
            MainRef={MainRef}
            storyType={storyType}
            topic={topic}
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

  async function handleLoadTopic(difficulty) {
    setLoadingTopic(true);
    try {
      const { topic, type } = await tryLoadTopic(difficulty, 3, 1000);
      setTopic(topic);
      setStoryType(type);
    } catch (error) {
      console.error('Failed to load topic:', error);
      setTopicLoadError(true);
    } finally {
      setLoadingTopic(false);
    }

    async function tryLoadTopic(difficulty, retries, timeout) {
      for (let i = 0; i < retries; i++) {
        try {
          const { topic, type } = await loadAIStoryTopic(difficulty);
          return { topic, type };
        } catch (error) {
          console.error(`Error on attempt ${i + 1}:`, error);
          if (i < retries - 1) {
            await sleep(timeout);
          }
        }
      }
      throw new Error('Failed to load topic after maximum retries');
      function sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }
    }
  }
}
