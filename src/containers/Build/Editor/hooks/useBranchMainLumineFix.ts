import { useEffect, useRef, useState } from 'react';
import type {
  BuildContributionLumineFix,
  BuildContributionLumineFixDetails
} from '~/components/Build/ContributionLumineFix';
import { socket } from '~/constants/sockets/api';
import { useAppContext } from '~/contexts';
import { startBuildContributionLumineFixRecovery } from '~/helpers/buildContributionLumineFixRecovery';
import {
  selectCurrentBranchCanonicalContribution,
  shouldLoadCurrentBranchLumineFixState
} from '~/helpers/branchMainUpdateNotice';

interface BranchMainLumineFixState {
  scopeKey: string;
  contributionBuildId: number;
  canSponsor: boolean | null;
  checking: boolean;
  hadFix: boolean;
  fix: BuildContributionLumineFix | null;
  details: BuildContributionLumineFixDetails | null;
  selectedModel: string;
  loading: string;
  error: string;
}

const initialState: BranchMainLumineFixState = {
  scopeKey: '',
  contributionBuildId: 0,
  canSponsor: null,
  checking: false,
  hadFix: false,
  fix: null,
  details: null,
  selectedModel: '',
  loading: '',
  error: ''
};

export default function useBranchMainLumineFix({
  active,
  buildId,
  contributionBuildId,
  onContributionUpdate,
  onApplied
}: {
  active: boolean;
  buildId: number;
  contributionBuildId: number;
  onContributionUpdate?: (contribution: Record<string, any>) => void;
  onApplied?: (result: any) => void;
}) {
  const loadBuildProjectLumineFix = useAppContext(
    (v) => v.requestHelpers.loadBuildProjectLumineFix
  );
  const loadBuildContributionLumineFix = useAppContext(
    (v) => v.requestHelpers.loadBuildContributionLumineFix
  );
  const sponsorBuildProjectLumineFix = useAppContext(
    (v) => v.requestHelpers.sponsorBuildProjectLumineFix
  );
  const applyBuildContributionLumineFix = useAppContext(
    (v) => v.requestHelpers.applyBuildContributionLumineFix
  );
  const [state, setState] = useState<BranchMainLumineFixState>(initialState);
  const lastEventTimeMsRef = useRef(0);
  const lastContributionEventTimeMsRef = useRef(0);
  const onContributionUpdateRef = useRef(onContributionUpdate);
  onContributionUpdateRef.current = onContributionUpdate;
  const scopeKey = active ? `${buildId}:${contributionBuildId}` : '';
  const stateMatchesScope = Boolean(scopeKey && state.scopeKey === scopeKey);
  const visibleFix = stateMatchesScope ? state.fix : null;
  const fixStatus = visibleFix?.status || '';

  useEffect(() => {
    lastEventTimeMsRef.current = 0;
    lastContributionEventTimeMsRef.current = 0;
    setState(initialState);
  }, [scopeKey]);

  useEffect(() => {
    if (!scopeKey) return;
    let canceled = false;

    const stopRecovery = startBuildContributionLumineFixRecovery({
      // A branch edit or a manual Main repair can close a waiting/failed fix
      // without this workspace originating the change. Keep reading canonical
      // state while any fix is visible, then stop as soon as the server clears
      // it.
      shouldPoll: Boolean(fixStatus),
      refreshCanonicalState,
      subscribeToReconnect,
      subscribeToVisible,
      scheduleRefresh
    });
    return () => {
      canceled = true;
      stopRecovery();
    };

    async function refreshCanonicalState() {
      setState((current) => ({ ...current, checking: true }));
      try {
        const result = await loadBuildProjectLumineFix({
          buildId,
          stateOnly: true
        });
        if (canceled) return;
        applyCanonicalState(result);
        if (
          !shouldLoadCurrentBranchLumineFixState({
            contributionBuildId,
            projectResult: result
          })
        ) {
          return;
        }
        const contributionResult = await loadBuildContributionLumineFix({
          buildId,
          contributionBuildId,
          stateOnly: true
        });
        if (canceled) return;
        applyCurrentBranchCanonicalContribution(contributionResult);
      } finally {
        if (!canceled) {
          setState((current) => ({ ...current, checking: false }));
        }
      }
    }

    function subscribeToReconnect(refresh: () => void) {
      function handleFixUpdate(payload: any) {
        if (Number(payload?.rootBuildId || 0) === buildId) {
          applyCanonicalState(payload);
        }
      }
      socket.on('connect', refresh);
      socket.on('build_contribution_lumine_fix_updated', handleFixUpdate);
      window.addEventListener('online', refresh);
      window.addEventListener('pageshow', refresh);
      return () => {
        socket.off('connect', refresh);
        socket.off('build_contribution_lumine_fix_updated', handleFixUpdate);
        window.removeEventListener('online', refresh);
        window.removeEventListener('pageshow', refresh);
      };
    }

    function subscribeToVisible(refresh: () => void) {
      function handleVisibilityChange() {
        if (document.visibilityState === 'visible') refresh();
      }
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        document.removeEventListener(
          'visibilitychange',
          handleVisibilityChange
        );
      };
    }

    function scheduleRefresh(refresh: () => void, delayMs: number) {
      const timer = window.setTimeout(refresh, delayMs);
      return () => window.clearTimeout(timer);
    }
    // Context request helpers are stable and intentionally omitted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildId, contributionBuildId, fixStatus, scopeKey]);

  return {
    ...state,
    checking: stateMatchesScope ? state.checking : Boolean(scopeKey),
    fix: visibleFix,
    details: stateMatchesScope ? state.details : null,
    selectedModel: stateMatchesScope ? state.selectedModel : '',
    loading: stateMatchesScope ? state.loading : '',
    error: stateMatchesScope ? state.error : '',
    wasApplied: stateMatchesScope && state.hadFix && !visibleFix,
    canSponsor:
      stateMatchesScope &&
      state.canSponsor === true &&
      (visibleFix?.status === 'needs_resolution' ||
        visibleFix?.status === 'failed' ||
        visibleFix?.status === 'stale'),
    contributionBuildId: stateMatchesScope ? state.contributionBuildId : 0,
    applyCanonicalUpdate: applyCanonicalState,
    openSponsor,
    sponsor,
    apply,
    setSelectedModel
  };

  function applyCanonicalState(result: any) {
    const eventTimeMs = Number(result?.eventTimeMs || 0);
    if (
      !eventTimeMs ||
      eventTimeMs < lastEventTimeMsRef.current ||
      !Object.prototype.hasOwnProperty.call(result || {}, 'lumineFix')
    ) {
      return false;
    }
    lastEventTimeMsRef.current = eventTimeMs;
    const nextFix =
      result.lumineFix && typeof result.lumineFix === 'object'
        ? (result.lumineFix as BuildContributionLumineFix)
        : null;
    const nextContributionBuildId = Number(
      result?.contributionBuildId || result?.contribution?.id || 0
    );
    applyCurrentBranchCanonicalContribution(result);
    setState((current) => ({
      ...current,
      scopeKey,
      contributionBuildId:
        nextContributionBuildId || current.contributionBuildId,
      canSponsor:
        typeof result?.canSponsor === 'boolean'
          ? result.canSponsor
          : current.canSponsor,
      fix: nextFix,
      hadFix: current.hadFix || Boolean(nextFix),
      ...(nextFix ? {} : { details: null, selectedModel: '', error: '' })
    }));
    return true;
  }

  function applyCurrentBranchCanonicalContribution(result: any) {
    const eventTimeMs = Number(result?.eventTimeMs || 0);
    if (!eventTimeMs || eventTimeMs < lastContributionEventTimeMsRef.current) {
      return false;
    }
    const currentBranchContribution = selectCurrentBranchCanonicalContribution({
      contributionBuildId,
      result
    });
    if (!currentBranchContribution) return false;
    lastContributionEventTimeMsRef.current = eventTimeMs;
    onContributionUpdateRef.current?.(currentBranchContribution);
    return true;
  }

  async function openSponsor() {
    if (!scopeKey || state.loading) return;
    setState((current) => ({
      ...current,
      loading: 'load-lumine-fix',
      error: ''
    }));
    try {
      const result = await loadBuildProjectLumineFix({ buildId });
      if (!result?.success) {
        setState((current) => ({
          ...current,
          error: result?.error || 'Lumine could not load this fix.'
        }));
        return;
      }
      if (!applyCanonicalState(result)) return;
      const details = result as BuildContributionLumineFixDetails;
      const modelOptions = Array.isArray(details.modelOptions)
        ? details.modelOptions
        : [];
      const preferredModel = String(details.modelSelection?.model || '');
      setState((current) => ({
        ...current,
        details,
        selectedModel: modelOptions.some(
          (option) => option.model === preferredModel
        )
          ? preferredModel
          : modelOptions[0]?.model || ''
      }));
    } catch (error: any) {
      applyCanonicalState(error?.responseData || error?.response?.data);
      setState((current) => ({
        ...current,
        error: getLumineFixErrorMessage(
          error,
          'Lumine could not load this fix.'
        )
      }));
    } finally {
      setState((current) => ({ ...current, loading: '' }));
    }
  }

  async function sponsor() {
    if (!scopeKey || state.loading || !state.selectedModel) return;
    const selectedOption = state.details?.modelOptions?.find(
      (option) => option.model === state.selectedModel
    );
    if (!selectedOption) {
      setState((current) => ({
        ...current,
        error: 'Choose a Lumine model first.'
      }));
      return;
    }
    setState((current) => ({
      ...current,
      loading: 'sponsor-lumine-fix',
      error: ''
    }));
    try {
      const result = await sponsorBuildProjectLumineFix({
        buildId,
        model: selectedOption.model,
        reasoningEffort: selectedOption.defaultReasoningEffort
      });
      if (!result?.success) {
        setState((current) => ({
          ...current,
          error: result?.error || 'Lumine could not start this fix.'
        }));
        return;
      }
      applyCanonicalState(result);
      setState((current) => ({ ...current, details: null }));
    } catch (error: any) {
      applyCanonicalState(error?.responseData || error?.response?.data);
      setState((current) => ({
        ...current,
        error: getLumineFixErrorMessage(
          error,
          'Lumine could not start this fix.'
        )
      }));
    } finally {
      setState((current) => ({ ...current, loading: '' }));
    }
  }

  async function apply() {
    if (!scopeKey || state.loading || !state.contributionBuildId) return;
    setState((current) => ({
      ...current,
      loading: 'apply-lumine-fix',
      error: ''
    }));
    try {
      const result = await applyBuildContributionLumineFix({
        buildId,
        contributionBuildId: state.contributionBuildId
      });
      if (!result?.success) {
        setState((current) => ({
          ...current,
          error: result?.error || 'Lumine could not apply this fix.'
        }));
        return;
      }
      const accepted = applyCanonicalState(result);
      setState((current) => ({ ...current, details: null }));
      if (accepted) onApplied?.(result);
    } catch (error: any) {
      applyCanonicalState(error?.responseData || error?.response?.data);
      setState((current) => ({
        ...current,
        error: getLumineFixErrorMessage(
          error,
          'Lumine could not apply this fix.'
        )
      }));
    } finally {
      setState((current) => ({ ...current, loading: '' }));
    }
  }

  function setSelectedModel(model: string) {
    setState((current) => ({ ...current, selectedModel: model }));
  }
}

function getLumineFixErrorMessage(error: any, fallback: string) {
  return (
    error?.responseData?.error ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}
