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
  energyLoading?: boolean;
  followUpEngine?: 'gemini' | 'openai';
  onFollowUpEngineChange: (engine: 'gemini' | 'openai') => void;
  followUpQuality?: 'low' | 'medium' | 'high';
  onFollowUpQualityChange: (quality: 'low' | 'medium' | 'high') => void;
  themeColor?: string;
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
  energyLoading,
  followUpEngine = 'gemini',
  onFollowUpEngineChange,
  followUpQuality = 'high',
  onFollowUpQualityChange,
  themeColor
}: ImageAreaProps) {
  const hasImageContent = Boolean(
    partialImageData || generatedImageUrl || referenceImageUrl || canvasUrl
  );

  if (!hasImageContent && !isGenerating) {
    return null;
  }

  return (
    <div
      className={css`
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      `}
    >
      {hasImageContent ? (
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
          energyLoading={energyLoading}
          followUpEngine={followUpEngine}
          onFollowUpEngineChange={onFollowUpEngineChange}
          followUpQuality={followUpQuality}
          onFollowUpQualityChange={onFollowUpQualityChange}
          themeColor={themeColor}
        />
      ) : isGenerating ? (
        <LoadingState
          getProgressLabel={getProgressLabel}
          themeColor={themeColor}
        />
      ) : null}
    </div>
  );
}
