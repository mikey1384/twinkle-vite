import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import { useAppContext } from '~/contexts';
import Button from '~/components/Button';
import ContentContainer from './ContentContainer';
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
  const [hasError, setHasError] = useState(false);
  const [loading, setLoading] = useState(true);
  const loadedDifficulty = localStorage.getItem('story-difficulty');
  const [difficulty, setDifficulty] = useState(loadedDifficulty || 2);
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

  useEffect(() => {
    localStorage.setItem('story-difficulty', difficulty);
    loadTopic(difficulty);
    async function loadTopic(difficulty) {
      setLoadingTopic(true);
      const { topic, type } = await loadAIStoryTopic(difficulty);
      setTopic(topic);
      setStoryType(type);
      setLoadingTopic(false);
    }
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
      <main
        style={{
          height: '100%',
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
            loading={loading}
            loadingTopic={loadingTopic}
            loadComplete={loadComplete}
            storyObj={storyObj}
            questions={questions}
            onLoadQuestions={handleLoadQuestions}
            onScrollToTop={() => (MainRef.current.scrollTop = 0)}
            questionsLoaded={questionsLoaded}
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
            <GradientButton
              style={{ marginTop: '2rem' }}
              onClick={handleGenerateStory}
              loading={loadingTopic}
            >
              Generate a Story
            </GradientButton>
          </div>
        )}
        {generateButtonPressed && (
          <div
            style={{
              marginTop: hasError ? '1rem' : '20rem',
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
      const { storyObj } = await loadAIStory({
        difficulty,
        topic,
        type: storyType
      });
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

  async function handleLoadQuestions() {
    const questions = await loadAIStoryQuestions({
      difficulty,
      story: storyObj.story
    });
    setQuestions(questions);
    setQuestionsLoaded(true);
  }
}
