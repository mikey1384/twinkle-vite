import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import { useAppContext } from '~/contexts';
import Button from '~/components/Button';
import ContentGenerator from './ContentGenerator';
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
  const [loading, setLoading] = useState(true);
  const loadedDifficulty = localStorage.getItem('story-difficulty');
  const [difficulty, setDifficulty] = useState(loadedDifficulty || 2);
  const [loadComplete, setLoadComplete] = useState(false);
  const [dropdownShown, setDropdownShown] = useState(false);
  const [generateButtonPressed, setGenerateButtonPressed] = useState(false);
  const loadAIStory = useAppContext((v) => v.requestHelpers.loadAIStory);
  const [storyObj, setStoryObj] = useState({});

  useEffect(() => {
    localStorage.setItem('story-difficulty', difficulty);
  }, [difficulty]);

  return (
    <Modal
      closeWhenClickedOutside={!dropdownShown}
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
          scrollBehavior: 'smooth',
          justifyContent: 'flex-start',
          alignItems: 'center'
        }}
      >
        {generateButtonPressed ? (
          <ContentGenerator
            loading={loading}
            loadComplete={loadComplete}
            storyObj={storyObj}
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
              onClick={handleGenerate}
            >
              Generate a Story
            </GradientButton>
          </div>
        )}
        {generateButtonPressed && (
          <div
            style={{
              marginTop: '20rem',
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

  async function handleGenerate() {
    setGenerateButtonPressed(true);
    setLoading(true);
    const { storyObj } = await loadAIStory(difficulty);
    setStoryObj(storyObj);
    setLoadComplete(true);
    await new Promise((resolve) => setTimeout(resolve, 100));
    setLoading(false);
  }
}
