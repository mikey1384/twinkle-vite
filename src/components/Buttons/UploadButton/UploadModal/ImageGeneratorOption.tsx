import React, { useState, useCallback } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import Input from '~/components/Texts/Input';
import Loading from '~/components/Loading';
import { useKeyContext, useAppContext } from '~/contexts';
import { Color } from '~/constants/css';

interface ImageGeneratorOptionProps {
  onImageGenerated: (file: File) => void;
  onBack: () => void;
}

export default function ImageGeneratorOption({
  onImageGenerated,
  onBack
}: ImageGeneratorOptionProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    button: { color: buttonColor },
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  
  const generateAIImage = useAppContext((v) => v.requestHelpers.generateAIImage);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedImageUrl(null);

    try {
      const result = await generateAIImage({
        prompt: prompt.trim(),
        model: 'gpt-image-1'
      });

      if (result.success && result.imageUrl) {
        setGeneratedImageUrl(result.imageUrl);
      } else {
        setError(result.error || 'Failed to generate image');
      }
    } catch (err) {
      console.error('Image generation error:', err);
      setError('An error occurred while generating the image');
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, isGenerating, generateAIImage]);

  const handleUseImage = useCallback(async () => {
    if (!generatedImageUrl) return;

    try {
      // Convert the image URL to a File object
      const response = await fetch(generatedImageUrl);
      const blob = await response.blob();
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
              <span style={{ marginLeft: '0.7rem' }}>Generating...</span>
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
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
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
            <Button
              skeuomorphic
              color={doneColor}
              onClick={handleUseImage}
            >
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