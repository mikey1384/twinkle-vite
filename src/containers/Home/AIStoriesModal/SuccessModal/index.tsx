import React, { useMemo, useState, useEffect } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import SuccessText from './SuccessText';
import GradientButton from '~/components/Buttons/GradientButton';
import Input from '~/components/Texts/Input';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useAppContext, useKeyContext } from '~/contexts';
import { addCommasToNumber, truncateText } from '~/helpers/stringHelpers';

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
const defaultButtonText = 'Generate Image';

export default function SuccessModal({
  difficulty,
  isListening,
  imageGeneratedCount,
  onHide,
  numQuestions,
  rewardTable,
  storyId
}: {
  difficulty: number;
  isListening: boolean;
  imageGeneratedCount: number;
  onHide: () => void;
  numQuestions: number;
  rewardTable: any;
  storyId: number;
}) {
  const { userId, twinkleCoins } = useKeyContext((v) => v.myState);
  const [imageUrl, setImageUrl] = useState('');
  const {
    xpNumber: { color: xpNumberColor }
  } = useKeyContext((v) => v.theme);
  const generateAIStoryImage = useAppContext(
    (v) => v.requestHelpers.generateAIStoryImage
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [inputError, setInputError] = useState('');
  const [styleText, setStyleText] = useState('');
  const [buttonText, setButtonText] = useState(defaultButtonText);

  useEffect(() => {
    let interval: any;

    if (generatingImage) {
      let elapsedTime = 0;
      let dotCount = 0;

      const updateButtonText = () => {
        if (elapsedTime < 20) {
          setButtonText(
            `Generating... Please wait${'.'.repeat(dotCount)}${' '.repeat(
              3 - dotCount
            )}`
          );
        } else if (elapsedTime < 40) {
          setButtonText(
            `Almost there${'.'.repeat(dotCount)}${' '.repeat(3 - dotCount)}`
          );
        } else {
          setButtonText(
            `Just a little longer${'.'.repeat(dotCount)}${' '.repeat(
              3 - dotCount
            )}`
          );
        }
      };

      updateButtonText(); // Initial text update

      interval = setInterval(() => {
        elapsedTime += 1;
        dotCount = (dotCount + 1) % 4;
        updateButtonText();
      }, 500);
    }

    return () => {
      clearInterval(interval);
    };
  }, [generatingImage]);

  const imageGenerationCost = useMemo(() => {
    if (imageGeneratedCount === 0) {
      return 0;
    } else if (imageGeneratedCount <= 2) {
      return 100;
    } else {
      return 1000;
    }
  }, [imageGeneratedCount]);

  const canGenerateImage = useMemo(() => {
    if (imageGeneratedCount === 0) {
      return true;
    } else {
      return twinkleCoins >= imageGenerationCost;
    }
  }, [imageGeneratedCount, twinkleCoins, imageGenerationCost]);

  const buttonLabel = useMemo(() => {
    if (canGenerateImage) {
      return buttonText;
    } else {
      return 'Not Enough Coins';
    }
  }, [buttonText, canGenerateImage]);

  const imageGenerationCostText = useMemo(() => {
    if (imageGeneratedCount === 0) {
      return 'Free';
    } else if (imageGeneratedCount >= 1 && imageGeneratedCount <= 3) {
      return '100 coins';
    } else {
      return '1,000 coins';
    }
  }, [imageGeneratedCount]);

  return (
    <Modal
      modalOverModal
      wrapped
      closeWhenClickedOutside={false}
      onHide={onHide}
    >
      <header>
        {isListening ? 'AI Story Listening' : 'AI Story Reading'} Cleared
      </header>
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
            {addCommasToNumber(
              rewardTable[difficulty].xp * (isListening ? 2 : 1)
            )}
          </b>{' '}
          <b style={{ color: Color.gold() }}>XP</b> and{' '}
          <b style={{ color: Color.brownOrange() }}>
            {addCommasToNumber(
              rewardTable[difficulty].coins * (isListening ? 2 : 1)
            )}{' '}
            coins
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
            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              <div>
                <Input
                  hasError={!!inputError}
                  placeholder="Enter Art Style..."
                  onChange={handleChange}
                  value={styleText}
                />
              </div>
              {!inputError && (
                <div
                  style={{
                    color: Color.darkGray(),
                    fontSize: '1rem',
                    marginTop: '0.5rem'
                  }}
                >
                  Examples: Cartoon, Realistic, Watercolor, Sketch, etc.
                </div>
              )}
              {inputError && (
                <div
                  style={{
                    color: 'red',
                    marginTop: '0.5rem'
                  }}
                >
                  {inputError}
                </div>
              )}
              <GradientButton
                theme={colorHash[difficulty] || 'default'}
                loading={generatingImage}
                onClick={handleGenerateImage}
                fontSize="1.5rem"
                mobileFontSize="1.1rem"
                style={{ marginTop: '1.5rem' }}
                disabled={!canGenerateImage}
              >
                <div>
                  <div>{buttonLabel}</div>
                  <div
                    className={css`
                      font-size: 1.1rem;
                      margin-top: 0.5rem;
                      @media (max-width: ${mobileMaxWidth}) {
                        font-size: 1rem;
                      }
                    `}
                  >
                    ({imageGenerationCostText})
                  </div>
                </div>
              </GradientButton>
              <div
                style={{
                  color: Color.darkGray(),
                  fontSize: '1rem',
                  marginTop: '0.5rem',
                  textAlign: 'center'
                }}
              >
                <div>1 free image generation per day</div>
                <div>100 coins for 2nd and 3rd, 1,000 for 4th+</div>
                <div style={{ marginTop: '0.5rem' }}>
                  You generated {imageGeneratedCount} image
                  {imageGeneratedCount === 1 ? '' : 's'} today
                </div>
              </div>
            </div>
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

  function handleChange(text: string) {
    setStyleText(text);

    const regex = /[^a-zA-Z0-9\-'\s[\](),]/gi;
    const isInvalid = regex.test(text.trim());
    if (isInvalid) {
      setInputError(
        `"${truncateText({
          text: text,
          limit: 20
        })}" is not a valid art style text.`
      );
    } else {
      setInputError('');
    }
  }

  async function handleGenerateImage() {
    if (inputError) return;

    setGeneratingImage(true);
    try {
      const { imageUrl, coins } = await generateAIStoryImage({
        storyId,
        style: styleText
      });
      setImageUrl(imageUrl);
      onSetUserState({ userId, newState: { twinkleCoins: coins } });
    } catch (error) {
      console.error(error);
    } finally {
      setGeneratingImage(false);
      setButtonText(defaultButtonText);
    }
  }
}
