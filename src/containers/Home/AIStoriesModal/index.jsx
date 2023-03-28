import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import { useAppContext } from '~/contexts';
import Button from '~/components/Button';
import ContentContainer from './ContentContainer';
import FilterBar from '~/components/FilterBar';
import DropdownButton from '~/components/Buttons/DropdownButton';
import GradientButton from '~/components/Buttons/GradientButton';

AIStoriesModal.propTypes = {
  onHide: PropTypes.func.isRequired
};

const levelHash = {
  1: 'Level 1',
  2: 'Level 2',
  3: 'Level 3',
  4: 'Level 4',
  5: 'Level 5'
};

export default function AIStoriesModal({ onHide }) {
  const MainRef = useRef();
  const [activeTab, setActiveTab] = useState('game');
  const [hasError, setHasError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attemptId, setAttemptId] = useState(null);
  const loadedDifficulty = localStorage.getItem('story-difficulty');
  const [difficulty, setDifficulty] = useState(loadedDifficulty || 3);
  const [loadComplete, setLoadComplete] = useState(false);
  const [dropdownShown, setDropdownShown] = useState(false);
  const [generateButtonPressed, setGenerateButtonPressed] = useState(false);
  const loadAIStoryTopic = useAppContext(
    (v) => v.requestHelpers.loadAIStoryTopic
  );
  const loadAIStoryQuestions = useAppContext(
    (v) => v.requestHelpers.loadAIStoryQuestions
  );
  const loadAIStory = useAppContext((v) => v.requestHelpers.loadAIStory);
  const [storyObj, setStoryObj] = useState({});
  const [topic, setTopic] = useState('');
  const [storyType, setStoryType] = useState('');
  const [loadingTopic, setLoadingTopic] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [questionsLoaded, setQuestionsLoaded] = useState(false);
  const [topicLoadError, setTopicLoadError] = useState(false);

  useEffect(() => {
    localStorage.setItem('story-difficulty', difficulty);
    handleLoadTopic(difficulty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);

  return (
    <Modal
      closeWhenClickedOutside={!dropdownShown && !loadComplete}
      modalStyle={{
        height: '80vh'
      }}
      large
      onHide={onHide}
    >
      {false && !generateButtonPressed && (
        <header style={{ height: '3rem', padding: 0 }}>
          <FilterBar
            style={{
              marginTop: '3rem',
              height: '6rem'
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
          marginTop: '1.5rem',
          margin: '1rem',
          overflow: 'scroll',
          justifyContent: 'flex-start',
          alignItems: 'center'
        }}
        ref={MainRef}
      >
        {hasError ? (
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
              onClick={handleGenerateStory}
            >
              Retry
            </GradientButton>
          </div>
        ) : generateButtonPressed ? (
          <ContentContainer
            attemptId={attemptId}
            difficulty={Number(difficulty)}
            loading={loading}
            loadingTopic={loadingTopic}
            loadComplete={loadComplete}
            storyObj={storyObj}
            questions={questions}
            onLoadQuestions={handleLoadQuestions}
            onScrollToTop={() => (MainRef.current.scrollTop = 0)}
            questionsLoaded={questionsLoaded}
            onReset={handleReset}
          />
        ) : (
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
            <DropdownButton
              skeuomorphic
              color="darkerGray"
              icon="caret-down"
              text={levelHash[difficulty]}
              onDropdownShown={setDropdownShown}
              menuProps={[
                {
                  label: levelHash[1],
                  onClick: () => setDifficulty(1)
                },
                {
                  label: levelHash[2],
                  onClick: () => setDifficulty(2)
                },
                {
                  label: levelHash[3],
                  onClick: () => setDifficulty(3)
                },
                {
                  label: levelHash[4],
                  onClick: () => setDifficulty(4)
                },
                {
                  label: levelHash[5],
                  onClick: () => setDifficulty(5)
                }
              ]}
            />
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
                    setTopicLoadError(false);
                    handleLoadTopic(difficulty);
                  }}
                >
                  Retry
                </GradientButton>
              </div>
            ) : (
              <GradientButton
                style={{ marginTop: '2rem' }}
                onClick={handleGenerateStory}
                loading={loadingTopic}
              >
                Generate a Story
              </GradientButton>
            )}
          </div>
        )}
        {generateButtonPressed && (
          <div
            style={{
              marginTop: hasError ? '3rem' : '15rem',
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            <Button transparent onClick={onHide}>
              close
            </Button>
          </div>
        )}
      </main>
    </Modal>
  );

  async function handleGenerateStory() {
    setHasError(false);
    setGenerateButtonPressed(true);
    setLoading(true);
    try {
      const { attemptId: newAttemptId, storyObj } = await loadAIStory({
        difficulty,
        topic,
        type: storyType
      });
      setAttemptId(newAttemptId);
      setStoryObj(storyObj);
      setLoadComplete(true);
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error(error);
      setHasError(true);
    } finally {
      setLoading(false);
    }
  }

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

  async function handleLoadQuestions() {
    if (questionsLoaded) return;
    const questions = await loadAIStoryQuestions({
      difficulty,
      story: storyObj.story,
      storyId: storyObj.id
    });
    setQuestions(questions);
    setQuestionsLoaded(true);
  }

  function handleReset() {
    setLoadComplete(false);
    setQuestionsLoaded(false);
    setQuestions([]);
    setGenerateButtonPressed(false);
  }
}
