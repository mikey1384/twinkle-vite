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
  energyPercent?: number;
  energySegments?: number;
  overflowed?: boolean;
  resetNeeded?: boolean;
  resetCost?: number;
  resetPurchaseNumber?: number;
  twinkleCoins?: number;
  rechargeLoading?: boolean;
  rechargeError?: string;
  onRecharge?: () => void;
  communityFundsEligible?: boolean;
  communityFundsRequirements?: Array<{
    key: string;
    label: string;
    done: boolean;
    current?: number;
    required?: number;
  }>;
  onRechargeWithCommunityFunds?: () => void;
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
  themeColor,
  energyPercent,
  energySegments,
  overflowed = false,
  resetNeeded = false,
  resetCost = 0,
  resetPurchaseNumber,
  twinkleCoins = 0,
  rechargeLoading = false,
  rechargeError = '',
  onRecharge,
  communityFundsEligible = false,
  communityFundsRequirements,
  onRechargeWithCommunityFunds
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
          energyPercent={energyPercent}
          energySegments={energySegments}
          overflowed={overflowed}
          resetNeeded={resetNeeded}
          resetCost={resetCost}
          resetPurchaseNumber={resetPurchaseNumber}
          twinkleCoins={twinkleCoins}
          rechargeLoading={rechargeLoading}
          rechargeError={rechargeError}
          onRecharge={onRecharge}
          communityFundsEligible={communityFundsEligible}
          communityFundsRequirements={communityFundsRequirements}
          onRechargeWithCommunityFunds={onRechargeWithCommunityFunds}
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
