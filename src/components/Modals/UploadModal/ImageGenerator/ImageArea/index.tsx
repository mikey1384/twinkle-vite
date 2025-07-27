import React from 'react';
import { css } from '@emotion/css';

import GeneratedImageDisplay from './GeneratedImageDisplay';
import LoadingState from './LoadingState';

interface ImageAreaProps {
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
  canAffordFollowUp?: boolean;
  followUpCost?: number;
}

export default function ImageArea({
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
  canvasHasContent,
  canAffordFollowUp,
  followUpCost
}: ImageAreaProps) {
  return (
    <div
      className={css`
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      `}
    >
      {partialImageData ||
      generatedImageUrl ||
      referenceImageUrl ||
      canvasUrl ? (
        <GeneratedImageDisplay
          key={`${generatedImageUrl}-${referenceImageUrl}-${canvasUrl}-${partialImageData}`}
          partialImageData={partialImageData}
          generatedImageUrl={generatedImageUrl}
          referenceImageUrl={referenceImageUrl}
          canvasUrl={canvasUrl}
          isGenerating={isGenerating}
          isFollowUpGenerating={isFollowUpGenerating}
          showFollowUp={showFollowUp}
          followUpPrompt={followUpPrompt}
          onFollowUpPromptChange={onFollowUpPromptChange}
          onFollowUpGenerate={onFollowUpGenerate}
          onUseImage={onUseImage}
          getProgressLabel={getProgressLabel}
          onRemoveReference={onRemoveReference}
          onImageEdited={onImageEdited}
          isShowingLoadingState={isShowingLoadingState}
          hasBeenEdited={hasBeenEdited}
          onSetHasBeenEdited={onSetHasBeenEdited}
          canvasHasContent={canvasHasContent}
          canAffordFollowUp={canAffordFollowUp}
          followUpCost={followUpCost}
        />
      ) : (
        <LoadingState
          isGenerating={isGenerating}
          getProgressLabel={getProgressLabel}
        />
      )}
    </div>
  );
}
