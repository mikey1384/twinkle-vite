import React, { useState, useEffect } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import SuccessText from './SuccessText';
import GradientButton from '~/components/Buttons/GradientButton';
import { Color } from '~/constants/css';
import { useAppContext, useKeyContext } from '~/contexts';
import { addCommasToNumber } from '~/helpers/stringHelpers';

const colorHash: Record<
  number,
  'default' | 'blue' | 'purple' | 'pink' | 'orange' | 'gold'
> = {
  1: 'blue',
  2: 'pink',
  3: 'orange',
  4: 'purple',
  5: 'gold'
};

export default function SuccessModal({
  difficulty,
  onHide,
  numQuestions,
  rewardTable,
  storyId
}: {
  difficulty: number;
  onHide: () => void;
  numQuestions: number;
  rewardTable: any;
  storyId: number;
}) {
  const [imageUrl, setImageUrl] = useState('');
  const {
    xpNumber: { color: xpNumberColor }
  } = useKeyContext((v) => v.theme);
  const generateAIStoryImage = useAppContext(
    (v) => v.requestHelpers.generateAIStoryImage
  );
  const [generatingImage, setGeneratingImage] = useState(false);
  const [buttonText, setButtonText] = useState('Generate Image');

  useEffect(() => {
    let interval: any;
    if (generatingImage) {
      let elapsedTime = 0;
      interval = setInterval(() => {
        elapsedTime += 1;
        if (elapsedTime < 15) {
          setButtonText('Generating... Please wait');
        } else if (elapsedTime < 30) {
          setButtonText('Almost there...');
        } else {
          setButtonText('Just a little longer...');
        }
      }, 1000);
    }

    return () => {
      clearInterval(interval);
    };
  }, [generatingImage]);

  return (
    <Modal wrapped closeWhenClickedOutside={false} onHide={onHide}>
      <header>Reading Cleared</header>
      <main>
        <SuccessText difficulty={difficulty} />
        <div style={{ marginTop: '3.5rem' }}>
          You answered {numQuestions} out of {numQuestions} question
          {numQuestions === 1 ? '' : 's'} correctly!
        </div>
        <div
          style={{
            marginTop: '1rem',
            marginBottom: '2rem',
            fontSize: difficulty > 3 ? '1.7rem' : '1.5rem'
          }}
        >
          You earned{' '}
          <b style={{ color: Color[xpNumberColor]() }}>
            {addCommasToNumber(rewardTable[difficulty].xp)}
          </b>{' '}
          <b style={{ color: Color.gold() }}>XP</b> and{' '}
          <b style={{ color: Color.brownOrange() }}>
            {addCommasToNumber(rewardTable[difficulty].coins)} coins
          </b>
        </div>
        <div
          style={{
            marginTop: imageUrl ? '1rem' : '2rem',
            marginBottom: imageUrl ? '1rem' : 0,
            width: '100%',
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          {imageUrl ? (
            <img
              style={{
                width: '100%',
                maxHeight: '50vh',
                objectFit: 'contain'
              }}
              src={imageUrl}
              alt="Generated Story Image"
            />
          ) : (
            <GradientButton
              theme={colorHash[difficulty] || 'default'}
              loading={generatingImage}
              onClick={handleGenerateImage}
              fontSize="1.5rem"
              mobileFontSize="1.1rem"
            >
              {buttonText}
            </GradientButton>
          )}
        </div>
      </main>
      <footer>
        <Button transparent style={{ marginRight: '0.7rem' }} onClick={onHide}>
          Close
        </Button>
      </footer>
    </Modal>
  );

  async function handleGenerateImage() {
    setGeneratingImage(true);
    setButtonText('Generating... Please wait');
    try {
      const imageUrl = await generateAIStoryImage(storyId);
      setImageUrl(imageUrl);
    } catch (error) {
      console.error(error);
    } finally {
      setGeneratingImage(false);
    }
  }
}
