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
  followUpEngine?: 'gemini' | 'openai';
  onFollowUpEngineChange: (engine: 'gemini' | 'openai') => void;
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
  getProgressLabel,
  onRemoveReference,
  onImageEdited,
  isShowingLoadingState,
  onSetHasBeenEdited,
  canAffordFollowUp,
  followUpCost,
  followUpEngine = 'gemini',
  onFollowUpEngineChange
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
          getProgressLabel={getProgressLabel}
          onRemoveReference={onRemoveReference}
          onImageEdited={onImageEdited}
          isShowingLoadingState={isShowingLoadingState}
          onSetHasBeenEdited={onSetHasBeenEdited}
          canAffordFollowUp={canAffordFollowUp}
          followUpCost={followUpCost}
          followUpEngine={followUpEngine}
          onFollowUpEngineChange={onFollowUpEngineChange}
        />
      ) : isGenerating ? (
        <LoadingState getProgressLabel={getProgressLabel} />
      ) : null}
    </div>
  );
}
