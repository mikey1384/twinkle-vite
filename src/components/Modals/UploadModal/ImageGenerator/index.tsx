import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '~/contexts';
import { socket } from '~/constants/sockets/api';
import { css } from '@emotion/css';

import Header from './Header';
import InputSection from './InputSection';
import ErrorDisplay from './ErrorDisplay';
import ImageArea from './ImageArea';
import DrawingCanvas from './DrawingCanvas';
import TabButton from './TabButton';
import Icon from '~/components/Icon';

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
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(
    null
  );
  const [mode, setMode] = useState<'text' | 'draw'>('text');
  const [drawingCanvasUrl, setDrawingCanvasUrl] = useState<string | null>(null);

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
  const generationTimeoutId = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

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
          
          // If we have partial data, allow follow-up even on error
          if (partialImageData) {
            setShowFollowUp(true);
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
        
        // If we have partial data, allow follow-up even on error
        if (partialImageData) {
          setShowFollowUp(true);
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
      if (generationTimeoutId.current) {
        clearTimeout(generationTimeoutId.current);
      }
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

      <div
        className={css`
          display: flex;
          gap: 1rem;
          justify-content: center;
        `}
      >
        <TabButton onClick={() => handleModeChange('text')} active={mode === 'text'}>
          Text Prompt
        </TabButton>
        <TabButton onClick={() => handleModeChange('draw')} active={mode === 'draw'}>
          Draw Reference
        </TabButton>
      </div>

      {mode === 'text' && (
        <div
          className={css`
            display: flex;
            justify-content: center;
            margin-top: 1rem;
          `}
        >
          <label
            className={css`
              display: inline-flex;
              align-items: center;
              justify-content: center;
              gap: 1rem;
              padding: 1.25rem 2.5rem;
              background: transparent;
              border: 3px dashed #007bff;
              border-radius: 20px;
              cursor: pointer;
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              font-size: 1.1rem;
              font-weight: 700;
              color: #007bff;
              position: relative;
              overflow: hidden;
              min-width: 220px;

              &::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(
                  90deg,
                  transparent,
                  rgba(0, 123, 255, 0.1),
                  transparent
                );
                transition: left 0.5s ease;
              }

              &:hover {
                border-color: #0056b3;
                color: #0056b3;
                transform: translateY(-3px) scale(1.02);
                box-shadow: 0 8px 25px rgba(0, 123, 255, 0.2);

                &::before {
                  left: 100%;
                }
              }

              &:active {
                transform: translateY(-1px) scale(0.98);
                box-shadow: 0 4px 15px rgba(0, 123, 255, 0.15);
              }
            `}
          >
            <Icon icon="image" />
            Add Image
            <input
              type="file"
              accept="image/*"
              onChange={handleReferenceUpload}
              className={css`
                display: none;
              `}
            />
          </label>
        </div>
      )}

      {mode === 'draw' && <DrawingCanvas onSave={handleCanvasSave} />}

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
      />
    </div>
  );

  async function handleGenerate() {
    if (!prompt.trim() || isGenerating) return;

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
      let referenceB64: string | undefined;
      if (referenceImage) {
        referenceB64 = await fileToBase64(referenceImage);
      } else if (mode === 'draw' && drawingCanvasUrl) {
        referenceB64 = drawingCanvasUrl.split(',')[1];
      }

      const result = await generateAIImage({
        prompt: prompt.trim(),
        referenceImageB64: referenceB64
      });

      if (!result.success) {
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
    } catch (err) {
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

    if (generationTimeoutId.current) {
      clearTimeout(generationTimeoutId.current);
      generationTimeoutId.current = null;
    }

    setIsGenerating(true);
    setIsFollowUpGenerating(true);
    setError(null);
    setPartialImageData(null);
    setProgressStage('prompt_ready');

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
    } catch (err) {
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
    const currentImageSrc = partialImageData || generatedImageUrl || referenceImageUrl || drawingCanvasUrl;

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

  function handleReferenceUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      setReferenceImage(file);
      setGeneratedImageUrl(null);
      setGeneratedResponseId(null);
      setGeneratedImageId(null);
      setShowFollowUp(false);
      setPartialImageData(null);
    }
  }

  function handleCanvasSave(dataUrl: string) {
    setDrawingCanvasUrl(dataUrl);
    setGeneratedImageUrl(null);
    setGeneratedResponseId(null);
    setGeneratedImageId(null);
    setShowFollowUp(false);
    setPartialImageData(null);
  }

  function handleRemoveReference() {
    setReferenceImage(null);
    setReferenceImageUrl(null);
    setDrawingCanvasUrl(null);
  }

  function handleImageEdited(dataUrl: string) {
    if (generatedImageUrl) {
      setGeneratedImageUrl(dataUrl);
    } else if (referenceImageUrl) {
      setReferenceImageUrl(dataUrl);
      const blob = dataUrlToBlob(dataUrl);
      const file = new File([blob], 'edited-reference.png', { type: 'image/png' });
      setReferenceImage(file);
    } else if (drawingCanvasUrl) {
      setDrawingCanvasUrl(dataUrl);
    }
  }

  function handleModeChange(newMode: 'text' | 'draw') {
    if (mode === 'draw' && newMode === 'text') {
      setDrawingCanvasUrl(null);
    }
    if (mode === 'text' && newMode === 'draw') {
      setReferenceImage(null);
      setReferenceImageUrl(null);
    }
    setMode(newMode);
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
