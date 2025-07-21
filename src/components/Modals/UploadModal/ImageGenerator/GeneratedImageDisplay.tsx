import React from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

import FollowUpInput from './FollowUpInput';
import ActionButtons from './ActionButtons';

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
        {((isFollowUpGenerating && !partialImageData && !isGenerating) || 
          (isGenerating && currentImageSrc && !partialImageData)) && (
          <div
            className={css`
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 80%;
              max-width: 300px;
              z-index: 10;
            `}
          >
            <div
              className={css`
                background: rgba(255, 255, 255, 0.95);
                padding: 1.5rem;
                border-radius: 16px;
                text-align: center;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                backdrop-filter: blur(10px);
              `}
            >
              <div
                className={css`
                  font-size: 0.9rem;
                  font-weight: 600;
                  color: #333;
                  margin-bottom: 1rem;
                `}
              >
                {isFollowUpGenerating ? 'Generating follow-up image...' : 'Processing image...'}
              </div>
              <div
                className={css`
                  width: 100%;
                  height: 8px;
                  background: #e0e0e0;
                  border-radius: 4px;
                  overflow: hidden;
                  position: relative;
                `}
              >
                <div
                  className={css`
                    height: 100%;
                    background: linear-gradient(
                      90deg,
                      transparent,
                      rgba(0, 123, 255, 0.6),
                      rgba(0, 123, 255, 1),
                      rgba(0, 123, 255, 0.6),
                      transparent
                    );
                    background-size: 200% 100%;
                    animation: loading-stripes 1.5s linear infinite;

                    @keyframes loading-stripes {
                      0% {
                        background-position: -200% 0;
                      }
                      100% {
                        background-position: 200% 0;
                      }
                    }
                  `}
                />
              </div>
            </div>
          </div>
        )}
        {referenceImageUrl && onRemoveReference && !isGenerating && !isFollowUpGenerating && !generatedImageUrl && (
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

      {/* Follow-up input */}
      {showFollowUp && generatedImageUrl && (
        <FollowUpInput
          followUpPrompt={followUpPrompt}
          onFollowUpPromptChange={onFollowUpPromptChange}
          onFollowUpGenerate={onFollowUpGenerate}
          isGenerating={isGenerating}
          isFollowUpGenerating={isFollowUpGenerating}
        />
      )}

      {/* Actions */}
      {generatedImageUrl && !isGenerating && (
        <ActionButtons onUseImage={onUseImage} showFollowUp={showFollowUp} />
      )}
    </div>
  );
}
