import React, { useState, useEffect } from 'react';
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
  const [error, setError] = useState<string | null>(null);
  const [progressStage, setProgressStage] = useState<string>('not_started');
  const [partialImageData, setPartialImageData] = useState<string | null>(null);
  const [isFollowUpGenerating, setIsFollowUpGenerating] = useState(false);

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
      imageId?: string;
      responseId?: string;
    }) => {
      setProgressStage(status.stage);

      if (status.stage === 'partial_image' && status.partialImageB64) {
        setPartialImageData(`data:image/png;base64,${status.partialImageB64}`);
      } else if (status.stage === 'completed') {
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
        setIsGenerating(false);
        setIsFollowUpGenerating(false);
      } else if (status.stage === 'error') {
        const errorMessage =
          status.error || 'An error occurred during image generation';
        setError(errorMessage);
        setIsGenerating(false);
        setIsFollowUpGenerating(false);
        setProgressStage('not_started');
        onError?.(errorMessage);
      }
    };

    socket.on('image_generation_status_received', handleImageGenerationStatus);

    return () => {
      socket.off(
        'image_generation_status_received',
        handleImageGenerationStatus
      );
    };
  });

  async function handleGenerate() {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedImageUrl(null);
    setPartialImageData(null);
    setProgressStage('prompt_ready');
    setShowFollowUp(false);
    setGeneratedResponseId(null);
    setIsFollowUpGenerating(false);

    try {
      const result = await generateAIImage({
        prompt: prompt.trim()
      });

      // For non-streaming response, handle it directly
      if (result.success && result.imageUrl) {
        setGeneratedImageUrl(result.imageUrl);
        if (result.responseId) {
          setGeneratedResponseId(result.responseId);
        }
        if (result.imageId) {
          setGeneratedImageId(result.imageId);
        }
        setShowFollowUp(true);
        setIsGenerating(false);
        setProgressStage('completed');
      } else {
        const errorMessage = result.error || 'Failed to generate image';
        setError(errorMessage);
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

    setIsGenerating(true);
    setIsFollowUpGenerating(true);
    setError(null);
    setPartialImageData(null);
    setProgressStage('prompt_ready');

    try {
      const result = await generateAIImage({
        prompt: followUpPrompt.trim(),
        previousResponseId: generatedResponseId,
        previousImageId: generatedImageId
      });

      if (result.success && result.imageUrl) {
        setGeneratedImageUrl(result.imageUrl);
        if (result.responseId) {
          setGeneratedResponseId(result.responseId);
        }
        if (result.imageId) {
          setGeneratedImageId(result.imageId);
        }
        setIsGenerating(false);
        setIsFollowUpGenerating(false);
        setProgressStage('completed');
        setFollowUpPrompt('');
      } else {
        const errorMessage =
          result.error || 'Failed to generate follow-up image';
        setError(errorMessage);
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
    if (!generatedImageUrl) return;

    try {
      let blob: Blob;

      if (generatedImageUrl.startsWith('data:image/')) {
        const response = await fetch(generatedImageUrl);
        blob = await response.blob();
      } else {
        const response = await fetch(generatedImageUrl);
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
