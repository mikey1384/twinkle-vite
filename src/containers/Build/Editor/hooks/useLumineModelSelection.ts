import { useEffect, useState } from 'react';
import type {
  BuildCopilotPolicy,
  BuildLumineModelPreference,
  LumineModelSelectionControl
} from '../ChatPanel/types';
import {
  getSelectableLumineModelOptions,
  normalizeLumineModelSelection,
  resolveLumineModelSelectionFromPolicy
} from '../helpers/lumineModelSelection';

interface UseLumineModelSelectionOptions {
  buildId: number;
  copilotPolicy: BuildCopilotPolicy | null;
  getLatestCopilotPolicy: () => BuildCopilotPolicy | null;
  isOwner: boolean;
  replaceCopilotPolicy: (policy: BuildCopilotPolicy | null) => void;
  updateBuildLumineModelPreference: (
    options: Record<string, any>
  ) => Promise<any>;
}

export default function useLumineModelSelection({
  buildId,
  copilotPolicy,
  getLatestCopilotPolicy,
  isOwner,
  replaceCopilotPolicy,
  updateBuildLumineModelPreference
}: UseLumineModelSelectionOptions): {
  getCurrentLumineModelSelection: () => BuildLumineModelPreference;
  lumineModelSelectionControl: LumineModelSelectionControl | null;
} {
  const [lumineModelSelection, setLumineModelSelection] =
    useState<BuildLumineModelPreference>(() =>
      resolveLumineModelSelectionFromPolicy(copilotPolicy)
    );
  const [savingLumineModelSelection, setSavingLumineModelSelection] =
    useState(false);
  const [lumineModelSelectionError, setLumineModelSelectionError] =
    useState('');

  useEffect(() => {
    setLumineModelSelection(
      resolveLumineModelSelectionFromPolicy(copilotPolicy)
    );
    setLumineModelSelectionError('');
  }, [buildId, copilotPolicy]);

  async function handleSaveLumineModelSelection(
    nextSelection: BuildLumineModelPreference
  ) {
    const latestPolicy = getLatestCopilotPolicy();
    const modelOptions = getSelectableLumineModelOptions(latestPolicy);
    const savedSelection = resolveLumineModelSelectionFromPolicy(latestPolicy);
    if (!isOwner || savingLumineModelSelection) {
      return true;
    }
    const requestedOption = modelOptions.find(
      (option) =>
        option.model === nextSelection.model &&
        option.mode === nextSelection.mode
    );
    if (!requestedOption) {
      setLumineModelSelection(savedSelection);
      setLumineModelSelectionError(
        'That Lumine mode is no longer available. Choose an available mode.'
      );
      return false;
    }
    const normalizedNextSelection = normalizeLumineModelSelection({
      selection: nextSelection,
      modelOptions
    });
    if (
      normalizedNextSelection.model === savedSelection.model &&
      normalizedNextSelection.reasoningEffort === savedSelection.reasoningEffort
    ) {
      return true;
    }

    setSavingLumineModelSelection(true);
    setLumineModelSelectionError('');
    try {
      const result = await updateBuildLumineModelPreference({
        buildId,
        model: normalizedNextSelection.model,
        reasoningEffort: normalizedNextSelection.reasoningEffort
      });
      const canonicalSelection =
        result?.lumineModelPreference ||
        result?.copilotPolicy?.lumineModelPreference;
      if (!canonicalSelection) {
        throw new Error('Server did not return the saved Lumine mode');
      }
      if (Object.prototype.hasOwnProperty.call(result || {}, 'copilotPolicy')) {
        replaceCopilotPolicy(result?.copilotPolicy || null);
      }
      setLumineModelSelection(
        normalizeLumineModelSelection({
          selection: canonicalSelection,
          modelOptions: result?.lumineModelOptions || modelOptions
        })
      );
      return true;
    } catch (error: any) {
      setLumineModelSelection(savedSelection);
      setLumineModelSelectionError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to save Lumine model setting'
      );
      return false;
    } finally {
      setSavingLumineModelSelection(false);
    }
  }

  function getCurrentLumineModelSelection() {
    return normalizeLumineModelSelection({
      selection: lumineModelSelection,
      modelOptions: getSelectableLumineModelOptions(getLatestCopilotPolicy())
    });
  }

  if (!isOwner) {
    return {
      getCurrentLumineModelSelection,
      lumineModelSelectionControl: null
    };
  }

  const modelOptions = getSelectableLumineModelOptions(copilotPolicy);
  const savedSelection = resolveLumineModelSelectionFromPolicy(copilotPolicy);
  return {
    getCurrentLumineModelSelection,
    lumineModelSelectionControl: {
      value: normalizeLumineModelSelection({
        selection: lumineModelSelection,
        modelOptions
      }),
      savedValue: savedSelection,
      modelOptions,
      loading: savingLumineModelSelection,
      error: lumineModelSelectionError,
      onSave: handleSaveLumineModelSelection
    }
  };
}
