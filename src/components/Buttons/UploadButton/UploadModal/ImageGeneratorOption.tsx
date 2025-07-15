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
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(
    null
  );
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

  // Socket listener for streaming progress
  useEffect(() => {
    const handleImageGenerationStatus = (status: {
      stage: string;
      partialImageB64?: string;
      index?: number;
      imageUrl?: string;
      error?: string;
    }) => {
      console.log('[Frontend] Image generation status received:', status);
      setProgressStage(status.stage);

      if (status.stage === 'partial_image' && status.partialImageB64) {
        console.log('[Frontend] Setting partial image data');
        setPartialImageData(`data:image/png;base64,${status.partialImageB64}`);
      } else if (status.stage === 'completed') {
        // The backend returns base64 data, so we need to handle it
        if (status.imageUrl) {
          setGeneratedImageUrl(status.imageUrl);
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
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedImageUrl(null);
    setPartialImageData(null);
    setProgressStage('prompt_ready');

    try {
      const result = await generateAIImage({
        prompt: prompt.trim(),
        model: 'gpt-image-1'
      });

      // For non-streaming response, handle it directly
      if (result.success && result.imageUrl) {
        setGeneratedImageUrl(result.imageUrl);
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
  }, [prompt, isGenerating, generateAIImage]);

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
    <div style={{ padding: '2rem' }}>
      <div
        style={{
          fontSize: '1.6rem',
          fontWeight: 'bold',
          marginBottom: '2rem',
          color: Color.black(),
          textAlign: 'center'
        }}
      >
        Generate Image with AI
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <div
          style={{
            fontSize: '1.2rem',
            marginBottom: '1rem',
            color: Color.black()
          }}
        >
          Describe the image you want to create:
        </div>
        <Input
          placeholder="E.g., A serene landscape with mountains and a lake at sunset"
          value={prompt}
          onChange={setPrompt}
          onKeyPress={handleKeyPress}
          style={{
            fontSize: '1.1rem',
            padding: '1rem',
            minHeight: '4rem'
          }}
          disabled={isGenerating}
        />
      </div>

      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <Button
          skeuomorphic
          color={buttonColor}
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          style={{ fontSize: '1.2rem', padding: '1rem 2rem' }}
        >
          {isGenerating ? (
            <>
              <Loading />
              <span style={{ marginLeft: '0.7rem' }}>{getProgressLabel()}</span>
            </>
          ) : (
            <>
              <Icon icon="magic" />
              <span style={{ marginLeft: '0.7rem' }}>Generate Image</span>
            </>
          )}
        </Button>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: Color.rose(),
            color: Color.black(),
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '2rem',
            textAlign: 'center'
          }}
        >
          <Icon icon="exclamation-triangle" style={{ marginRight: '0.5rem' }} />
          {error}
        </div>
      )}

      {partialImageData && !generatedImageUrl && (
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              fontSize: '1.2rem',
              fontWeight: 'bold',
              color: Color.black(),
              marginBottom: '1rem'
            }}
          >
            Generating... ({getProgressLabel()})
          </div>
          <div
            style={{
              border: `2px solid ${Color.borderGray()}`,
              borderRadius: '1rem',
              padding: '1rem',
              backgroundColor: Color.wellGray()
            }}
          >
            <img
              src={partialImageData}
              alt="Partial generated image"
              style={{
                maxWidth: '100%',
                maxHeight: '300px',
                borderRadius: '0.5rem',
                opacity: 0.8
              }}
            />
          </div>
        </div>
      )}

      {generatedImageUrl && (
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              marginBottom: '1rem',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              color: Color.black()
            }}
          >
            Generated Image:
          </div>
          <div
            style={{
              marginBottom: '2rem',
              border: `2px solid ${Color.borderGray()}`,
              borderRadius: '1rem',
              padding: '1rem',
              backgroundColor: Color.wellGray()
            }}
          >
            <img
              src={generatedImageUrl}
              alt="Generated image"
              style={{
                maxWidth: '100%',
                maxHeight: '300px',
                borderRadius: '0.5rem'
              }}
            />
          </div>
          <div
            style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}
          >
            <Button
              transparent
              onClick={() => {
                setGeneratedImageUrl(null);
                setError(null);
              }}
            >
              <Icon icon="redo" />
              <span style={{ marginLeft: '0.5rem' }}>Generate Again</span>
            </Button>
            <Button skeuomorphic color={doneColor} onClick={handleUseImage}>
              <Icon icon="check" />
              <span style={{ marginLeft: '0.5rem' }}>Use This Image</span>
            </Button>
          </div>
        </div>
      )}

      {!generatedImageUrl && !isGenerating && (
        <div
          style={{
            textAlign: 'center',
            color: Color.gray(),
            fontSize: '1rem',
            fontStyle: 'italic'
          }}
        >
          Enter a description above and click Generate to create an AI image
        </div>
      )}
    </div>
  );
}
