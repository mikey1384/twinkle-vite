import React, { useMemo, useState, useEffect, useRef } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import SuccessText from './SuccessText';
import GradientButton from '~/components/Buttons/GradientButton';
import Input from '~/components/Texts/Input';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useAppContext, useKeyContext } from '~/contexts';
import { addCommasToNumber, truncateText } from '~/helpers/stringHelpers';
import { socket } from '~/constants/sockets/api';

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

interface ImageGenStatus {
  storyId: number;
  stage:
    | 'not_started'
    | 'validating_style'
    | 'prompt_ready'
    | 'calling_openai'
    | 'downloading'
    | 'uploading'
    | 'error';
  percent?: number;
  imageUrl?: string;
  message?: string;
}

function labelFromStage(s: ImageGenStatus['stage'], callingOpenAITime: number) {
  switch (s) {
    case 'not_started':
      return 'Generate Image';
    case 'validating_style':
      return 'Checking your vibe…';
    case 'prompt_ready':
      return 'Cooking up ideas…';
    case 'calling_openai':
      if (callingOpenAITime < 25) {
        return `Generating (this may take a while)...`;
      } else if (callingOpenAITime < 50) {
        return `Still generating... Hang tight!`;
      } else {
        return `Still working on it...`;
      }
    case 'downloading':
      return 'Rendering pixels…';
    case 'uploading':
      return 'Finalizing…';
    default:
      return 'Sprinkling magic…';
  }
}

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
  const {
    xpNumber: { color: xpNumberColor }
  } = useKeyContext((v) => v.theme);
  const generateAIStoryImage = useAppContext(
    (v) => v.requestHelpers.generateAIStoryImage
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);

  const [imageUrl, setImageUrl] = useState('');
  const [generatingImage, setGeneratingImage] = useState(false);
  const [inputError, setInputError] = useState('');
  const [styleText, setStyleText] = useState('');

  const [progressStage, setProgressStage] =
    useState<ImageGenStatus['stage']>('not_started');

  const [callingOpenAITime, setCallingOpenAITime] = useState(0);

  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    if (progressStage === 'calling_openai') {
      intervalId = setInterval(() => {
        setCallingOpenAITime((time) => time + 1);
      }, 1000);
    } else {
      // reset if not calling_openai
      setCallingOpenAITime(0);
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [progressStage]);

  useEffect(() => {
    socket.on(
      'image_generation_status_received',
      handleImageGenerationStatusReceived
    );

    function handleImageGenerationStatusReceived(status: ImageGenStatus) {
      setProgressStage(status.stage);
      if (status.stage === 'error') {
        setProgressStage('not_started');
        setGeneratingImage(false);
      }
    }

    return function cleanUp() {
      socket.off(
        'image_generation_status_received',
        handleImageGenerationStatusReceived
      );
    };
  }, []);

  const freeThreshold = isListening ? 10 : 3;
  const imageGenerationCost = useMemo(() => {
    return imageGeneratedCount < freeThreshold ? 0 : 1000;
  }, [freeThreshold, imageGeneratedCount]);

  const canGenerateImage = useMemo(() => {
    if (imageGeneratedCount === 0) {
      return true;
    }
    return twinkleCoins >= imageGenerationCost;
  }, [imageGeneratedCount, twinkleCoins, imageGenerationCost]);

  const buttonLabel = useMemo(() => {
    return canGenerateImage
      ? labelFromStage(progressStage, callingOpenAITime)
      : 'Not Enough Coins';
  }, [progressStage, canGenerateImage, callingOpenAITime]);

  const imageGenerationCostText = useMemo(() => {
    return imageGeneratedCount < freeThreshold ? 'Free' : '1,000 coins';
  }, [freeThreshold, imageGeneratedCount]);

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
              loading="lazy"
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
                <div>
                  {isListening ? (
                    <>
                      <div>First 10 image generations are free</div>
                      <div>1,000 coins for 11th and subsequent generations</div>
                    </>
                  ) : (
                    <>
                      <div>First 3 image generations are free</div>
                      <div>1,000 coins for 4th and subsequent generations</div>
                    </>
                  )}
                </div>
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

    const regex = /[^a-zA-Z0-9\-'‘’\s[\](),]/gi;
    const isInvalid = regex.test(text.trim());
    if (isInvalid) {
      setInputError(
        `"${truncateText({
          text,
          limit: 20
        })}" is not a valid art style text.`
      );
    } else {
      setInputError('');
    }
  }

  async function handleGenerateImage() {
    if (inputError || generatingImage) return;

    setGeneratingImage(true);
    setProgressStage('calling_openai');

    try {
      const { imageUrl, coins } = await generateAIStoryImage({
        storyId,
        style: styleText
      });

      if (!isMountedRef.current) return;

      setImageUrl(imageUrl);
      onSetUserState({ userId, newState: { twinkleCoins: coins } });
      setProgressStage('not_started');
    } catch (error) {
      console.error(error);
      setProgressStage('error');
    } finally {
      if (isMountedRef.current) {
        setGeneratingImage(false);
      }
    }
  }
}
