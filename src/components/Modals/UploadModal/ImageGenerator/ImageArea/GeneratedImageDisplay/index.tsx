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
  canvasHasContent: boolean;
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
  onSetHasBeenEdited,
  canvasHasContent
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
          transition: all 0.3s ease;

          &:hover {
            border-color: ${Color.logoBlue(0.6)};
            box-shadow: 0 8px 25px rgba(59, 130, 246, 0.15);
          }

          ${canEdit && `
            &:hover .edit-overlay {
              opacity: 1;
            }
            
            &:hover .edit-button {
              opacity: 1;
              transform: translate(-50%, -50%) scale(1);
            }
          `}
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

        {isShowingLoadingState && (
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
                z-index: 15;

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

        {/* Hover overlay */}
        {canEdit && (
          <div
            className={`edit-overlay ${css`
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: rgba(0, 0, 0, 0.4);
              border-radius: 14px;
              opacity: 0;
              transition: opacity 0.3s ease;
              pointer-events: none;
            `}`}
          />
        )}

        {canEdit && (
          <button
            onClick={() => setIsEditing(true)}
            className={`edit-button ${css`
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) scale(0.9);
              background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
              color: white;
              border: none;
              border-radius: 12px;
              padding: 1rem 1.5rem;
              font-size: 1rem;
              font-weight: 600;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 0.5rem;
              box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
              transition: all 0.3s ease;
              z-index: 10;
              opacity: 0;

              &:hover {
                background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
                transform: translate(-50%, -50%) translateY(-2px) scale(1.05) !important;
                box-shadow: 0 12px 35px rgba(59, 130, 246, 0.5);
              }

              &:active {
                transform: translate(-50%, -50%) translateY(-1px) scale(1.02) !important;
              }
            `}`}
          >
            <Icon icon="edit" />
            <span>Edit Image</span>
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

      {(generatedImageUrl ||
        hasBeenEdited ||
        (canvasUrl && canvasHasContent)) &&
        !isGenerating && (
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
