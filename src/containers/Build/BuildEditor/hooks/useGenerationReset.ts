import { useState } from 'react';
import type { BuildCopilotPolicy } from '../types';

interface UseBuildEditorGenerationResetOptions {
  buildId: number;
  isOwner: boolean;
  onApplyCopilotRequestLimitsSnapshot: (
    requestLimits: Record<string, any> | null | undefined
  ) => void;
  onSetUserState: (options: Record<string, any>) => void;
  purchaseBuildGenerationReset: (buildId: number) => Promise<any>;
  replaceCopilotPolicy: (policy: BuildCopilotPolicy | null) => void;
  userId: number;
}

export default function useGenerationReset({
  buildId,
  isOwner,
  onApplyCopilotRequestLimitsSnapshot,
  onSetUserState,
  purchaseBuildGenerationReset,
  replaceCopilotPolicy,
  userId
}: UseBuildEditorGenerationResetOptions) {
  const [purchasingGenerationReset, setPurchasingGenerationReset] =
    useState(false);
  const [generationResetError, setGenerationResetError] = useState('');

  async function handlePurchaseGenerationReset() {
    if (!isOwner || !userId || purchasingGenerationReset) return;
    setPurchasingGenerationReset(true);
    setGenerationResetError('');
    try {
      const result = await purchaseBuildGenerationReset(buildId);
      if (typeof result?.newBalance === 'number') {
        onSetUserState({
          userId,
          newState: { twinkleCoins: result.newBalance }
        });
      }
      if (Object.prototype.hasOwnProperty.call(result || {}, 'copilotPolicy')) {
        const nextPolicy = result?.copilotPolicy || null;
        replaceCopilotPolicy(nextPolicy);
        if (nextPolicy?.requestLimits) {
          onApplyCopilotRequestLimitsSnapshot(nextPolicy.requestLimits);
        }
      }
    } catch (error: any) {
      console.error('Failed to recharge Build AI Energy:', error);
      const nextRequestLimits =
        error?.response?.data?.requestLimits || error?.requestLimits || null;
      onApplyCopilotRequestLimitsSnapshot(nextRequestLimits);
      setGenerationResetError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to recharge AI Energy'
      );
    } finally {
      setPurchasingGenerationReset(false);
    }
  }

  return {
    generationResetError,
    handlePurchaseGenerationReset,
    purchasingGenerationReset
  };
}
