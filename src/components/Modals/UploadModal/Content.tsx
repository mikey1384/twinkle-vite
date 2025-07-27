import React from 'react';
import FileUploadOption from './FileUploadOption';
import ImageGeneratorOption from './ImageGenerator';
import Button from '~/components/Button';
import Icon from '~/components/Icon';

export default function UploadModalContent({
  selectedOption,
  onFileSelect,
  onFileUploadSelect,
  onAIGenerateSelect,
  onGeneratedImage,
  onSetSelectedOption,
  accept,
  onError
}: {
  selectedOption: 'select' | 'upload' | 'generate';
  onFileSelect: (file: File) => void;
  onFileUploadSelect: () => void;
  onAIGenerateSelect: () => void;
  onGeneratedImage: (file: File) => void;
  onSetSelectedOption: (option: 'select' | 'upload' | 'generate') => void;
  accept: string;
  onError?: (error: string) => void;
}) {
  switch (selectedOption) {
    case 'upload':
      return <FileUploadOption onFileSelect={onFileSelect} accept={accept} />;
    case 'generate':
      return (
        <ImageGeneratorOption
          onImageGenerated={onGeneratedImage}
          onBack={() => onSetSelectedOption('select')}
          onError={onError}
        />
      );
    default:
      return (
        <div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem',
              maxWidth: '600px',
              margin: '0 auto'
            }}
          >
            <Button
              skeuomorphic
              color="logoBlue"
              onClick={onFileUploadSelect}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '2rem 1.5rem',
                minHeight: '180px',
                borderRadius: '12px',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
            >
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '50%',
                  padding: '1rem',
                  marginBottom: '1rem'
                }}
              >
                <Icon icon="upload" size="2x" />
              </div>
              <div
                style={{
                  fontSize: '1.3rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem'
                }}
              >
                Upload from Device
              </div>
              <div
                style={{
                  fontSize: '0.9rem',
                  opacity: 0.9,
                  textAlign: 'center',
                  lineHeight: '1.4'
                }}
              >
                Choose files from your computer or mobile device
              </div>
            </Button>

            <Button
              skeuomorphic
              color="pink"
              onClick={onAIGenerateSelect}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '2rem 1.5rem',
                minHeight: '180px',
                borderRadius: '12px',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
            >
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '50%',
                  padding: '1rem',
                  marginBottom: '1rem'
                }}
              >
                <Icon icon="magic" size="2x" />
              </div>
              <div
                style={{
                  fontSize: '1.3rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem'
                }}
              >
                Generate Image with AI
              </div>
              <div
                style={{
                  fontSize: '0.9rem',
                  opacity: 0.9,
                  textAlign: 'center',
                  lineHeight: '1.4'
                }}
              >
                Create unique images using artificial intelligence
              </div>
            </Button>
          </div>
        </div>
      );
  }
}
