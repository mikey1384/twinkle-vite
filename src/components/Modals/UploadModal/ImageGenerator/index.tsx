import React, { useState, useEffect, useRef, useMemo } from 'react';
import AIDisabledNotice from '~/components/AIDisabledNotice';
import {
  useAppContext,
  useKeyContext,
  useNotiContext,
  useViewContext
} from '~/contexts';
import { socket } from '~/constants/sockets/api';
import { css } from '@emotion/css';
import {
  dataUrlToBlob,
  fileToBase64,
  needsImageConversion,
  convertToWebFriendlyFormat
} from '~/helpers/imageHelpers';

import InputSection from './InputSection';
import ErrorDisplay from './ErrorDisplay';
import ImageArea from './ImageArea';
import ImageEditor from './ImageEditor';
import FilterBar from '~/components/FilterBar';
import Icon from '~/components/Icon';
import AiEnergyCard from '~/components/AiEnergyCard';
import {
  errorHasActualCommunityFundsBalance,
  isCommunityFundRechargeAvailable
} from '~/helpers/aiEnergy';
import { useRoleColor } from '~/theme/useRoleColor';

interface ImageGeneratorProps {
  onImageGenerated: (file: File) => void;
  onBack: () => void;
  onError?: (error: string) => void;
  onUseImageAvailabilityChange?: (available: boolean) => void;
  onRegisterUseImageHandler?: (
    handler: (() => void | Promise<void>) | null
  ) => void;
}

type AiImageEngine = 'gemini' | 'openai';
type AiImageQuality = 'low' | 'medium' | 'high';

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
  communityFundRechargeCoinsRemaining?: number;
  communityFundResetEligibility?: {
    eligible: boolean;
    requirements: any[];
  };
}

export default function ImageGenerator({
  onImageGenerated,
  onError,
  onUseImageAvailabilityChange,
  onRegisterUseImageHandler
}: ImageGeneratorProps) {
  const AI_FEATURES_DISABLED = useViewContext(
    (v) => v.state.aiFeaturesDisabled
  );
  const [prompt, setPrompt] = useState('');
  const [followUpPrompt, setFollowUpPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasBeenEdited, setHasBeenEdited] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(
    null
  );
  const [generatedResponseId, setGeneratedResponseId] = useState<string | null>(
    null
  );
  const [generatedImageId, setGeneratedImageId] = useState<string | null>(null);
  const [error, setErrorRaw] = useState<any>(null);
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(
    null
  );
  const [mode, setMode] = useState<'text' | 'draw'>('text');
  const [engine, setEngine] = useState<AiImageEngine>('openai');
  const [followUpEngine, setFollowUpEngine] =
    useState<AiImageEngine>('openai');
  const [quality, setQuality] = useState<AiImageQuality>('high');
  const [followUpQuality, setFollowUpQuality] =
    useState<AiImageQuality>('high');
  const [drawingCanvasUrl, setDrawingCanvasUrl] = useState<string | null>(null);
  const [canvasHasContent, setCanvasHasContent] = useState(false);
  const [aiUsagePolicy, setAiUsagePolicy] = useState<AiUsagePolicy | null>(
    null
  );
  const [aiUsagePolicyLoading, setAiUsagePolicyLoading] = useState(false);
  const [aiUsageResetLoading, setAiUsageResetLoading] = useState(false);
  const [aiUsageResetError, setAiUsageResetError] = useState('');
  const aiUsagePolicyRef = useRef<AiUsagePolicy | null>(null);
  const activeImageRequestIdRef = useRef<string | null>(null);

  const setError = (err: any) => {
    if (err === null) {
      setErrorRaw(null);
    } else {
      setErrorRaw(safeErrorToString(err));
    }
  };
  const [progressStage, setProgressStage] = useState<string>('not_started');
  const [partialImageData, setPartialImageData] = useState<string | null>(null);
  const [isFollowUpGenerating, setIsFollowUpGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const useImageHandlerRef = useRef<(() => void | Promise<void>) | null>(null);

  const isShowingLoadingState = useMemo(() => {
    return (
      isFollowUpGenerating ||
      isGenerating ||
      !!(!generatedImageUrl && partialImageData)
    );
  }, [isFollowUpGenerating, isGenerating, generatedImageUrl, partialImageData]);

  const showFollowUp = useMemo(
    () => !!generatedImageUrl && !isShowingLoadingState,
    [generatedImageUrl, isShowingLoadingState]
  );

  const canUseGeneratedImage = useMemo(
    () =>
      Boolean(
        (generatedImageUrl ||
          referenceImageUrl ||
          hasBeenEdited ||
          (drawingCanvasUrl && canvasHasContent)) &&
        !isShowingLoadingState
      ),
    [
      generatedImageUrl,
      referenceImageUrl,
      hasBeenEdited,
      drawingCanvasUrl,
      canvasHasContent,
      isShowingLoadingState
    ]
  );

  useEffect(() => {
    onUseImageAvailabilityChange?.(canUseGeneratedImage);
  }, [canUseGeneratedImage, onUseImageAvailabilityChange]);

  useEffect(() => {
    return () => {
      onUseImageAvailabilityChange?.(false);
    };
  }, [onUseImageAvailabilityChange]);

  const generateAIImage = useAppContext(
    (v) => v.requestHelpers.generateAIImage
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

  const userId = useKeyContext((v) => v.myState.userId);
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  const twinkleCoins = useKeyContext((v) => v.myState.twinkleCoins);
  const communityFunds = useKeyContext((v) => v.myState.communityFunds);
  const communityFundsLoaded = useKeyContext(
    (v) => v.myState.communityFundsLoaded
  );
  const userSettings = useKeyContext((v) => v.myState.settings);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const uploadThemeRole = useRoleColor('button', {
    themeName: profileTheme,
    fallback: profileTheme || 'logoBlue'
  });
  const globalAiUsagePolicy = useNotiContext(
    (v) => v.state.todayStats.aiUsagePolicy as AiUsagePolicy | null
  );
  const onUpdateTodayStats = useNotiContext(
    (v) => v.actions.onUpdateTodayStats
  );

  useEffect(() => {
    setEngine(parseAiImageEngine(userSettings?.aiImage?.engine));
    setFollowUpEngine(
      parseAiImageEngine(
        userSettings?.aiImage?.followUpEngine || userSettings?.aiImage?.engine
      )
    );
    setQuality(parseAiImageQuality(userSettings?.aiImage?.quality));
    setFollowUpQuality(
      parseAiImageQuality(
        userSettings?.aiImage?.followUpQuality || userSettings?.aiImage?.quality
      )
    );
  }, [
    userSettings?.aiImage?.engine,
    userSettings?.aiImage?.followUpEngine,
    userSettings?.aiImage?.quality,
    userSettings?.aiImage?.followUpQuality
  ]);

  const energyDepleted = useMemo(() => {
    return (
      !!aiUsagePolicy &&
      typeof aiUsagePolicy.energyRemaining === 'number' &&
      aiUsagePolicy.energyRemaining <= 0
    );
  }, [aiUsagePolicy]);

  const canAffordGeneration = useMemo(() => {
    return !energyDepleted && !(aiUsagePolicyLoading && !aiUsagePolicy);
  }, [aiUsagePolicy, aiUsagePolicyLoading, energyDepleted]);

  const canAffordFollowUp = canAffordGeneration;

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
    const handleImageGenerationStatus = (status: {
      stage: string;
      partialImageB64?: string;
      index?: number;
      imageUrl?: string;
      error?: string;
      message?: string;
      imageId?: string;
      responseId?: string;
      requestId?: string;
      aiUsagePolicy?: AiUsagePolicy;
    }) => {
      try {
        if (!status || shouldIgnoreImageGenerationStatus(status.requestId)) {
          return;
        }
        setProgressStage(status.stage);

        if (status.stage === 'partial_image' && status.partialImageB64) {
          setGeneratedImageUrl(null);
          setPartialImageData(
            `data:image/png;base64,${status.partialImageB64}`
          );
        } else if (status.stage === 'completed') {
          if (!status.imageUrl) {
            return;
          }
          setGeneratedImageUrl(status.imageUrl);
          if (status.responseId) {
            setGeneratedResponseId(status.responseId);
          }
          if (status.imageId) {
            setGeneratedImageId(status.imageId);
          }

          if (status.aiUsagePolicy) {
            applyAiUsagePolicy(status.aiUsagePolicy);
          }

          if (isFollowUpGenerating) {
            setFollowUpPrompt('');
          }
          setIsGenerating(false);
          setIsFollowUpGenerating(false);
          clearActiveImageRequest(status.requestId);
        } else if (status.stage === 'error') {
          const rawError =
            status.error ||
            status.message ||
            'An error occurred during image generation';
          const errorMessage = safeErrorToString(rawError);
          setError(errorMessage);

          const latestPartialImage =
            (status.partialImageB64
              ? `data:image/png;base64,${status.partialImageB64}`
              : null) || partialImageData;
          if (latestPartialImage) {
            convertPartialImageToReference(latestPartialImage);
          }

          if (status.aiUsagePolicy) {
            applyAiUsagePolicy(status.aiUsagePolicy);
          }

          setIsGenerating(false);
          setIsFollowUpGenerating(false);
          setProgressStage('not_started');
          clearActiveImageRequest(status.requestId);
          onError?.(errorMessage);
        }
      } catch (err) {
        console.error('Error handling image generation status:', err);
        const fallbackMessage = 'Error processing image generation response';
        setError(fallbackMessage);

        if (partialImageData) {
          convertPartialImageToReference(partialImageData);
        }

        setIsGenerating(false);
        setIsFollowUpGenerating(false);
        setProgressStage('not_started');
        activeImageRequestIdRef.current = null;
        onError?.(fallbackMessage);
      }
    };

    socket.on('image_generation_status_received', handleImageGenerationStatus);

    return () => {
      socket.off(
        'image_generation_status_received',
        handleImageGenerationStatus
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (referenceImage) {
      const url = URL.createObjectURL(referenceImage);
      setReferenceImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setReferenceImageUrl(null);
    }
  }, [referenceImage]);

  useImageHandlerRef.current = handleUseImage;

  async function persistImageModelPreference({
    engine: initialEngine,
    followUpEngine: followUp,
    quality: initialQuality,
    followUpQuality: followUpImageQuality
  }: {
    engine?: AiImageEngine;
    followUpEngine?: AiImageEngine;
    quality?: AiImageQuality;
    followUpQuality?: AiImageQuality;
  }) {
    if (!userId) return;
    try {
      const result = await updateImageGenerationSettings({
        engine: initialEngine,
        followUpEngine: followUp,
        quality: initialQuality,
        followUpQuality: followUpImageQuality
      });
      if (result?.settings) {
        onSetUserState({
          userId,
          newState: { settings: result.settings }
        });
      }
    } catch (err) {
      console.error('Failed to save image model preference:', err);
      setError('Failed to save image model preference');
    }
  }

  function handleEngineChange(value: 'gemini' | 'openai') {
    setEngine(value);
    persistImageModelPreference({ engine: value });
  }

  function handleFollowUpEngineChange(value: 'gemini' | 'openai') {
    setFollowUpEngine(value);
    persistImageModelPreference({ followUpEngine: value });
  }

  function handleQualityChange(value: AiImageQuality) {
    setQuality(value);
    persistImageModelPreference({ quality: value });
  }

  function handleFollowUpQualityChange(value: AiImageQuality) {
    setFollowUpQuality(value);
    persistImageModelPreference({ followUpQuality: value });
  }

  useEffect(() => {
    if (!onRegisterUseImageHandler) return;

    if (!canUseGeneratedImage) {
      onRegisterUseImageHandler(null);
      return () => {
        onRegisterUseImageHandler(null);
      };
    }

    const handler = () => {
      const fn = useImageHandlerRef.current;
      if (fn) {
        fn();
      }
    };

    onRegisterUseImageHandler(handler);

    return () => {
      onRegisterUseImageHandler(null);
    };
  }, [canUseGeneratedImage, onRegisterUseImageHandler]);

  const showSourceImagePanelAbovePrompt =
    mode === 'text' &&
    !generatedImageUrl &&
    !partialImageData &&
    Boolean(referenceImageUrl || drawingCanvasUrl);
  const hasImageAreaContent = Boolean(
    partialImageData ||
      generatedImageUrl ||
      referenceImageUrl ||
      drawingCanvasUrl ||
      isGenerating
  );

  const imageArea = (
    <ImageArea
      partialImageData={partialImageData}
      generatedImageUrl={generatedImageUrl}
      referenceImageUrl={referenceImageUrl}
      canvasUrl={drawingCanvasUrl}
      isGenerating={isGenerating}
      isFollowUpGenerating={isFollowUpGenerating}
      showFollowUp={showFollowUp}
      followUpPrompt={followUpPrompt}
      onFollowUpPromptChange={setFollowUpPrompt}
      onFollowUpGenerate={handleFollowUpGenerate}
      onUseImage={handleUseImage}
      getProgressLabel={getProgressLabel}
      onRemoveReference={handleRemoveReference}
      onImageEdited={handleImageEdited}
      hasBeenEdited={hasBeenEdited}
      onSetHasBeenEdited={setHasBeenEdited}
      canvasHasContent={canvasHasContent}
      isShowingLoadingState={isShowingLoadingState}
      canAffordFollowUp={canAffordFollowUp}
      energyLoading={aiUsagePolicyLoading && !aiUsagePolicy}
      followUpEngine={followUpEngine}
      onFollowUpEngineChange={handleFollowUpEngineChange}
      followUpQuality={followUpQuality}
      onFollowUpQualityChange={handleFollowUpQualityChange}
      themeColor={profileTheme}
      energyPercent={aiUsagePolicy?.energyPercent}
      energySegments={aiUsagePolicy?.energySegments}
      overflowed={aiUsagePolicy?.lastUsageOverflowed}
      resetNeeded={energyDepleted}
      resetCost={aiUsagePolicy?.resetCost || 0}
      resetPurchaseNumber={(aiUsagePolicy?.resetPurchasesToday || 0) + 1}
      twinkleCoins={twinkleCoins}
      rechargeLoading={aiUsageResetLoading}
      rechargeError={aiUsageResetError}
      onRecharge={() => handlePurchaseAiUsageReset(false)}
      communityFundsEligible={isCommunityFundRechargeAvailable({
        aiUsagePolicy,
        communityFunds,
        communityFundsKnown: communityFundsLoaded
      })}
      communityFundsRequirements={
        aiUsagePolicy?.communityFundResetEligibility?.requirements
      }
      onRechargeWithCommunityFunds={
        aiUsagePolicy?.communityFundResetEligibility
          ? () => handlePurchaseAiUsageReset(true)
          : undefined
      }
    />
  );

  if (AI_FEATURES_DISABLED) {
    return <AIDisabledNotice title="AI Image Generation Is Unavailable" />;
  }

  return (
    <div
      className={css`
        padding: 1rem;
        width: 100%;
        height: ${hasImageAreaContent || mode === 'draw' ? '100%' : 'auto'};
        display: flex;
        flex-direction: column;
        gap: 1rem;
        min-height: ${hasImageAreaContent || mode === 'draw' ? '400px' : '0'};
      `}
    >
      <FilterBar>
        <nav
          className={mode === 'text' ? 'active' : ''}
          onClick={() => handleModeChange('text')}
        >
          Tell the AI What to Generate
        </nav>
        <nav
          className={mode === 'draw' ? 'active' : ''}
          onClick={() => handleModeChange('draw')}
        >
          Draw
        </nav>
      </FilterBar>
      {aiUsagePolicy && (
        <AiEnergyCard
          variant="inline"
          className={css`
            width: min(100%, 42rem);
            align-self: center;
          `}
          energyPercent={aiUsagePolicy.energyPercent ?? 0}
          energySegments={aiUsagePolicy.energySegments}
          energySegmentsRemaining={aiUsagePolicy.energySegmentsRemaining}
          overflowed={aiUsagePolicy.lastUsageOverflowed}
          resetNeeded={energyDepleted}
          resetCost={aiUsagePolicy.resetCost || 0}
          resetPurchaseNumber={(aiUsagePolicy.resetPurchasesToday || 0) + 1}
          twinkleCoins={twinkleCoins}
          rechargeLoading={aiUsageResetLoading}
          rechargeError={aiUsageResetError}
          onRecharge={() => handlePurchaseAiUsageReset(false)}
          communityFundsEligible={isCommunityFundRechargeAvailable({
            aiUsagePolicy,
            communityFunds,
            communityFundsKnown: communityFundsLoaded
          })}
          communityFundsRequirements={
            aiUsagePolicy.communityFundResetEligibility?.requirements
          }
          onRechargeWithCommunityFunds={
            aiUsagePolicy.communityFundResetEligibility
              ? () => handlePurchaseAiUsageReset(true)
              : undefined
          }
          themeColor={profileTheme}
        />
      )}
      {mode === 'text' && (
        <div
          className={css`
            display: flex;
            justify-content: center;
          `}
        >
          <label
            className={css`
              display: inline-flex;
              align-items: center;
              justify-content: center;
              gap: 1rem;
              padding: 0.8rem 1.4rem;
              background: transparent;
              border: 2px dashed
                ${isShowingLoadingState ? '#ccc' : uploadThemeRole.getColor(0.58)};
              border-radius: 8px;
              cursor: ${isShowingLoadingState ? 'not-allowed' : 'pointer'};
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              font-size: 1rem;
              font-weight: 800;
              color: ${isShowingLoadingState ? '#ccc' : uploadThemeRole.getColor()};
              position: relative;
              overflow: hidden;
              min-width: 200px;
              opacity: ${isShowingLoadingState ? 0.5 : 1};

              &:hover {
                background: ${uploadThemeRole.getColor(0.08)};
              }
            `}
          >
            <Icon icon="image" />
            Add Image
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleReferenceUpload}
              disabled={isShowingLoadingState}
              className={css`
                display: none;
              `}
            />
          </label>
        </div>
      )}

      {mode === 'draw' && (
        <ImageEditor
          imageUrl={referenceImageUrl || ''}
          onSave={(dataUrl) => {
            handleCanvasSave(dataUrl);
            setMode('text'); // Switch back to text mode after saving
          }}
          onCancel={() => setMode('text')} // Switch back to text mode on cancel
        />
      )}

      {showSourceImagePanelAbovePrompt && imageArea}

      <InputSection
        prompt={prompt}
        onPromptChange={setPrompt}
        onGenerate={handleGenerate}
        onKeyDown={handleKeyDown}
        isGenerating={isGenerating}
        canAffordGeneration={canAffordGeneration}
        energyLoading={aiUsagePolicyLoading && !aiUsagePolicy}
        engine={engine}
        onEngineChange={handleEngineChange}
        quality={quality}
        onQualityChange={handleQualityChange}
        themeColor={profileTheme}
      />

      {error && <ErrorDisplay error={error} onDismiss={() => setError(null)} />}

      {!showSourceImagePanelAbovePrompt && imageArea}
    </div>
  );

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
    const currentPolicy = aiUsagePolicyRef.current;
    const sameDay =
      currentPolicy?.dayIndex == null ||
      nextPolicy.dayIndex == null ||
      currentPolicy.dayIndex === nextPolicy.dayIndex;
    const mergedPolicy =
      sameDay &&
      currentPolicy?.communityFundResetEligibility &&
      !nextPolicy.communityFundResetEligibility
        ? {
            ...nextPolicy,
            communityFundResetEligibility:
              currentPolicy.communityFundResetEligibility
          }
        : nextPolicy;
    aiUsagePolicyRef.current = mergedPolicy;
    setAiUsagePolicy(mergedPolicy);
    onUpdateTodayStats({
      newStats: {
        aiUsagePolicy: mergedPolicy
      }
    });
  }

  function createImageRequestId(kind: 'initial' | 'follow-up') {
    return `upload-image-${kind}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`;
  }

  function startImageRequest(kind: 'initial' | 'follow-up') {
    const requestId = createImageRequestId(kind);
    activeImageRequestIdRef.current = requestId;
    return requestId;
  }

  function clearActiveImageRequest(requestId?: string) {
    const normalizedRequestId = String(requestId || '').trim();
    if (
      !normalizedRequestId ||
      activeImageRequestIdRef.current === normalizedRequestId
    ) {
      activeImageRequestIdRef.current = null;
    }
  }

  function shouldIgnoreImageGenerationStatus(requestId?: string) {
    const activeRequestId = String(activeImageRequestIdRef.current || '').trim();
    const statusRequestId = String(requestId || '').trim();
    return !activeRequestId || statusRequestId !== activeRequestId;
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
      if (
        typeof error?.currentCommunityFunds === 'number' &&
        errorHasActualCommunityFundsBalance(error)
      ) {
        const normalizedCommunityFunds = Math.max(
          0,
          Number(error.currentCommunityFunds || 0)
        );
        onSetUserState({
          userId,
          newState: { communityFunds: normalizedCommunityFunds }
        });
      }
      setAiUsageResetError(
        error?.message || 'Unable to recharge Energy right now.'
      );
    } finally {
      setAiUsageResetLoading(false);
    }
  }

  async function handleGenerate() {
    if (!prompt.trim() || isGenerating) return;

    const policy = aiUsagePolicy || (await loadAiUsagePolicy());
    if (
      policy &&
      typeof policy.energyRemaining === 'number' &&
      policy.energyRemaining <= 0
    ) {
      const errorMessage = 'Energy is empty. Recharge or come back tomorrow.';
      setError(errorMessage);
      onError?.(errorMessage);
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImageUrl(null);
    setPartialImageData(null);
    setProgressStage('prompt_ready');
    setGeneratedResponseId(null);
    setGeneratedImageId(null);
    setIsFollowUpGenerating(false);
    const requestId = startImageRequest('initial');

    try {
      let referenceB64: string | undefined;
      if (referenceImage) {
        referenceB64 = await fileToBase64(referenceImage);
      } else if (mode === 'draw' && drawingCanvasUrl) {
        referenceB64 = drawingCanvasUrl.split(',')[1];
      }

      const result = await generateAIImage({
        prompt: prompt.trim(),
        referenceImageB64: referenceB64,
        engine,
        quality: engine === 'openai' ? quality : undefined,
        requestId
      });

      if (result.aiUsagePolicy) {
        applyAiUsagePolicy(result.aiUsagePolicy);
      }

      if (result.success && result.imageUrl) {
        setGeneratedImageUrl(result.imageUrl);
        setPartialImageData(null);
        if (result.responseId) {
          setGeneratedResponseId(result.responseId);
        }
        if (result.imageId) {
          setGeneratedImageId(result.imageId);
        }
        setIsGenerating(false);
        setIsFollowUpGenerating(false);
        setProgressStage('completed');
        clearActiveImageRequest(requestId);
        return;
      }

      if (!result.success) {
        const isStreamingActive =
          progressStage === 'partial_image' || partialImageData !== null;

        if (!isStreamingActive) {
          const rawError = result.error || 'Failed to generate image';
          const errorMessage = safeErrorToString(rawError);
          setError(errorMessage);
          setIsGenerating(false);
          setProgressStage('not_started');
          clearActiveImageRequest(requestId);
          onError?.(errorMessage);
        }
        // If streaming is active, don't show error - let socket determine final state
      }
    } catch (err) {
      console.error('Image generation error:', err);
      // Only show network error if socket streaming hasn't started
      const isStreamingActive =
        progressStage === 'partial_image' || partialImageData !== null;

      if (!isStreamingActive) {
        const errorMessage =
          'Network error: Unable to connect to image generation service';
        setError(errorMessage);
        setIsGenerating(false);
        setProgressStage('not_started');
        clearActiveImageRequest(requestId);
        onError?.(errorMessage);
      }
      // If streaming is active, socket will handle final state
    }
  }

  async function handleFollowUpGenerate() {
    if (
      !followUpPrompt.trim() ||
      !generatedResponseId ||
      !generatedImageId ||
      isGenerating
    ) {
      return;
    }

    const policy = aiUsagePolicy || (await loadAiUsagePolicy());
    if (
      policy &&
      typeof policy.energyRemaining === 'number' &&
      policy.energyRemaining <= 0
    ) {
      const errorMessage = 'Energy is empty. Recharge or come back tomorrow.';
      setError(errorMessage);
      onError?.(errorMessage);
      return;
    }

    setIsGenerating(true);
    setIsFollowUpGenerating(true);
    setError(null);
    setPartialImageData(null);
    setProgressStage('prompt_ready');
    const requestId = startImageRequest('follow-up');

    try {
      let referenceB64: string | undefined;
      if (generatedImageUrl) {
        referenceB64 = generatedImageUrl.split(',')[1]; // Extract base64 part
      }

      const result = await generateAIImage({
        prompt: followUpPrompt.trim(),
        previousResponseId: generatedResponseId, // Keep for backend pricing logic
        previousImageId: generatedImageId, // Keep for backend pricing logic
        referenceImageB64: referenceB64, // Send previous image as reference for Gemini
        engine: followUpEngine,
        quality: followUpEngine === 'openai' ? followUpQuality : undefined,
        requestId
      });

      if (result.aiUsagePolicy) {
        applyAiUsagePolicy(result.aiUsagePolicy);
      }

      if (result.success && result.imageUrl) {
        setGeneratedImageUrl(result.imageUrl);
        setPartialImageData(null);
        if (result.responseId) {
          setGeneratedResponseId(result.responseId);
        }
        if (result.imageId) {
          setGeneratedImageId(result.imageId);
        }
        setFollowUpPrompt('');
        setIsGenerating(false);
        setIsFollowUpGenerating(false);
        setProgressStage('completed');
        clearActiveImageRequest(requestId);
        return;
      }

      if (!result.success) {
        // Only show error if socket streaming hasn't started
        const isStreamingActive =
          progressStage === 'partial_image' || partialImageData !== null;

        if (!isStreamingActive) {
          const rawError = result.error || 'Failed to generate follow-up image';
          const errorMessage = safeErrorToString(rawError);
          setError(errorMessage);
          setIsGenerating(false);
          setIsFollowUpGenerating(false);
          setProgressStage('not_started');
          clearActiveImageRequest(requestId);
          onError?.(errorMessage);
        }
      }
    } catch (err) {
      console.error('Follow-up image generation error:', err);
      const isStreamingActive =
        progressStage === 'partial_image' || partialImageData !== null;

      if (!isStreamingActive) {
        const errorMessage =
          'Network error: Unable to connect for follow-up generation';
        setError(errorMessage);
        setIsGenerating(false);
        setIsFollowUpGenerating(false);
        setProgressStage('not_started');
        clearActiveImageRequest(requestId);
        onError?.(errorMessage);
      }
    }
  }

  async function handleUseImage() {
    const currentImageSrc =
      partialImageData ||
      generatedImageUrl ||
      referenceImageUrl ||
      drawingCanvasUrl;

    if (!currentImageSrc) return;

    try {
      const response = await fetch(currentImageSrc);
      const blob = await response.blob();

      const timestamp = Date.now();
      const file = new File([blob], `edited-image-${timestamp}.png`, {
        type: 'image/png'
      });

      onImageGenerated(file);
    } catch (err) {
      console.error('Error converting image to file:', err);
      const errorMessage = 'Failed to process generated image';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (
      event.key === 'Enter' &&
      (event.ctrlKey || event.metaKey) &&
      !isGenerating
    ) {
      event.preventDefault();
      handleGenerate();
    }
  }

  function getProgressLabel() {
    switch (progressStage) {
      case 'prompt_ready':
        return 'Generating image...';
      case 'calling_openai':
        return 'Calling OpenAI...';
      case 'calling_gemini':
        return 'Calling Nano Banana...';
      case 'in_progress':
        return 'Processing...';
      case 'generating':
        return 'Generating image...';
      case 'partial_image':
        return 'Streaming image...';
      case 'completed':
        return 'Image generated!';
      default:
        return 'Generating...';
    }
  }

  async function handleReferenceUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (file) {
      setHasBeenEdited(false);
      setGeneratedImageUrl(null);
      setGeneratedResponseId(null);
      setGeneratedImageId(null);
      setPartialImageData(null);

      // Check if image needs conversion (HEIC, TIFF, BMP, etc.)
      if (needsImageConversion(file.name)) {
        try {
          const { file: convertedFile } =
            await convertToWebFriendlyFormat(file);
          setReferenceImage(convertedFile);
          return;
        } catch (error) {
          console.warn('Image conversion failed:', error);
        }
      }

      setReferenceImage(file);
    }
  }

  function handleCanvasSave(dataUrl: string) {
    // Convert the drawn canvas to a reference image
    const blob = dataUrlToBlob(dataUrl);
    const timestamp = Date.now();
    const file = new File([blob], `drawn-reference-${timestamp}.png`, {
      type: 'image/png'
    });

    setReferenceImage(file);
    setReferenceImageUrl(dataUrl);
    setDrawingCanvasUrl(dataUrl);
    setGeneratedImageUrl(null);
    setGeneratedResponseId(null);
    setGeneratedImageId(null);
    setPartialImageData(null);
  }

  function handleRemoveReference() {
    setReferenceImage(null);
    setReferenceImageUrl(null);
    setDrawingCanvasUrl(null);
    setCanvasHasContent(false);
    setGeneratedImageUrl(null);
    setGeneratedResponseId(null);
    setGeneratedImageId(null);
    setPartialImageData(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function handleImageEdited(dataUrl: string) {
    const blob = dataUrlToBlob(dataUrl);
    const timestamp = Date.now();
    const file = new File([blob], `edited-image-${timestamp}.png`, {
      type: 'image/png'
    });

    setReferenceImage(file);
    setReferenceImageUrl(dataUrl);

    setGeneratedImageUrl(null);
    setGeneratedResponseId(null);
    setGeneratedImageId(null);
    setPartialImageData(null);
    setDrawingCanvasUrl(null);
  }

  function handleModeChange(newMode: 'text' | 'draw') {
    if (mode === 'draw' && newMode === 'text') {
      // If we switch back to text without saving, we might want to clear canvas state
      // or keep it. Currently keeping it but if user cancels in Editor it handles resetting
      if (!drawingCanvasUrl) {
        setCanvasHasContent(false);
      }
    }
    setMode(newMode);
  }

  function convertPartialImageToReference(imageData?: string) {
    const dataToUse = imageData || partialImageData;
    if (!dataToUse) return;

    try {
      const blob = dataUrlToBlob(dataToUse);
      const timestamp = Date.now();
      const file = new File([blob], `partial-image-${timestamp}.png`, {
        type: 'image/png'
      });

      setReferenceImage(file);

      setGeneratedImageUrl(null);
      setGeneratedResponseId(null);
      setGeneratedImageId(null);
      setPartialImageData(null);

      setDrawingCanvasUrl(null);
    } catch (err) {
      console.error('Failed to convert partial image to reference:', err);
    }
  }
}

function safeErrorToString(error: any): string {
  if (typeof error === 'string') {
    return error;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function parseAiImageEngine(value: unknown): AiImageEngine {
  return value === 'gemini' || value === 'openai' ? value : 'openai';
}

function parseAiImageQuality(value: unknown): AiImageQuality {
  return value === 'low' || value === 'medium' || value === 'high'
    ? value
    : 'high';
}
