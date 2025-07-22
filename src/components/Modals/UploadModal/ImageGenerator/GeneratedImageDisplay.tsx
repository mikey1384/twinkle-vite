import React from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

import FollowUpInput from './FollowUpInput';
import UseThisImageButton from './UseThisImageButton';

interface GeneratedImageDisplayProps {
  partialImageData: string | null;
  generatedImageUrl: string | null;
  referenceImageUrl: string | null;
  canvasUrl: string | null;
  isGenerating: boolean;
  isFollowUpGenerating: boolean;
  showFollowUp: boolean;
  followUpPrompt: string;
  onFollowUpPromptChange: (value: string) => void;
  onFollowUpGenerate: () => void;
  onUseImage: () => void;
  getProgressLabel: () => string;
  onRemoveReference?: () => void;
}

export default function GeneratedImageDisplay({
  partialImageData,
  generatedImageUrl,
  referenceImageUrl,
  canvasUrl,
  isGenerating,
  isFollowUpGenerating,
  showFollowUp,
  followUpPrompt,
  onFollowUpPromptChange,
  onFollowUpGenerate,
  onUseImage,
  getProgressLabel,
  onRemoveReference
}: GeneratedImageDisplayProps) {
  const currentImageSrc =
    partialImageData || generatedImageUrl || referenceImageUrl || canvasUrl;
  const getImageAltText = () => {
    if (partialImageData || generatedImageUrl) return 'Generated image';
    if (referenceImageUrl) return 'Reference image';
    if (canvasUrl) return 'Canvas drawing';
    return 'Image';
  };

  return (
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
          src={currentImageSrc || ''}
          alt={getImageAltText()}
          className={css`
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
            transition: all 0.3s ease;
            ${partialImageData && !generatedImageUrl ? 'opacity: 0.7;' : ''}
            ${(isFollowUpGenerating || (currentImageSrc && isGenerating)) &&
            !partialImageData
              ? `
                opacity: 0.6;
                filter: blur(2px) brightness(0.8);
                transform: scale(0.98);
              `
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
        {isFollowUpGenerating && !partialImageData && !isGenerating && (
          <div
            className={css`
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              background: ${Color.orange(0.95)};
              color: white;
              padding: 1rem 1.5rem;
              border-radius: 16px;
              font-size: 0.9rem;
              font-weight: 600;
              backdrop-filter: blur(10px);
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
              display: flex;
              align-items: center;
              gap: 0.75rem;
              z-index: 10;
            `}
          >
            <div
              className={css`
                width: 16px;
                height: 16px;
                border: 2px solid white;
                border-top: 2px solid transparent;
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
            Generating follow-up image...
          </div>
        )}
        {referenceImageUrl &&
          onRemoveReference &&
          !isGenerating &&
          !isFollowUpGenerating &&
          !generatedImageUrl && (
            <button
              onClick={onRemoveReference}
              className={css`
                position: absolute;
                top: 0.5rem;
                right: 0.5rem;
                background: rgba(255, 255, 255, 0.9);
                border: none;
                border-radius: 50%;
                width: 28px;
                height: 28px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
                color: #666;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                transition: all 0.2s ease;

                &:hover {
                  background: rgba(255, 255, 255, 1);
                  color: #333;
                  transform: scale(1.1);
                }

                &:active {
                  transform: scale(0.95);
                }
              `}
            >
              ✕
            </button>
          )}
      </div>

      {showFollowUp && generatedImageUrl && (
        <FollowUpInput
          followUpPrompt={followUpPrompt}
          onFollowUpPromptChange={onFollowUpPromptChange}
          onFollowUpGenerate={onFollowUpGenerate}
          isGenerating={isGenerating}
          isFollowUpGenerating={isFollowUpGenerating}
        />
      )}

      {generatedImageUrl && !isGenerating && (
        <UseThisImageButton
          onUseImage={onUseImage}
          showFollowUp={showFollowUp}
        />
      )}
    </div>
  );
}
