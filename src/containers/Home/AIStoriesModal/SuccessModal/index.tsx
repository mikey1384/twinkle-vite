import React, { useMemo, useState, useEffect, useRef } from 'react';
import Modal from '~/components/Modal';
import LegacyModalLayout from '~/components/Modal/LegacyModalLayout';
import Button from '~/components/Button';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import SuccessText from './SuccessText';
import GradientButton from '~/components/Buttons/GradientButton';
import Input from '~/components/Texts/Input';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useAppContext, useKeyContext, useNotiContext } from '~/contexts';
import { addCommasToNumber, truncateText } from '~/helpers/stringHelpers';
import { socket } from '~/constants/sockets/api';
import { useRoleColor } from '~/theme/useRoleColor';
import VocabQuizModal from './VocabQuizModal';
import { cloudFrontURL } from '~/constants/defaultValues';
import AiEnergyCard from '~/components/AiEnergyCard';

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

const vocabButtonVariantHash: Record<
  number,
  'logoBlue' | 'pink' | 'orange' | 'magenta' | 'gold'
> = {
  1: 'logoBlue',
  2: 'pink',
  3: 'orange',
  4: 'magenta',
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

interface AiUsageRequirement {
  key: string;
  label: string;
  done: boolean;
  current?: number;
  required?: number;
}

interface AiUsagePolicy {
  dayIndex?: number;
  energyRemaining?: number;
  energyPercent?: number;
  energySegments?: number;
  energySegmentsRemaining?: number;
  currentMode?: 'full_quality' | 'low_energy';
  lastUsageOverflowed?: boolean;
  resetCost?: number;
  resetPurchasesToday?: number;
  communityFundResetEligibility?: {
    eligible: boolean;
    requirements: AiUsageRequirement[];
  };
}

const aiStoryImageGenerationStoryIds = new Set<number>();
const aiStoryGeneratedImageUrlsByStoryId = new Map<number, string>();

function getAIStoryImageGenerationStoryId(storyId?: number | string) {
  const numericStoryId = Number(storyId);
  if (!Number.isInteger(numericStoryId) || numericStoryId <= 0) return 0;
  return numericStoryId;
}

function setAIStoryImageGenerationInProgress({
  storyId,
  inProgress
}: {
  storyId: number;
  inProgress: boolean;
}) {
  if (!storyId) return;
  if (inProgress) {
    aiStoryImageGenerationStoryIds.add(storyId);
  } else {
    aiStoryImageGenerationStoryIds.delete(storyId);
  }
}

function isAIStoryImageGenerationInProgress(storyId: number) {
  return !!storyId && aiStoryImageGenerationStoryIds.has(storyId);
}

function imageGenerationStatusIsRunning(status: ImageGenStatus) {
  if (status.stage === 'error') return false;
  if (status.stage === 'completed') return !status.imageUrl;
  return true;
}

function getImageGenerationDisplayStage(status: ImageGenStatus) {
  if (status.stage === 'completed' && !status.imageUrl) {
    return 'downloading';
  }
  return status.stage;
}

function getAIStoryGeneratedImageUrl(storyId: number) {
  if (!storyId) return '';
  return aiStoryGeneratedImageUrlsByStoryId.get(storyId) || '';
}

function setAIStoryGeneratedImageUrl({
  storyId,
  imageUrl
}: {
  storyId: number;
  imageUrl: string;
}) {
  if (!storyId || !imageUrl) return;
  aiStoryGeneratedImageUrlsByStoryId.set(storyId, imageUrl);
}

function imageGenerationStageIsRunning(stage: ImageGenStatus['stage']) {
  return !['not_started', 'error', 'completed'].includes(stage);
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
  initialImagePath,
  isListening,
  imageGeneratedCount,
  onHide,
  numQuestions,
  rewardTable,
  storyId
}: {
  difficulty: number;
  initialImagePath?: string;
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
  const getAiEnergyPolicy = useAppContext(
    (v) => v.requestHelpers.getAiEnergyPolicy
  );
  const purchaseAiEnergyRecharge = useAppContext(
    (v) => v.requestHelpers.purchaseAiEnergyRecharge
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const globalAiUsagePolicy = useNotiContext(
    (v) => v.state.todayStats.aiUsagePolicy as AiUsagePolicy | null
  );
  const onUpdateTodayStats = useNotiContext(
    (v) => v.actions.onUpdateTodayStats
  );
  const normalizedStoryId = getAIStoryImageGenerationStoryId(storyId);

  const initialImageUrl = useMemo(() => {
    if (!initialImagePath) {
      return getAIStoryGeneratedImageUrl(normalizedStoryId);
    }
    if (
      initialImagePath.startsWith('http') ||
      initialImagePath.startsWith('data:')
    ) {
      return initialImagePath;
    }
    return `${cloudFrontURL}/ai-story/${initialImagePath.replace(
      /^\/?ai-story\//,
      ''
    )}`;
  }, [initialImagePath, normalizedStoryId]);

  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [generatingImage, setGeneratingImage] = useState(() =>
    isAIStoryImageGenerationInProgress(normalizedStoryId)
  );
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  const [inputError, setInputError] = useState('');
  const [styleText, setStyleText] = useState('');
  // Hardcoded to 'openai' (image-1.5) - Gemini is unstable
  const [imageEngine, setImageEngine] = useState<'gemini' | 'openai'>('openai');
  const [vocabSummary, setVocabSummary] = useState<{
    eligibleCount: number;
    totalWords: number;
  } | null>(null);
  const [loadingVocabSummary, setLoadingVocabSummary] = useState(false);
  const [vocabQuizShown, setVocabQuizShown] = useState(false);
  const [aiUsagePolicy, setAiUsagePolicy] = useState<AiUsagePolicy | null>(
    globalAiUsagePolicy || null
  );
  const [aiUsagePolicyLoading, setAiUsagePolicyLoading] = useState(false);
  const [aiUsageResetLoading, setAiUsageResetLoading] = useState(false);
  const [aiUsageResetError, setAiUsageResetError] = useState('');

  const [progressStage, setProgressStage] = useState<ImageGenStatus['stage']>(
    () =>
      isAIStoryImageGenerationInProgress(normalizedStoryId)
        ? 'calling_openai'
        : 'not_started'
  );

  const [callingOpenAITime, setCallingOpenAITime] = useState(0);

  const isMountedRef = useRef(true);

  const eligibleVocabCount = useMemo(() => {
    return Number(vocabSummary?.eligibleCount || 0);
  }, [vocabSummary]);

  const energyDepleted = useMemo(() => {
    return (
      !!aiUsagePolicy &&
      typeof aiUsagePolicy.energyRemaining === 'number' &&
      aiUsagePolicy.energyRemaining <= 0
    );
  }, [aiUsagePolicy]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    loadAiUsagePolicy({ isCancelled: () => cancelled });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (globalAiUsagePolicy) {
      applyAiUsagePolicy(globalAiUsagePolicy);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalAiUsagePolicy]);

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
    setImageUrl(initialImageUrl);
    if (initialImageUrl) {
      setAIStoryImageGenerationInProgress({
        storyId: normalizedStoryId,
        inProgress: false
      });
      setGeneratingImage(false);
      setPreviewImageUrl('');
      setProgressStage('not_started');
      return;
    }
    const isGenerating =
      isAIStoryImageGenerationInProgress(normalizedStoryId);
    setGeneratingImage(isGenerating);
    if (isGenerating) {
      setProgressStage((stage) =>
        imageGenerationStageIsRunning(stage) ? stage : 'calling_openai'
      );
    }
  }, [initialImageUrl, normalizedStoryId]);

  useEffect(() => {
    // Always use 'openai' (image-1.5) - ignoring user preferences since Gemini is unstable
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
      const statusStoryId = getAIStoryImageGenerationStoryId(
        status.storyId || normalizedStoryId
      );
      if (status.storyId && statusStoryId !== normalizedStoryId) return;
      const isRunning = imageGenerationStatusIsRunning(status);
      setAIStoryImageGenerationInProgress({
        storyId: statusStoryId,
        inProgress: isRunning
      });
      setProgressStage(getImageGenerationDisplayStage(status));
      setGeneratingImage(isRunning);
      if (status.partialImageB64) {
        setPreviewImageUrl(`data:image/png;base64,${status.partialImageB64}`);
      }
      if (status.imageUrl) {
        setAIStoryGeneratedImageUrl({
          storyId: statusStoryId,
          imageUrl: status.imageUrl
        });
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
  }, [normalizedStoryId]);

  const canGenerateImage = useMemo(() => {
    return (
      !generatingImage &&
      !energyDepleted &&
      !(aiUsagePolicyLoading && !aiUsagePolicy)
    );
  }, [aiUsagePolicy, aiUsagePolicyLoading, energyDepleted, generatingImage]);

  const buttonLabel = useMemo(() => {
    if (aiUsagePolicyLoading && !aiUsagePolicy) return 'Checking Energy...';
    if (energyDepleted) return 'Recharge Energy';
    return labelFromStage(progressStage, callingOpenAITime);
  }, [
    aiUsagePolicy,
    aiUsagePolicyLoading,
    energyDepleted,
    progressStage,
    callingOpenAITime
  ]);

  const imageGenerationCostText = useMemo(() => {
    return energyDepleted ? 'Energy empty' : 'Uses Energy';
  }, [energyDepleted]);

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

                {/* Engine selector hidden - hardcoded to image-1.5 (openai) */}
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

                {aiUsagePolicy && (
                  <AiEnergyCard
                    variant="inline"
                    className={css`
                      width: min(100%, 34rem);
                      margin-top: 1.2rem;
                    `}
                    energyPercent={aiUsagePolicy.energyPercent ?? 0}
                    energySegments={aiUsagePolicy.energySegments}
                    energySegmentsRemaining={
                      aiUsagePolicy.energySegmentsRemaining
                    }
                    overflowed={aiUsagePolicy.lastUsageOverflowed}
                    resetNeeded={energyDepleted}
                    resetCost={aiUsagePolicy.resetCost || 0}
                    resetPurchaseNumber={
                      (aiUsagePolicy.resetPurchasesToday || 0) + 1
                    }
                    twinkleCoins={twinkleCoins}
                    rechargeLoading={aiUsageResetLoading}
                    rechargeError={aiUsageResetError}
                    onRecharge={() => handlePurchaseAiUsageReset(false)}
                    communityFundsEligible={
                      !!aiUsagePolicy.communityFundResetEligibility?.eligible
                    }
                    communityFundsRequirements={
                      aiUsagePolicy.communityFundResetEligibility?.requirements
                    }
                    onRechargeWithCommunityFunds={
                      aiUsagePolicy.communityFundResetEligibility
                        ? () => handlePurchaseAiUsageReset(true)
                        : undefined
                    }
                  />
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
                  <div>Image generation uses Energy.</div>
                  <div>Recharge when the battery is empty.</div>
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
                <GameCTAButton
                  variant={
                    loadingVocabSummary || eligibleVocabCount === 0
                      ? 'logoBlue'
                      : vocabButtonVariantHash[difficulty] || 'logoBlue'
                  }
                  size="lg"
                  shiny={!loadingVocabSummary && eligibleVocabCount > 0}
                  loading={loadingVocabSummary}
                  disabled={!loadingVocabSummary && eligibleVocabCount === 0}
                  onClick={() => setVocabQuizShown(true)}
                >
                  {!loadingVocabSummary && eligibleVocabCount === 0
                    ? 'No Words to Collect'
                    : 'Collect Words'}
                </GameCTAButton>
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
    if (
      inputError ||
      generatingImage ||
      isAIStoryImageGenerationInProgress(normalizedStoryId)
    ) {
      return;
    }
    const policy = aiUsagePolicy || (await loadAiUsagePolicy());
    if (
      policy &&
      typeof policy.energyRemaining === 'number' &&
      policy.energyRemaining <= 0
    ) {
      setProgressStage('error');
      return;
    }

    setGeneratingImage(true);
    setAIStoryImageGenerationInProgress({
      storyId: normalizedStoryId,
      inProgress: true
    });
    setImageUrl('');
    setPreviewImageUrl('');
    setProgressStage(
      imageEngine === 'openai' ? 'calling_openai' : 'calling_gemini'
    );

    try {
      const { imageUrl, aiUsagePolicy: nextAiUsagePolicy } =
        await generateAIStoryImage({
          storyId,
          style: styleText,
          engine: imageEngine
        });

      setAIStoryGeneratedImageUrl({
        storyId: normalizedStoryId,
        imageUrl
      });
      if (!isMountedRef.current) return;

      setImageUrl(imageUrl);
      if (nextAiUsagePolicy) {
        applyAiUsagePolicy(nextAiUsagePolicy);
      }
      setProgressStage('not_started');
    } catch (error: any) {
      console.error(error);
      if (error?.aiUsagePolicy) {
        applyAiUsagePolicy(error.aiUsagePolicy);
      }
      if (isMountedRef.current) {
        setProgressStage('error');
        setPreviewImageUrl('');
      }
    } finally {
      setAIStoryImageGenerationInProgress({
        storyId: normalizedStoryId,
        inProgress: false
      });
      if (isMountedRef.current) {
        setGeneratingImage(false);
      }
    }
  }

  async function loadAiUsagePolicy({
    isCancelled = () => false
  }: {
    isCancelled?: () => boolean;
  } = {}) {
    if (!userId) return null;
    if (!isCancelled()) {
      setAiUsagePolicyLoading(true);
    }
    try {
      const result = await getAiEnergyPolicy();
      const nextPolicy = result?.aiUsagePolicy || null;
      if (!isCancelled()) {
        applyAiUsagePolicy(nextPolicy);
      }
      return nextPolicy;
    } catch (error) {
      console.error(error);
      return null;
    } finally {
      if (!isCancelled()) {
        setAiUsagePolicyLoading(false);
      }
    }
  }

  function applyAiUsagePolicy(nextPolicy?: AiUsagePolicy | null) {
    if (!nextPolicy) return;
    setAiUsagePolicy((policy) => ({
      ...nextPolicy,
      ...(policy?.communityFundResetEligibility &&
      !nextPolicy.communityFundResetEligibility &&
      (!nextPolicy.dayIndex || nextPolicy.dayIndex === policy.dayIndex)
        ? {
            communityFundResetEligibility: policy.communityFundResetEligibility
          }
        : {})
    }));
    onUpdateTodayStats({
      newStats: {
        aiUsagePolicy: nextPolicy
      }
    });
  }

  async function handlePurchaseAiUsageReset(useCommunityFunds = false) {
    if (aiUsageResetLoading) return;
    setAiUsageResetLoading(true);
    setAiUsageResetError('');
    try {
      const result = await purchaseAiEnergyRecharge({
        useCommunityFunds
      });
      if (result?.aiUsagePolicy) {
        applyAiUsagePolicy(result.aiUsagePolicy);
      }
      if (typeof result?.newBalance === 'number') {
        onSetUserState({
          userId,
          newState: { twinkleCoins: result.newBalance }
        });
      }
      if (typeof result?.communityFunds === 'number') {
        onSetUserState({
          userId,
          newState: { communityFunds: result.communityFunds }
        });
      }
    } catch (error: any) {
      console.error(error);
      if (error?.aiUsagePolicy) {
        applyAiUsagePolicy(error.aiUsagePolicy);
      }
      setAiUsageResetError(
        error?.message || 'Unable to recharge Energy right now.'
      );
    } finally {
      setAiUsageResetLoading(false);
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
