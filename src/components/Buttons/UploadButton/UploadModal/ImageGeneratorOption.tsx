import React, { useState, useCallback, useEffect } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import Input from '~/components/Texts/Input';
import Loading from '~/components/Loading';
import { useKeyContext, useAppContext } from '~/contexts';
import { Color } from '~/constants/css';
import { socket } from '~/constants/sockets/api';

interface ImageGeneratorOptionProps {
  onImageGenerated: (file: File) => void;
  onBack: () => void;
}

export default function ImageGeneratorOption({
  onImageGenerated
}: ImageGeneratorOptionProps) {
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

  const {
    button: { color: buttonColor },
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);

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
        setError(status.error || 'An error occurred during image generation');
        setIsGenerating(false);
        setProgressStage('not_started');
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
          // New
          setGeneratedImageId(result.imageId);
        }
        setShowFollowUp(true);
        setIsGenerating(false);
        setProgressStage('completed');
      } else {
        setError(result.error || 'Failed to generate image');
        setIsGenerating(false);
        setProgressStage('not_started');
      }
    } catch (err) {
      console.error('Image generation error:', err);
      setError('An error occurred while generating the image');
      setIsGenerating(false);
      setProgressStage('not_started');
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
        setError(result.error || 'Failed to generate follow-up image');
        setIsGenerating(false);
        setProgressStage('not_started');
      }
    } catch (err) {
      console.error('Follow-up image generation error:', err);
      setError('An error occurred while generating the follow-up image');
      setIsGenerating(false);
      setProgressStage('not_started');
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

      // Check if it's a base64 data URL
      if (generatedImageUrl.startsWith('data:image/')) {
        // Convert base64 to blob
        const response = await fetch(generatedImageUrl);
        blob = await response.blob();
      } else {
        // It's a regular URL, fetch it
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
      setError('Failed to process generated image');
    }
  }, [generatedImageUrl, onImageGenerated]);

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !isGenerating) {
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
      style={{
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}
    >
      <div
        style={{
          fontSize: '1.6rem',
          fontWeight: 'bold',
          marginBottom: '1.5rem',
          color: Color.black(),
          textAlign: 'center'
        }}
      >
        Generate Image with AI
      </div>

      {/* Input Section */}
      <div style={{ marginBottom: '1rem', flex: '0 0 auto' }}>
        <div
          style={{
            fontSize: '1.2rem',
            marginBottom: '0.75rem',
            color: Color.black()
          }}
        >
          Describe the image you want to create:
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <Input
            placeholder="E.g., A serene landscape with mountains and a lake at sunset"
            value={prompt}
            onChange={setPrompt}
            onKeyPress={handleKeyPress}
            style={{
              fontSize: '1.1rem',
              padding: '0.75rem',
              minHeight: '3rem',
              flex: 1
            }}
            disabled={isGenerating}
          />
          <Button
            skeuomorphic
            color={buttonColor}
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            style={{
              fontSize: '1.1rem',
              padding: '0.75rem 1.5rem',
              minWidth: '120px',
              height: '3rem'
            }}
          >
            <Icon icon="magic" />
            <span style={{ marginLeft: '0.5rem' }}>Generate</span>
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            backgroundColor: Color.rose(),
            color: Color.black(),
            padding: '0.75rem',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            fontSize: '0.95rem'
          }}
        >
          <Icon icon="exclamation-triangle" style={{ marginRight: '0.5rem' }} />
          {error}
        </div>
      )}

      {/* Image Display Area - Always reserve space */}
      <div
        style={{
          flex: '1 1 0',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '250px',
          maxHeight: '400px'
        }}
      >
        {partialImageData || generatedImageUrl ? (
          <>
            {/* Image Container */}
            <div
              style={{
                border: `2px solid ${Color.borderGray()}`,
                borderRadius: '0.75rem',
                padding: '0.75rem',
                backgroundColor: Color.wellGray(),
                height: '320px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}
            >
              <img
                src={partialImageData || generatedImageUrl || ''}
                alt={
                  partialImageData ? 'Generating image...' : 'Generated image'
                }
                style={{
                  maxWidth: '100%',
                  maxHeight: '300px',
                  borderRadius: '0.5rem',
                  opacity: partialImageData && !generatedImageUrl ? 0.8 : 1,
                  objectFit: 'contain'
                }}
              />
            </div>

            {/* Sophisticated Status Bar Below Image */}
            {isGenerating && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.75rem',
                  backgroundColor: Color.wellGray(),
                  borderRadius: '0.5rem',
                  marginBottom: '1rem',
                  border: `1px solid ${Color.borderGray()}`
                }}
              >
                {!partialImageData && (
                  <Loading style={{ marginRight: '0.75rem' }} />
                )}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}
                >
                  <div
                    style={{
                      fontSize: '1rem',
                      fontWeight: '500',
                      color: Color.black()
                    }}
                  >
                    {getProgressLabel()}
                  </div>
                  {partialImageData && (
                    <div
                      style={{
                        fontSize: '0.85rem',
                        color: Color.gray(),
                        marginTop: '0.25rem'
                      }}
                    >
                      Streaming in real-time...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Follow-up Modification Section */}
            {showFollowUp && generatedImageUrl && !isGenerating && (
              <div
                style={{
                  backgroundColor: Color.wellGray(0.5),
                  border: `1px solid ${Color.borderGray()}`,
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginBottom: '1rem'
                }}
              >
                <div
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: '500',
                    marginBottom: '0.75rem',
                    color: Color.black()
                  }}
                >
                  Modify this image:
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'flex-end'
                  }}
                >
                  <Input
                    placeholder="E.g., Make it more colorful, add a rainbow, change to winter scene..."
                    value={followUpPrompt}
                    onChange={setFollowUpPrompt}
                    onKeyPress={(event: any) => {
                      if (event.key === 'Enter' && !isGenerating) {
                        handleFollowUpGenerate();
                      }
                    }}
                    style={{
                      fontSize: '1rem',
                      padding: '0.5rem',
                      flex: 1
                    }}
                    disabled={isGenerating}
                  />
                  <Button
                    skeuomorphic
                    color={buttonColor}
                    onClick={handleFollowUpGenerate}
                    disabled={!followUpPrompt.trim() || isGenerating}
                    style={{
                      fontSize: '1rem',
                      padding: '0.5rem 1rem'
                    }}
                  >
                    <Icon icon="edit" />
                    <span style={{ marginLeft: '0.5rem' }}>Modify</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {generatedImageUrl && !isGenerating && (
              <div
                style={{
                  display: 'flex',
                  gap: '1rem',
                  justifyContent: 'center',
                  flex: '0 0 auto'
                }}
              >
                <Button
                  transparent
                  onClick={() => {
                    setGeneratedImageUrl(null);
                    setPartialImageData(null);
                    setError(null);
                    setShowFollowUp(false);
                    setGeneratedResponseId(null);
                    setOriginalPrompt('');
                    setFollowUpPrompt('');
                  }}
                  style={{ fontSize: '1rem' }}
                >
                  <Icon icon="redo" />
                  <span style={{ marginLeft: '0.5rem' }}>Generate Again</span>
                </Button>
                <Button
                  skeuomorphic
                  color={doneColor}
                  onClick={handleUseImage}
                  style={{ fontSize: '1rem' }}
                >
                  <Icon icon="check" />
                  <span style={{ marginLeft: '0.5rem' }}>Use This Image</span>
                </Button>
              </div>
            )}
          </>
        ) : (
          // Placeholder when no image
          <div
            style={{
              border: `2px dashed ${Color.borderGray()}`,
              borderRadius: '0.75rem',
              flex: '1 1 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: Color.wellGray(0.3),
              color: Color.gray(),
              fontSize: '1rem',
              fontStyle: 'italic',
              textAlign: 'center',
              padding: '2rem'
            }}
          >
            {isGenerating ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}
              >
                <Loading style={{ marginBottom: '1rem' }} />
                <div style={{ fontWeight: '500', color: Color.black() }}>
                  {getProgressLabel()}
                </div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                  Your AI image will appear here as it generates
                </div>
              </div>
            ) : (
              'Your generated image will appear here'
            )}
          </div>
        )}
      </div>
    </div>
  );
}
