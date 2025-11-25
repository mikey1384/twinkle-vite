import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAppContext, useKeyContext } from '~/contexts';
import { socket } from '~/constants/sockets/api';
import { css } from '@emotion/css';

import InputSection from './InputSection';
import ErrorDisplay from './ErrorDisplay';
import ImageArea from './ImageArea';
import ImageEditor from './ImageEditor';
import FilterBar from '~/components/FilterBar';
import Icon from '~/components/Icon';

interface ImageGeneratorProps {
  onImageGenerated: (file: File) => void;
  onBack: () => void;
  onError?: (error: string) => void;
  onUseImageAvailabilityChange?: (available: boolean) => void;
  onRegisterUseImageHandler?: (
    handler: (() => void | Promise<void>) | null
  ) => void;
}

export default function ImageGenerator({
  onImageGenerated,
  onError,
  onUseImageAvailabilityChange,
  onRegisterUseImageHandler
}: ImageGeneratorProps) {
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
  // Hardcoded to 'openai' (image-1) - Gemini is unstable
  const [engine, setEngine] = useState<'gemini' | 'openai'>('openai');
  const [followUpEngine, setFollowUpEngine] = useState<'gemini' | 'openai'>(
    'openai'
  );
  const [drawingCanvasUrl, setDrawingCanvasUrl] = useState<string | null>(null);
  const [canvasHasContent, setCanvasHasContent] = useState(false);

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

  const twinkleCoins = useKeyContext((v) => v.myState.twinkleCoins);
  const userId = useKeyContext((v) => v.myState.userId);
  const userSettings = useKeyContext((v) => v.myState.settings);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);

  useEffect(() => {
    // Always use 'openai' (image-1) - ignoring user preferences since Gemini is unstable
    setEngine('openai');
    setFollowUpEngine('openai');

    // Original code kept for reference:
    // const preferredEngine =
    //   userSettings?.aiImage?.engine === 'openai' ? 'openai' : 'gemini';
    // setEngine(preferredEngine);
    //
    // const preferredFollowUp =
    //   userSettings?.aiImage?.followUpEngine ||
    //   userSettings?.aiImage?.engine ||
    //   null;
    // if (preferredFollowUp) {
    //   setFollowUpEngine(preferredFollowUp === 'openai' ? 'openai' : 'gemini');
    // }
  }, [userSettings?.aiImage?.engine, userSettings?.aiImage?.followUpEngine]);

  const IMAGE_GENERATION_COST = 10000;
  const FOLLOW_UP_COST = 1000;

  const canAffordGeneration = useMemo(() => {
    return twinkleCoins >= IMAGE_GENERATION_COST;
  }, [twinkleCoins, IMAGE_GENERATION_COST]);

  const canAffordFollowUp = useMemo(() => {
    return twinkleCoins >= FOLLOW_UP_COST;
  }, [twinkleCoins, FOLLOW_UP_COST]);

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
      coins?: number;
    }) => {
      try {
        setProgressStage(status.stage);

        if (status.stage === 'partial_image' && status.partialImageB64) {
          setGeneratedImageUrl(null);
          setPartialImageData(
            `data:image/png;base64,${status.partialImageB64}`
          );
        } else if (status.stage === 'completed') {
          if (status.imageUrl) {
            setGeneratedImageUrl(status.imageUrl);
            if (status.responseId) {
              setGeneratedResponseId(status.responseId);
            }
            if (status.imageId) {
              setGeneratedImageId(status.imageId);
            }
            // showFollowUp is now computed based on generatedImageUrl
          }

          // Update coin balance if provided by server
          if (typeof status.coins === 'number' && userId) {
            onSetUserState({
              userId,
              newState: { twinkleCoins: status.coins }
            });
          }

          if (isFollowUpGenerating) {
            setFollowUpPrompt('');
          }
          setIsGenerating(false);
          setIsFollowUpGenerating(false);
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

          if (typeof status.coins === 'number' && userId) {
            onSetUserState({
              userId,
              newState: { twinkleCoins: status.coins }
            });
          }

          setIsGenerating(false);
          setIsFollowUpGenerating(false);
          setProgressStage('not_started');
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
    followUpEngine: followUp
  }: {
    engine?: 'gemini' | 'openai';
    followUpEngine?: 'gemini' | 'openai';
  }) {
    if (!userId) return;
    try {
      const result = await updateImageGenerationSettings({
        engine: initialEngine,
        followUpEngine: followUp
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

  return (
    <div
      className={css`
        padding: 1rem;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        min-height: 400px;
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
              padding: 1rem 2rem;
              background: transparent;
              border: 2px dashed ${isShowingLoadingState ? '#ccc' : '#007bff'};
              border-radius: 10px;
              cursor: ${isShowingLoadingState ? 'not-allowed' : 'pointer'};
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              font-size: 1rem;
              font-weight: 600;
              color: ${isShowingLoadingState ? '#ccc' : '#007bff'};
              position: relative;
              overflow: hidden;
              min-width: 200px;
              opacity: ${isShowingLoadingState ? 0.5 : 1};

              &:hover {
                background: rgba(0, 123, 255, 0.05);
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

      <InputSection
        prompt={prompt}
        onPromptChange={setPrompt}
        onGenerate={handleGenerate}
        onKeyDown={handleKeyDown}
        isGenerating={isGenerating}
        canAffordGeneration={canAffordGeneration}
        generationCost={IMAGE_GENERATION_COST}
        twinkleCoins={twinkleCoins}
        engine={engine}
        onEngineChange={handleEngineChange}
      />

      {error && <ErrorDisplay error={error} onDismiss={() => setError(null)} />}

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
        followUpCost={FOLLOW_UP_COST}
        followUpEngine={followUpEngine}
        onFollowUpEngineChange={handleFollowUpEngineChange}
      />
    </div>
  );

  async function handleGenerate() {
    if (!prompt.trim() || isGenerating) return;

    // Check if user can afford image generation
    if (!canAffordGeneration) {
      const errorMessage = `Insufficient coins. You need ${IMAGE_GENERATION_COST.toLocaleString()} coins to generate an image.`;
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
        engine
      });

      if (!result.success) {
        const rawError = result.error || 'Failed to generate image';
        const errorMessage = safeErrorToString(rawError);
        setError(errorMessage);
        if (typeof result.coins === 'number' && userId) {
          onSetUserState({
            userId,
            newState: { twinkleCoins: result.coins }
          });
        }
        setIsGenerating(false);
        setProgressStage('not_started');
        onError?.(errorMessage);
      }
    } catch (err) {
      console.error('Image generation error:', err);
      const errorMessage =
        'Network error: Unable to connect to image generation service';
      setError(errorMessage);
      setIsGenerating(false);
      setProgressStage('not_started');
      onError?.(errorMessage);
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

    if (!canAffordFollowUp) {
      const errorMessage = `Insufficient coins. You need ${FOLLOW_UP_COST.toLocaleString()} coins for follow-up generation.`;
      setError(errorMessage);
      onError?.(errorMessage);
      return;
    }

    setIsGenerating(true);
    setIsFollowUpGenerating(true);
    setError(null);
    setPartialImageData(null);
    setProgressStage('prompt_ready');

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
        engine: followUpEngine
      });

      if (!result.success) {
        const rawError = result.error || 'Failed to generate follow-up image';
        const errorMessage = safeErrorToString(rawError);
        setError(errorMessage);
        if (typeof result.coins === 'number' && userId) {
          onSetUserState({
            userId,
            newState: { twinkleCoins: result.coins }
          });
        }
        setIsGenerating(false);
        setIsFollowUpGenerating(false);
        setProgressStage('not_started');
        onError?.(errorMessage);
      }
    } catch (err) {
      console.error('Follow-up image generation error:', err);
      const errorMessage =
        'Network error: Unable to connect for follow-up generation';
      setError(errorMessage);
      setIsGenerating(false);
      setIsFollowUpGenerating(false);
      setProgressStage('not_started');
      onError?.(errorMessage);
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
      const file = new File([blob], `ai-generated-${timestamp}.png`, {
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

  function handleReferenceUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (file) {
      setHasBeenEdited(false);
      setReferenceImage(file);
      setGeneratedImageUrl(null);
      setGeneratedResponseId(null);
      setGeneratedImageId(null);
      setPartialImageData(null);
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

  function dataUrlToBlob(dataUrl: string): Blob {
    const parts = dataUrl.split(',');
    const byteString = atob(parts[1]);
    const mimeString = parts[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  }

  async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = (error) => reject(error);
    });
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
