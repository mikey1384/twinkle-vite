import React from 'react';
import FileUploadOption from './FileUploadOption';
import ImageGeneratorOption from './ImageGeneratorOption';
import { Color } from '~/constants/css';
import Button from '~/components/Button';
import Icon from '~/components/Icon';

export default function UploadModalContent({
  selectedOption,
  onFileSelect,
  onFileUploadSelect,
  onAIGenerateSelect,
  onGeneratedImage,
  onSetSelectedOption,
  accept
}: {
  selectedOption: 'select' | 'upload' | 'generate';
  onFileSelect: (file: File) => void;
  onFileUploadSelect: () => void;
  onAIGenerateSelect: () => void;
  onGeneratedImage: (file: File) => void;
  onSetSelectedOption: (option: 'select' | 'upload' | 'generate') => void;
  accept: string;
}) {
  switch (selectedOption) {
    case 'upload':
      return (
        <FileUploadOption
          onFileSelect={onFileSelect}
          onBack={() => onSetSelectedOption('select')}
          accept={accept}
        />
      );
    case 'generate':
      return (
        <ImageGeneratorOption
          onImageGenerated={onGeneratedImage}
          onBack={() => onSetSelectedOption('select')}
        />
      );
    default:
      return (
        <div style={{ padding: '2rem' }}>
          <div
            style={{
              fontSize: '1.8rem',
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: '3rem',
              color: Color.black()
            }}
          >
            Choose Upload Method
          </div>
          <div
            style={{
              display: 'flex',
              gap: '2rem',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}
          >
            <Button
              skeuomorphic
              color="blue"
              onClick={onFileUploadSelect}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '2rem',
                minWidth: '12rem',
                minHeight: '12rem'
              }}
            >
              <Icon icon="upload" size="3x" />
              <div
                style={{
                  marginTop: '1rem',
                  fontSize: '1.4rem',
                  fontWeight: 'bold'
                }}
              >
                Upload from Device
              </div>
              <div
                style={{
                  marginTop: '0.5rem',
                  fontSize: '1rem',
                  opacity: 0.8
                }}
              >
                Choose files from your computer
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
                padding: '2rem',
                minWidth: '12rem',
                minHeight: '12rem'
              }}
            >
              <Icon icon="magic" size="3x" />
              <div
                style={{
                  marginTop: '1rem',
                  fontSize: '1.4rem',
                  fontWeight: 'bold'
                }}
              >
                Generate with AI
              </div>
              <div
                style={{
                  marginTop: '0.5rem',
                  fontSize: '1rem',
                  opacity: 0.8
                }}
              >
                Create images using AI
              </div>
            </Button>
          </div>
        </div>
      );
  }
}
