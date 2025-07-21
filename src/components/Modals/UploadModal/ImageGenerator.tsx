import React, { useState, useCallback, useEffect } from 'react';
import { useAppContext } from '~/contexts';
import { socket } from '~/constants/sockets/api';
import { isMobile } from '~/helpers';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

const deviceIsMobile = isMobile(navigator);

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
  const [originalPrompt, setOriginalPrompt] = useState<string>('');
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressStage, setProgressStage] = useState<string>('not_started');
  const [partialImageData, setPartialImageData] = useState<string | null>(null);

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
      imageId?: string; // New
      responseId?: string;
    }) => {
      setProgressStage(status.stage);

      if (status.stage === 'partial_image' && status.partialImageB64) {
        setPartialImageData(`data:image/png;base64,${status.partialImageB64}`);
      } else if (status.stage === 'completed') {
        if (status.imageUrl) {
          setGeneratedImageUrl(status.imageUrl);
          setOriginalPrompt(prompt.trim());
          if (status.responseId) {
            setGeneratedResponseId(status.responseId);
          }
          if (status.imageId) {
            setGeneratedImageId(status.imageId);
          }
          setShowFollowUp(true);
        }
        setIsGenerating(false);
      } else if (status.stage === 'error') {
        const errorMessage =
          status.error || 'An error occurred during image generation';
        setError(errorMessage);
        setIsGenerating(false);
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

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedImageUrl(null);
    setPartialImageData(null);
    setProgressStage('prompt_ready');
    setShowFollowUp(false);
    setGeneratedResponseId(null);
    setOriginalPrompt('');

    try {
      const result = await generateAIImage({
        prompt: prompt.trim()
      });

      // For non-streaming response, handle it directly
      if (result.success && result.imageUrl) {
        setGeneratedImageUrl(result.imageUrl);
        setOriginalPrompt(prompt.trim());
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt, isGenerating]);

  const handleFollowUpGenerate = useCallback(async () => {
    if (
      !followUpPrompt.trim() ||
      !generatedResponseId ||
      !generatedImageId ||
      isGenerating
    ) {
      return;
    }

    setIsGenerating(true);
    setError(null);
    setPartialImageData(null);
    setProgressStage('prompt_ready');

    try {
      const result = await generateAIImage({
        prompt: followUpPrompt.trim(),
        previousResponseId: generatedResponseId,
        previousImageId: generatedImageId // New
      });

      if (result.success && result.imageUrl) {
        setGeneratedImageUrl(result.imageUrl);
        if (result.responseId) {
          setGeneratedResponseId(result.responseId);
        }
        if (result.imageId) {
          // Update with new imageId
          setGeneratedImageId(result.imageId);
        }
        setIsGenerating(false);
        setProgressStage('completed');
        setFollowUpPrompt('');
      } else {
        const errorMessage =
          result.error || 'Failed to generate follow-up image';
        setError(errorMessage);
        setIsGenerating(false);
        setProgressStage('not_started');
        onError?.(errorMessage);
      }
    } catch (err) {
      console.error('Follow-up image generation error:', err);
      const errorMessage =
        'Network error: Unable to connect for follow-up generation';
      setError(errorMessage);
      setIsGenerating(false);
      setProgressStage('not_started');
      onError?.(errorMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    followUpPrompt,
    generatedResponseId,
    generatedImageId,
    isGenerating,
    originalPrompt
  ]);

  const handleUseImage = useCallback(async () => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatedImageUrl]);

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (
      event.key === 'Enter' &&
      (event.ctrlKey || event.metaKey) &&
      !isGenerating
    ) {
      event.preventDefault();
      handleGenerate();
    }
  };

  const getProgressLabel = () => {
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
  };

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
      {/* Header */}
      <div
        className={css`
          text-align: center;
          margin-bottom: -0.5rem;
        `}
      >
        <h2
          className={css`
            font-size: 1.75rem;
            font-weight: 700;
            color: ${Color.logoBlue()};
            margin: 0 0 0.5rem 0;
            letter-spacing: -0.02em;
          `}
        >
          AI Image Generator ✨
        </h2>
        <p
          className={css`
            color: ${Color.darkerGray()};
            font-size: 1rem;
            margin: 0;
            font-weight: 400;
          `}
        >
          Describe your vision and watch it come to life!
        </p>
      </div>

      {/* Input Section */}
      <div
        className={css`
          background: ${Color.white()};
          border-radius: 20px;
          padding: 1.5rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          border: 1px solid ${Color.borderGray()};
        `}
      >
        <div
          className={css`
            display: flex;
            gap: 1rem;
            align-items: flex-end;
            flex-direction: ${deviceIsMobile ? 'column' : 'row'};
          `}
        >
          <div
            className={css`
              flex: 1;
              width: 100%;
            `}
          >
            <label
              className={css`
                display: block;
                font-size: 0.9rem;
                font-weight: 600;
                color: ${Color.black()};
                margin-bottom: 0.5rem;
              `}
            >
              Prompt
              <span
                className={css`
                  font-weight: 400;
                  color: ${Color.gray()};
                  font-size: 0.8rem;
                  margin-left: 0.5rem;
                `}
              >
                (Ctrl+Enter to generate)
              </span>
            </label>
            <textarea
              placeholder="A serene mountain landscape at sunset with a crystal-clear lake reflecting the orange and pink hues of the sky, surrounded by snow-capped peaks and tall pine trees..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isGenerating}
              rows={3}
              className={css`
                width: 100%;
                padding: 1rem 1.25rem;
                border: 2px solid ${Color.borderGray()};
                border-radius: 16px;
                font-size: 1rem;
                outline: none;
                transition: all 0.2s ease;
                background: ${Color.whiteGray()};
                box-sizing: border-box;
                font-family: inherit;
                resize: vertical;
                min-height: 80px;
                max-height: 200px;

                &:focus {
                  border-color: ${Color.logoBlue()};
                  box-shadow: 0 0 0 3px ${Color.lightBlue(0.1)};
                }

                &:disabled {
                  background: ${Color.highlightGray()};
                  cursor: not-allowed;
                  color: ${Color.gray()};
                }

                &::placeholder {
                  color: ${Color.gray()};
                }
              `}
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className={css`
              padding: 1rem 2rem;
              background: ${!prompt.trim() || isGenerating
                ? Color.darkerGray()
                : Color.logoBlue()};
              color: white;
              border: none;
              border-radius: 16px;
              font-size: 1rem;
              font-weight: 600;
              cursor: ${!prompt.trim() || isGenerating
                ? 'not-allowed'
                : 'pointer'};
              transition: all 0.2s ease;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              min-width: ${deviceIsMobile ? '100%' : '140px'};
              white-space: nowrap;

              &:hover:not(:disabled) {
                transform: translateY(-1px);
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
              }

              &:active:not(:disabled) {
                transform: translateY(0);
              }
            `}
          >
            {isGenerating ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          className={css`
            background: ${Color.lightRed(0.2)};
            border: 1px solid ${Color.red()};
            border-radius: 16px;
            padding: 1.25rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 1px 3px ${Color.red(0.1)};
          `}
        >
          <div
            className={css`
              display: flex;
              align-items: center;
              gap: 0.75rem;
            `}
          >
            <div
              className={css`
                width: 6px;
                height: 6px;
                background: ${Color.red()};
                border-radius: 50%;
              `}
            />
            <span
              className={css`
                color: ${Color.red()};
                font-weight: 500;
                font-size: 0.95rem;
              `}
            >
              {error}
            </span>
          </div>
          <button
            onClick={() => setError(null)}
            className={css`
              background: none;
              border: none;
              color: ${Color.red()};
              cursor: pointer;
              padding: 0.5rem;
              border-radius: 8px;
              font-size: 1.25rem;
              line-height: 1;
              transition: background-color 0.2s ease;

              &:hover {
                background: ${Color.red(0.1)};
              }
            `}
          >
            ×
          </button>
        </div>
      )}

      {/* Image Area */}
      <div
        className={css`
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        `}
      >
        {partialImageData || generatedImageUrl ? (
          <div
            className={css`
              background: ${Color.white()};
              border-radius: 20px;
              padding: 1.5rem;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              border: 1px solid ${Color.borderGray()};
            `}
          >
            {/* Image */}
            <div
              className={css`
                background: ${Color.highlightGray()};
                border: 2px solid ${Color.borderGray()};
                border-radius: 16px;
                overflow: hidden;
                aspect-ratio: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                margin-bottom: 1.5rem;
              `}
            >
              <img
                src={partialImageData || generatedImageUrl || ''}
                alt="Generated image"
                className={css`
                  max-width: 100%;
                  max-height: 100%;
                  object-fit: contain;
                  transition: opacity 0.3s ease;
                  ${partialImageData && !generatedImageUrl
                    ? 'opacity: 0.7;'
                    : ''}
                `}
              />
              {isGenerating && (
                <div
                  className={css`
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    background: ${Color.logoBlue(0.9)};
                    color: white;
                    padding: 0.5rem 1rem;
                    border-radius: 12px;
                    font-size: 0.85rem;
                    font-weight: 500;
                    backdrop-filter: blur(8px);
                  `}
                >
                  {getProgressLabel()}
                </div>
              )}
            </div>

            {/* Follow-up input */}
            {showFollowUp && generatedImageUrl && !isGenerating && (
              <div
                className={css`
                  border-top: 1px solid ${Color.borderGray()};
                  padding-top: 1.5rem;
                  margin-bottom: -0.5rem;
                `}
              >
                <label
                  className={css`
                    display: block;
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: ${Color.black()};
                    margin-bottom: 0.75rem;
                  `}
                >
                  Modify this image
                </label>
                <div
                  className={css`
                    display: flex;
                    gap: 1rem;
                    align-items: flex-end;
                    flex-direction: ${deviceIsMobile ? 'column' : 'row'};
                  `}
                >
                  <input
                    placeholder="Make it more colorful, add mountains, change to winter..."
                    value={followUpPrompt}
                    onChange={(e) => setFollowUpPrompt(e.target.value)}
                    onKeyPress={(event) => {
                      if (event.key === 'Enter' && !isGenerating) {
                        handleFollowUpGenerate();
                      }
                    }}
                    disabled={isGenerating}
                    className={css`
                      flex: 1;
                      padding: 0.875rem 1rem;
                      border: 2px solid ${Color.borderGray()};
                      border-radius: 10px;
                      font-size: 0.95rem;
                      outline: none;
                      transition: all 0.2s ease;
                      width: 100%;
                      box-sizing: border-box;

                      &:focus {
                        border-color: ${Color.orange()};
                        box-shadow: 0 0 0 3px ${Color.orange(0.1)};
                      }

                      &::placeholder {
                        color: ${Color.gray()};
                      }
                    `}
                  />
                  <button
                    onClick={handleFollowUpGenerate}
                    disabled={!followUpPrompt.trim() || isGenerating}
                    className={css`
                      padding: 0.875rem 1.5rem;
                      background: ${!followUpPrompt.trim() || isGenerating
                        ? Color.darkerGray()
                        : Color.orange()};
                      color: white;
                      border: none;
                      border-radius: 10px;
                      font-size: 0.95rem;
                      font-weight: 600;
                      cursor: ${!followUpPrompt.trim() || isGenerating
                        ? 'not-allowed'
                        : 'pointer'};
                      transition: all 0.2s ease;
                      min-width: ${deviceIsMobile ? '100%' : '120px'};
                      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

                      &:hover:not(:disabled) {
                        transform: translateY(-1px);
                        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
                      }
                    `}
                  >
                    {isGenerating ? 'Modifying...' : 'Modify'}
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            {generatedImageUrl && !isGenerating && (
              <div
                className={css`
                  display: flex;
                  gap: 1rem;
                  justify-content: space-between;
                  align-items: center;
                  ${showFollowUp
                    ? ''
                    : 'border-top: 1px solid ${Color.borderGray()}; padding-top: 1.5rem; margin-top: -0.5rem;'}
                `}
              >
                <button
                  onClick={handleUseImage}
                  className={css`
                    padding: 0.875rem 2rem;
                    background: ${Color.green()};
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-size: 0.95rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);

                    &:hover {
                      transform: translateY(-1px);
                      box-shadow: 0 8px 12px -1px rgba(0, 0, 0, 0.15);
                    }
                  `}
                >
                  Use This Image
                </button>
              </div>
            )}
          </div>
        ) : (
          <div
            className={css`
              background: ${Color.white()};
              border-radius: 20px;
              padding: 2rem;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              border: 1px solid ${Color.borderGray()};
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 300px;
            `}
          >
            <div
              className={css`
                background: ${Color.highlightGray()};
                border: 2px dashed ${Color.borderGray()};
                border-radius: 16px;
                width: 100%;
                aspect-ratio: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                color: ${Color.gray()};
                font-size: 1rem;
                text-align: center;
                position: relative;
              `}
            >
              {isGenerating ? (
                <div
                  className={css`
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1rem;
                  `}
                >
                  <div
                    className={css`
                      width: 32px;
                      height: 32px;
                      border: 4px solid ${Color.borderGray()};
                      border-top: 4px solid ${Color.logoBlue()};
                      border-radius: 50%;
                      animation: spin 1s linear infinite;

                      @keyframes spin {
                        0% {
                          transform: rotate(0deg);
                        }
                        100% {
                          transform: rotate(360deg);
                        }
                      }
                    `}
                  />
                  <div
                    className={css`
                      font-weight: 600;
                      color: ${Color.black()};
                      font-size: 1.1rem;
                    `}
                  >
                    {getProgressLabel()}
                  </div>
                </div>
              ) : (
                <div
                  className={css`
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.75rem;
                  `}
                >
                  <div
                    className={css`
                      width: 48px;
                      height: 48px;
                      background: ${Color.logoBlue()};
                      border-radius: 50%;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      font-size: 1.5rem;
                    `}
                  >
                    🎨
                  </div>
                  <span
                    className={css`
                      font-weight: 500;
                      font-size: 1rem;
                    `}
                  >
                    Your generated image will appear here
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
