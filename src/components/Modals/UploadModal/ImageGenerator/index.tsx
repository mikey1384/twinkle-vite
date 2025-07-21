import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '~/contexts';
import { socket } from '~/constants/sockets/api';
import { css } from '@emotion/css';

import Header from './Header';
import InputSection from './InputSection';
import ErrorDisplay from './ErrorDisplay';
import ImageArea from './ImageArea';

interface ImageGeneratorProps {
  onImageGenerated: (file: File) => void;
  onBack: () => void;
  onError?: (error: string) => void;
}

export default function ImageGenerator({
  onImageGenerated,
  onError
}: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [followUpPrompt, setFollowUpPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(
    null
  );
  const [generatedResponseId, setGeneratedResponseId] = useState<string | null>(
    null
  );
  const [generatedImageId, setGeneratedImageId] = useState<string | null>(null);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [error, setErrorRaw] = useState<any>(null);

  const setError = (err: any) => {
    console.log('setError called with:', err, typeof err);
    if (err === null) {
      setErrorRaw(null);
    } else {
      setErrorRaw(safeErrorToString(err));
    }
  };
  const [progressStage, setProgressStage] = useState<string>('not_started');
  const [partialImageData, setPartialImageData] = useState<string | null>(null);
  const [isFollowUpGenerating, setIsFollowUpGenerating] = useState(false);
  const generationTimeoutId = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  console.log(error);

  const generateAIImage = useAppContext(
    (v) => v.requestHelpers.generateAIImage
  );

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
    }) => {
      try {
        setProgressStage(status.stage);

        if (status.stage === 'partial_image' && status.partialImageB64) {
          setPartialImageData(
            `data:image/png;base64,${status.partialImageB64}`
          );
        } else if (status.stage === 'completed') {
          // Clear timeout when generation completes successfully
          if (generationTimeoutId.current) {
            clearTimeout(generationTimeoutId.current);
            generationTimeoutId.current = null;
          }

          if (status.imageUrl) {
            setGeneratedImageUrl(status.imageUrl);
            if (status.responseId) {
              setGeneratedResponseId(status.responseId);
            }
            if (status.imageId) {
              setGeneratedImageId(status.imageId);
            }
            setShowFollowUp(true);
          }
          if (isFollowUpGenerating) {
            setFollowUpPrompt('');
          }
          setIsGenerating(false);
          setIsFollowUpGenerating(false);
        } else if (status.stage === 'error') {
          // Clear timeout when error occurs
          if (generationTimeoutId.current) {
            clearTimeout(generationTimeoutId.current);
            generationTimeoutId.current = null;
          }

          const rawError =
            status.error ||
            status.message ||
            'An error occurred during image generation';
          const errorMessage = safeErrorToString(rawError);
          setError(errorMessage);
          setIsGenerating(false);
          setIsFollowUpGenerating(false);
          setProgressStage('not_started');
          onError?.(errorMessage);
        }
      } catch (err) {
        console.error('Error handling image generation status:', err);
        // Fallback error handling to prevent crashes
        const fallbackMessage = 'Error processing image generation response';
        setError(fallbackMessage);
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
      if (generationTimeoutId.current) {
        clearTimeout(generationTimeoutId.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGenerate() {
    if (!prompt.trim() || isGenerating) return;

    // Clear existing timeout if any
    if (generationTimeoutId.current) {
      clearTimeout(generationTimeoutId.current);
      generationTimeoutId.current = null;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImageUrl(null);
    setPartialImageData(null);
    setProgressStage('prompt_ready');
    setShowFollowUp(false);
    setGeneratedResponseId(null);
    setGeneratedImageId(null);
    setIsFollowUpGenerating(false);

    // Set a timeout for generation (3 minutes)
    const timeoutId = setTimeout(() => {
      const timeoutMessage = 'Image generation timed out. Please try again.';
      setError(timeoutMessage);
      setIsGenerating(false);
      setIsFollowUpGenerating(false);
      setProgressStage('not_started');
      onError?.(timeoutMessage);
    }, 180000);
    generationTimeoutId.current = timeoutId;

    try {
      const result = await generateAIImage({
        prompt: prompt.trim()
      });
      console.log('API result:', result);

      if (!result.success) {
        // Clear timeout on error
        if (generationTimeoutId.current) {
          clearTimeout(generationTimeoutId.current);
          generationTimeoutId.current = null;
        }
        const rawError = result.error || 'Failed to generate image';
        const errorMessage = safeErrorToString(rawError);
        setError(errorMessage);
        setIsGenerating(false);
        setProgressStage('not_started');
        onError?.(errorMessage);
      }
      // No further handling here; socket will manage progress/completion
    } catch (err) {
      // Clear timeout on error
      if (generationTimeoutId.current) {
        clearTimeout(generationTimeoutId.current);
        generationTimeoutId.current = null;
      }

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

    // Clear existing timeout if any
    if (generationTimeoutId.current) {
      clearTimeout(generationTimeoutId.current);
      generationTimeoutId.current = null;
    }

    setIsGenerating(true);
    setIsFollowUpGenerating(true);
    setError(null);
    setPartialImageData(null);
    setProgressStage('prompt_ready');

    // Set a timeout for follow-up generation (3 minutes)
    const timeoutId = setTimeout(() => {
      const timeoutMessage =
        'Follow-up image generation timed out. Please try again.';
      setError(timeoutMessage);
      setIsGenerating(false);
      setIsFollowUpGenerating(false);
      setProgressStage('not_started');
      onError?.(timeoutMessage);
    }, 180000);
    generationTimeoutId.current = timeoutId;

    try {
      const result = await generateAIImage({
        prompt: followUpPrompt.trim(),
        previousResponseId: generatedResponseId,
        previousImageId: generatedImageId
      });

      if (!result.success) {
        // Clear timeout on error
        if (generationTimeoutId.current) {
          clearTimeout(generationTimeoutId.current);
          generationTimeoutId.current = null;
        }
        const rawError = result.error || 'Failed to generate follow-up image';
        const errorMessage = safeErrorToString(rawError);
        setError(errorMessage);
        setIsGenerating(false);
        setIsFollowUpGenerating(false);
        setProgressStage('not_started');
        onError?.(errorMessage);
      }
      // No further handling here; socket will manage progress/completion (including clearing prompt)
    } catch (err) {
      // Clear timeout on error
      if (generationTimeoutId.current) {
        clearTimeout(generationTimeoutId.current);
        generationTimeoutId.current = null;
      }

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
    // Use the most current image - partial data takes priority over generated URL
    const currentImageSrc = partialImageData || generatedImageUrl;

    if (!currentImageSrc) return;

    try {
      let blob: Blob;

      if (currentImageSrc.startsWith('data:image/')) {
        const response = await fetch(currentImageSrc);
        blob = await response.blob();
      } else {
        const response = await fetch(currentImageSrc);
        blob = await response.blob();
      }

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

  function getProgressLabel() {
    switch (progressStage) {
      case 'prompt_ready':
        return 'Preparing prompt...';
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
      case 'downloading':
        return 'Downloading...';
      default:
        return 'Generating...';
    }
  }

  return (
    <div
      className={css`
        padding: 2rem;
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 2rem;
        min-height: 600px;
      `}
    >
      <Header />

      <InputSection
        prompt={prompt}
        onPromptChange={setPrompt}
        onGenerate={handleGenerate}
        onKeyDown={handleKeyDown}
        isGenerating={isGenerating}
      />

      {error && <ErrorDisplay error={error} onDismiss={() => setError(null)} />}

      <ImageArea
        partialImageData={partialImageData}
        generatedImageUrl={generatedImageUrl}
        isGenerating={isGenerating}
        isFollowUpGenerating={isFollowUpGenerating}
        showFollowUp={showFollowUp}
        followUpPrompt={followUpPrompt}
        onFollowUpPromptChange={setFollowUpPrompt}
        onFollowUpGenerate={handleFollowUpGenerate}
        onUseImage={handleUseImage}
        getProgressLabel={getProgressLabel}
      />
    </div>
  );
}
