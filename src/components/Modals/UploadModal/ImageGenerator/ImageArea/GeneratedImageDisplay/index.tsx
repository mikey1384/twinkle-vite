import React, { useState } from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

import FollowUpInput from './FollowUpInput';
import UseThisImageButton from './UseThisImageButton';
import ImageEditor from './ImageEditor';
import Icon from '~/components/Icon';

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
  onImageEdited?: (dataUrl: string) => void;
  isShowingLoadingState: boolean;
  hasBeenEdited: boolean;
  onSetHasBeenEdited: (value: boolean) => void;
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
  onRemoveReference,
  onImageEdited,
  isShowingLoadingState,
  hasBeenEdited,
  onSetHasBeenEdited
}: GeneratedImageDisplayProps) {
  const [isEditing, setIsEditing] = useState(false);
  const currentImageSrc =
    partialImageData || generatedImageUrl || referenceImageUrl || canvasUrl;
  const getImageAltText = () => {
    if (partialImageData || generatedImageUrl) return 'Generated image';
    if (referenceImageUrl) return 'Reference image';
    if (canvasUrl) return 'Canvas drawing';
    return 'Image';
  };

  const canEdit =
    (generatedImageUrl || referenceImageUrl || canvasUrl) &&
    !isGenerating &&
    !isFollowUpGenerating;

  const handleEditSave = (dataUrl: string) => {
    setIsEditing(false);
    onSetHasBeenEdited(true);
    onImageEdited?.(dataUrl);
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
            ${isShowingLoadingState
              ? `
                opacity: 0.6;
                filter: blur(2px) brightness(0.8);
                transform: scale(0.98);
              `
              : ''}
          `}
        />
        {isShowingLoadingState && (
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
            {isFollowUpGenerating
              ? 'Generating follow-up...'
              : getProgressLabel()}
          </div>
        )}

        {((!generatedImageUrl && isShowingLoadingState) || isGenerating) && (
          <div
            className={css`
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 1rem;
              z-index: 10;
            `}
          >
            <div
              className={css`
                width: 48px;
                height: 48px;
                border: 4px solid rgba(255, 255, 255, 0.3);
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
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 0.75rem 1.25rem;
                border-radius: 12px;
                font-size: 0.9rem;
                font-weight: 500;
                backdrop-filter: blur(8px);
                text-align: center;
              `}
            >
              {isFollowUpGenerating
                ? 'Generating follow-up image...'
                : 'Generating image...'}
            </div>
          </div>
        )}
        {currentImageSrc &&
          onRemoveReference &&
          !isGenerating &&
          !isFollowUpGenerating && (
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

        {canEdit && (
          <>
            <button
              onClick={() => setIsEditing(true)}
              className={css`
                position: absolute;
                top: 0.5rem;
                left: 0.5rem;
                background: rgba(0, 0, 0, 0.7);
                color: white;
                border: none;
                border-radius: 6px;
                padding: 0.5rem 0.75rem;
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                backdrop-filter: blur(4px);
                transition: all 0.2s ease;
                z-index: 5;

                &:hover {
                  background: rgba(0, 0, 0, 0.85);
                  transform: translateY(-1px);
                }

                &:active {
                  transform: translateY(0);
                }
              `}
            >
              Edit Image
            </button>

            {/* Bottom-right icon button */}
            <button
              onClick={() => setIsEditing(true)}
              className={css`
                position: absolute;
                bottom: 0.5rem;
                right: 0.5rem;
                background: ${Color.logoBlue()};
                color: white;
                border: none;
                border-radius: 8px;
                padding: 0.5rem;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                font-size: 14px;
                box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);
                transition: all 0.2s ease;

                &:hover {
                  background: ${Color.logoBlue(0.8)};
                  transform: translateY(-1px);
                  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.4);
                }

                &:active {
                  transform: translateY(0);
                }
              `}
            >
              <Icon icon="edit" />
            </button>
          </>
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

      {(generatedImageUrl || hasBeenEdited) && !isGenerating && (
        <UseThisImageButton
          onUseImage={onUseImage}
          showFollowUp={showFollowUp}
        />
      )}

      {isEditing && currentImageSrc && (
        <ImageEditor
          imageUrl={currentImageSrc}
          onSave={handleEditSave}
          onCancel={() => setIsEditing(false)}
        />
      )}
    </div>
  );
}
