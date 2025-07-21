import React from 'react';
import { css } from '@emotion/css';

import GeneratedImageDisplay from './GeneratedImageDisplay';
import LoadingState from './LoadingState';

interface ImageAreaProps {
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

export default function ImageArea({
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
      {partialImageData || generatedImageUrl ? (
        <GeneratedImageDisplay
          partialImageData={partialImageData}
          generatedImageUrl={generatedImageUrl}
          isGenerating={isGenerating}
          isFollowUpGenerating={isFollowUpGenerating}
          showFollowUp={showFollowUp}
          followUpPrompt={followUpPrompt}
          onFollowUpPromptChange={onFollowUpPromptChange}
          onFollowUpGenerate={onFollowUpGenerate}
          onUseImage={onUseImage}
          getProgressLabel={getProgressLabel}
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