import React from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

import FollowUpInput from './FollowUpInput';
import ActionButtons from './ActionButtons';

interface GeneratedImageDisplayProps {
  partialImageData: string | null;
  generatedImageUrl: string | null;
  isGenerating: boolean;
  isFollowUpGenerating: boolean;
  showFollowUp: boolean;
  followUpPrompt: string;
  onFollowUpPromptChange: (value: string) => void;
  onFollowUpGenerate: () => void;
  onUseImage: () => void;
  getProgressLabel: () => string;
}

export default function GeneratedImageDisplay({
  partialImageData,
  generatedImageUrl,
  isGenerating,
  isFollowUpGenerating,
  showFollowUp,
  followUpPrompt,
  onFollowUpPromptChange,
  onFollowUpGenerate,
  onUseImage,
  getProgressLabel
}: GeneratedImageDisplayProps) {
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
          src={partialImageData || generatedImageUrl || ''}
          alt="Generated image"
          className={css`
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
            transition: all 0.3s ease;
            ${partialImageData && !generatedImageUrl ? 'opacity: 0.7;' : ''}
            ${isFollowUpGenerating && !partialImageData
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
