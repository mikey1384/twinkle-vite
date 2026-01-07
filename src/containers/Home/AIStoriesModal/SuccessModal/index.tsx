import React, { useMemo, useState, useEffect, useRef } from 'react';
import Modal from '~/components/Modal';
import LegacyModalLayout from '~/components/Modal/LegacyModalLayout';
import Button from '~/components/Button';
import SuccessText from './SuccessText';
import GradientButton from '~/components/Buttons/GradientButton';
import Input from '~/components/Texts/Input';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useAppContext, useKeyContext } from '~/contexts';
import { addCommasToNumber, truncateText } from '~/helpers/stringHelpers';
import { socket } from '~/constants/sockets/api';
import { useRoleColor } from '~/theme/useRoleColor';
import VocabQuizModal from './VocabQuizModal';

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
  storyId?: number;
  stage:
    | 'not_started'
    | 'validating_style'
    | 'prompt_ready'
    | 'calling_openai'
    | 'calling_gemini'
    | 'downloading'
    | 'uploading'
    | 'error'
    | 'in_progress'
    | 'generating'
    | 'partial_image'
    | 'completed';
  percent?: number;
  imageUrl?: string;
  message?: string;
  partialImageB64?: string;
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
    case 'calling_gemini':
    case 'in_progress':
    case 'generating':
    case 'partial_image':
      if (callingOpenAITime < 20) {
        return `Generating...`;
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
  const userId = useKeyContext((v) => v.myState.userId);
  const twinkleCoins = useKeyContext((v) => v.myState.twinkleCoins);
  const userSettings = useKeyContext((v) => v.myState.settings);
  const xpNumberRole = useRoleColor('xpNumber', { fallback: 'logoGreen' });
  const xpNumberColorKey = xpNumberRole.colorKey;
  const generateAIStoryImage = useAppContext(
    (v) => v.requestHelpers.generateAIStoryImage
  );
  const loadAIStoryVocabSummary = useAppContext(
    (v) => v.requestHelpers.loadAIStoryVocabSummary
  );
  const updateImageGenerationSettings = useAppContext(
    (v) => v.requestHelpers.updateImageGenerationSettings
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);

  const [imageUrl, setImageUrl] = useState('');
  const [generatingImage, setGeneratingImage] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  const [inputError, setInputError] = useState('');
  const [styleText, setStyleText] = useState('');
  // Hardcoded to 'openai' (image-1) - Gemini is unstable
  const [imageEngine, setImageEngine] = useState<'gemini' | 'openai'>('openai');
  const [vocabSummary, setVocabSummary] = useState<{
    eligibleCount: number;
    totalWords: number;
  } | null>(null);
  const [loadingVocabSummary, setLoadingVocabSummary] = useState(false);
  const [vocabQuizShown, setVocabQuizShown] = useState(false);

  const [progressStage, setProgressStage] =
    useState<ImageGenStatus['stage']>('not_started');

  const [callingOpenAITime, setCallingOpenAITime] = useState(0);

  const isMountedRef = useRef(true);

  const eligibleVocabCount = useMemo(() => {
    return Number(vocabSummary?.eligibleCount || 0);
  }, [vocabSummary]);

  useEffect(() => {
    if (!storyId) return;
    let isMounted = true;
    setLoadingVocabSummary(true);
    setVocabSummary(null);
    loadAIStoryVocabSummary(storyId)
      .then((data: any) => {
        if (!isMounted) return;
        const eligibleCount = Number(data?.eligibleCount || 0);
        const totalWords = Number(data?.totalWords || 0);
        setVocabSummary({ eligibleCount, totalWords });
      })
      .catch((error: any) => {
        console.error('Failed to load AI story vocab summary', error);
        if (isMounted) {
          setVocabSummary({ eligibleCount: 0, totalWords: 0 });
        }
      })
      .finally(() => {
        if (isMounted) setLoadingVocabSummary(false);
      });
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyId]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Always use 'openai' (image-1) - ignoring user preferences since Gemini is unstable
    setImageEngine('openai');
  }, [userSettings?.aiImage?.engine]);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    const isActiveStage = [
      'calling_openai',
      'calling_gemini',
      'in_progress',
      'generating',
      'partial_image'
    ].includes(progressStage);
    if (isActiveStage) {
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
      'story_image_generation_status_received',
      handleImageGenerationStatusReceived
    );

    function handleImageGenerationStatusReceived(status: ImageGenStatus) {
      if (status.storyId && status.storyId !== storyId) return;
      setProgressStage(status.stage);
      if (status.partialImageB64) {
        setPreviewImageUrl(`data:image/png;base64,${status.partialImageB64}`);
      }
      if (status.imageUrl) {
        setImageUrl(status.imageUrl);
        setPreviewImageUrl('');
        setGeneratingImage(false);
        setProgressStage('not_started');
      }
      if (status.stage === 'error') {
        setProgressStage('not_started');
        setGeneratingImage(false);
        setPreviewImageUrl('');
      }
    }

    return function cleanUp() {
      socket.off(
        'story_image_generation_status_received',
        handleImageGenerationStatusReceived
      );
    };
  }, [storyId]);

  const freeThreshold = isListening ? 5 : 3;
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
    return imageGenerationCost === 0 ? 'Free' : '1,000 coins';
  }, [imageGenerationCost]);

  return (
    <>
      <Modal
        modalKey="SuccessModal"
        isOpen
        size="xl"
        onClose={onHide}
        closeOnBackdropClick={false}
        modalLevel={2}
        hasHeader={false}
        bodyPadding={0}
        allowOverflow
      >
      <LegacyModalLayout wrapped>
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
            <b style={{ color: Color[xpNumberColorKey]() }}>
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
              marginTop: '2rem',
              marginBottom: imageUrl ? '1rem' : 0,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.5rem'
            }}
          >
            {(imageUrl || previewImageUrl) && (
              <img
                loading="lazy"
                style={{
                  width: '100%',
                  maxHeight: '50vh',
                  objectFit: 'contain',
                  borderRadius: '12px'
                }}
                src={imageUrl || previewImageUrl}
                alt="Generated Story Image"
              />
            )}

            {!imageUrl && (
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

                {/* Engine selector hidden - hardcoded to image-1 (openai) */}
                {false && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginTop: '1rem'
                    }}
                  >
                    <label
                      style={{
                        fontWeight: 600,
                        color: Color.darkerGray(),
                        fontSize: '1rem'
                      }}
                    >
                      Image Model
                    </label>
                    <select
                      value={imageEngine}
                      onChange={(e) =>
                        handleEngineChange(
                          e.target.value as 'gemini' | 'openai'
                        )
                      }
                      disabled={generatingImage}
                      style={{
                        padding: '0.35rem 0.5rem',
                        borderRadius: '8px',
                        border: `1px solid ${Color.borderGray()}`,
                        fontSize: '0.95rem'
                      }}
                    >
                      <option value="gemini">Nano Banana Pro</option>
                      <option value="openai">GPT Image-1</option>
                    </select>
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
                        <div>
                          Listening images are free for all 5 daily clears
                        </div>
                      </>
                    ) : (
                      <>
                        <div>First 3 image generations are free</div>
                        <div>
                          1,000 coins for 4th and subsequent generations
                        </div>
                      </>
                    )}
                  </div>
                  <div style={{ marginTop: '0.5rem' }}>
                    You generated {imageGeneratedCount} image
                    {imageGeneratedCount === 1 ? '' : 's'} today
                    {isListening ? ' for listening' : ' for reading'}
                  </div>
                </div>
              </div>
            )}
            {!isListening && (
              <div
                className={css`
                  width: 100%;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  margin-top: ${imageUrl ? '1.5rem' : '2rem'};
                  gap: 0.6rem;
                `}
              >
                <Button
                  color="logoBlue"
                  variant="solid"
                  size="lg"
                  uppercase={false}
                  loading={loadingVocabSummary}
                  disabled={!loadingVocabSummary && eligibleVocabCount === 0}
                  onClick={() => setVocabQuizShown(true)}
                >
                  Collect Words
                </Button>
                <div
                  className={css`
                    font-size: 1rem;
                    color: ${Color.darkGray()};
                    text-align: center;
                  `}
                >
                  {loadingVocabSummary
                    ? 'Checking for collectible words...'
                    : eligibleVocabCount > 0
                    ? `${eligibleVocabCount} word${eligibleVocabCount === 1 ? '' : 's'} ready for Word Master`
                    : 'No new words to collect'}
                </div>
              </div>
            )}
          </div>
        </main>
        <footer>
          <Button
            variant="ghost"
            style={{ marginRight: '0.7rem' }}
            onClick={onHide}
          >
            Close
          </Button>
        </footer>
      </LegacyModalLayout>
      </Modal>
      {vocabQuizShown && (
        <VocabQuizModal
          isOpen={vocabQuizShown}
          onClose={() => setVocabQuizShown(false)}
          storyId={storyId}
        />
      )}
    </>
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
    setImageUrl('');
    setPreviewImageUrl('');
    setProgressStage(
      imageEngine === 'openai' ? 'calling_openai' : 'calling_gemini'
    );

    try {
      const { imageUrl, coins } = await generateAIStoryImage({
        storyId,
        style: styleText,
        engine: imageEngine
      });

      if (!isMountedRef.current) return;

      setImageUrl(imageUrl);
      onSetUserState({ userId, newState: { twinkleCoins: coins } });
      setProgressStage('not_started');
    } catch (error) {
      console.error(error);
      setProgressStage('error');
      setPreviewImageUrl('');
    } finally {
      if (isMountedRef.current) {
        setGeneratingImage(false);
      }
    }
  }

  async function handleEngineChange(value: 'gemini' | 'openai') {
    setImageEngine(value);
    if (!userId) return;
    try {
      const result = await updateImageGenerationSettings({ engine: value });
      if (result?.settings) {
        onSetUserState({ userId, newState: { settings: result.settings } });
      }
    } catch (error) {
      console.error('Failed to save image model preference:', error);
    }
  }
}
