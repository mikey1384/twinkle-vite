import React, { useEffect, useMemo, useState } from 'react';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import Icon from '~/components/Icon';
import BuildMessageCard, { BuildMessageCardChip } from './BuildMessageCard';
import { Color } from '~/constants/css';
import { timeSince } from '~/helpers/timeStampHelpers';
import { useAppContext, useChatContext } from '~/contexts';
import { isCachedCardStateFresher } from '~/helpers/buildCardState';
import { getBuildWorkspacePath } from '~/helpers/buildNavigationHelpers';
import { canUpdateAppFromBuildContributionSubmission } from '~/helpers/buildContributionSubmissionHelpers';
import { startBuildContributionLumineFixRecovery } from '~/helpers/buildContributionLumineFixRecovery';
import { socket } from '~/constants/sockets/api';

type BuildContributionSubmissionStatus = 'open' | 'merging' | 'merged' | 'gone';
type BuildContributionLumineFixStatus =
  'needs_resolution' | 'running' | 'ready' | 'failed' | 'stale';

type ChangedFileStatus = 'added' | 'updated' | 'deleted';

interface BuildContributionLumineFix {
  id?: number | null;
  status?: BuildContributionLumineFixStatus;
  reviewRequired?: boolean;
  conflictPaths?: string[];
  changedPaths?: string[];
  sponsorUserId?: number | null;
  model?: string | null;
  reasoningEffort?: string | null;
  summary?: string | null;
  errorMessage?: string | null;
}

interface LumineModelOption {
  model: string;
  label: string;
  description: string;
  defaultReasoningEffort: string;
  supportedReasoningEfforts: string[];
}

interface LumineFixDetails {
  canSponsor?: boolean;
  canApply?: boolean;
  modelOptions?: LumineModelOption[];
  modelSelection?: {
    model?: string;
    reasoningEffort?: string;
  };
  review?: {
    changedFiles?: Array<{
      path?: string;
      beforeContent?: string;
      afterContent?: string;
    }>;
  } | null;
}

const activeLumineFixStateRequests = new Map<string, Promise<any>>();
const lumineFixReconnectRefreshers = new Set<() => void>();

function refreshLumineFixCardsAfterReconnect() {
  for (const refresh of lumineFixReconnectRefreshers) refresh();
}

function subscribeToLumineFixReconnectRefresh(refresh: () => void) {
  const shouldAttachListeners = lumineFixReconnectRefreshers.size === 0;
  lumineFixReconnectRefreshers.add(refresh);
  if (shouldAttachListeners) {
    socket.on('connect', refreshLumineFixCardsAfterReconnect);
    window.addEventListener('online', refreshLumineFixCardsAfterReconnect);
    window.addEventListener('pageshow', refreshLumineFixCardsAfterReconnect);
  }
  return () => {
    lumineFixReconnectRefreshers.delete(refresh);
    if (lumineFixReconnectRefreshers.size > 0) return;
    socket.off('connect', refreshLumineFixCardsAfterReconnect);
    window.removeEventListener('online', refreshLumineFixCardsAfterReconnect);
    window.removeEventListener('pageshow', refreshLumineFixCardsAfterReconnect);
  };
}

function subscribeToLumineFixVisibleRefresh(refresh: () => void) {
  function handleVisibilityChange() {
    if (document.visibilityState === 'visible') refresh();
  }

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}

function scheduleLumineFixRefresh(refresh: () => void, delayMs: number) {
  const timer = window.setTimeout(refresh, delayMs);
  return () => window.clearTimeout(timer);
}

function loadCanonicalLumineFixStateOnce({
  buildId,
  contributionBuildId,
  loadState
}: {
  buildId: number;
  contributionBuildId: number;
  loadState: (input: {
    buildId: number;
    contributionBuildId: number;
    stateOnly?: boolean;
  }) => Promise<any>;
}) {
  const key = `${buildId}:${contributionBuildId}`;
  const activeRequest = activeLumineFixStateRequests.get(key);
  if (activeRequest) return activeRequest;
  const request = Promise.resolve()
    .then(() => loadState({ buildId, contributionBuildId, stateOnly: true }))
    .finally(() => {
      if (activeLumineFixStateRequests.get(key) === request) {
        activeLumineFixStateRequests.delete(key);
      }
    });
  activeLumineFixStateRequests.set(key, request);
  return request;
}

interface BuildContributionSubmissionPayload {
  rootBuildId?: number;
  branchBuildId?: number;
  contributorUserId?: number;
  ownerUserId?: number;
  title?: string;
  branchLabel?: string;
  branchNumber?: number;
  changedFiles?: Array<{ path?: string; status?: ChangedFileStatus }>;
  diffSummary?: {
    total?: number;
    added?: number;
    updated?: number;
    deleted?: number;
  };
  revisionHash?: string;
  status?: BuildContributionSubmissionStatus;
  createdAt?: number;
  ownerLastOpenedBranchAt?: number;
  ownerOpenedSubmittedWork?: boolean;
  ownerOpenedLatestWork?: boolean;
  hasNewerWorkSinceSubmission?: boolean;
  // Stamped by the hydrator when this payload was read, so the card can tell
  // it apart from anything this tab cached afterwards.
  eventTimeMs?: number;
  isPublic?: boolean;
  releaseStatus?: {
    hasUnpublishedChanges?: boolean;
  } | null;
  lumineFix?: BuildContributionLumineFix | null;
}

export default function BuildContributionSubmission({
  content,
  submission,
  myId,
  sender
}: {
  content: string;
  submission?: BuildContributionSubmissionPayload | null;
  myId: number;
  sender: {
    id: number;
    username: string;
    profileTheme?: string | null;
  };
}) {
  const navigate = useNavigate();
  const mergeBuildContribution = useAppContext(
    (v) => v.requestHelpers.mergeBuildContribution
  );
  const replaceMainWithBuildContribution = useAppContext(
    (v) => v.requestHelpers.replaceMainWithBuildContribution
  );
  const loadBuildContributionLumineFix = useAppContext(
    (v) => v.requestHelpers.loadBuildContributionLumineFix
  );
  const sponsorBuildContributionLumineFix = useAppContext(
    (v) => v.requestHelpers.sponsorBuildContributionLumineFix
  );
  const applyBuildContributionLumineFix = useAppContext(
    (v) => v.requestHelpers.applyBuildContributionLumineFix
  );
  const publishBuild = useAppContext((v) => v.requestHelpers.publishBuild);
  const onUpdateBuildContributionSubmissionState = useChatContext(
    (v) => v.actions.onUpdateBuildContributionSubmissionState
  );
  const [detailsShown, setDetailsShown] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [actionError, setActionError] = useState('');
  const [confirmingReplace, setConfirmingReplace] = useState(false);
  const [lumineFixDetails, setLumineFixDetails] =
    useState<LumineFixDetails | null>(null);
  const [selectedLumineModel, setSelectedLumineModel] = useState('');

  const rootBuildId = Number(submission?.rootBuildId || 0);
  const branchBuildId = Number(submission?.branchBuildId || 0);
  const cachedSubmissionState = useChatContext((v) =>
    branchBuildId > 0
      ? v.state.buildContributionSubmissionByBranchId?.[branchBuildId]
      : null
  );
  const cachedReleaseState = useChatContext((v) =>
    rootBuildId > 0
      ? v.state.buildContributionReleaseByRootBuildId?.[rootBuildId]
      : null
  );
  // Only when it is actually newer than what the server hydrated. The cache is
  // keyed by branch, and a branch outlives any one submission: merge an earlier
  // card, then the contributor saves again and sends a new one, and without this
  // the fresh 'open' card inherits the old 'merged' entry and hides the very
  // actions the owner was messaged about.
  const payload = useMemo(() => {
    const branchPayload = isCachedCardStateFresher(
      cachedSubmissionState,
      submission
    )
      ? { ...(submission || {}), ...(cachedSubmissionState || {}) }
      : { ...(submission || {}) };
    return isCachedCardStateFresher(cachedReleaseState, submission)
      ? { ...branchPayload, ...(cachedReleaseState || {}) }
      : branchPayload;
  }, [submission, cachedSubmissionState, cachedReleaseState]);
  const title = String(payload?.title || 'their project');
  const branchLabel = String(payload?.branchLabel || 'their branch');
  const changedFiles: Array<{ path?: string; status?: ChangedFileStatus }> =
    Array.isArray(payload?.changedFiles) ? payload.changedFiles : [];
  const diffSummary = payload?.diffSummary || {};
  const status: BuildContributionSubmissionStatus =
    (payload?.status as BuildContributionSubmissionStatus) || 'open';
  const sentByMe = Number(sender.id) === Number(myId);
  const isOwner = Number(payload?.ownerUserId || 0) === Number(myId);
  const isContributor =
    Number(payload?.contributorUserId || 0) === Number(myId);
  const lumineFix = payload?.lumineFix || null;
  const lumineFixStatus = lumineFix?.status || null;
  const hasUnresolvedLumineFix = status === 'merged' && Boolean(lumineFix);
  const note = String(content || '').trim();
  const canUpdateApp = canUpdateAppFromBuildContributionSubmission({
    isOwner,
    isPublic: payload?.isPublic,
    releaseStatus: payload?.releaseStatus,
    status
  });

  useEffect(() => {
    const shouldRecoverMissedOutcome =
      status === 'open' || hasUnresolvedLumineFix;
    if (!shouldRecoverMissedOutcome || !rootBuildId || !branchBuildId) {
      return;
    }
    const shouldPoll = lumineFixStatus === 'running';
    let canceled = false;
    const stopRecovery = startBuildContributionLumineFixRecovery({
      shouldPoll,
      refreshCanonicalState: refreshCanonicalLumineFixState,
      subscribeToReconnect: subscribeToLumineFixReconnectRefresh,
      subscribeToVisible: subscribeToLumineFixVisibleRefresh,
      scheduleRefresh: scheduleLumineFixRefresh
    });
    return () => {
      canceled = true;
      stopRecovery();
    };

    async function refreshCanonicalLumineFixState() {
      if (canceled) return;
      try {
        const result = await loadCanonicalLumineFixStateOnce({
          buildId: rootBuildId,
          contributionBuildId: branchBuildId,
          loadState: loadBuildContributionLumineFix
        });
        if (canceled || !result?.success) return;
        const hasLumineFix = Object.prototype.hasOwnProperty.call(
          result,
          'lumineFix'
        );
        const contribution =
          result.contribution && typeof result.contribution === 'object'
            ? result.contribution
            : null;
        const eventTimeMs = Number(result.eventTimeMs || 0);
        if ((hasLumineFix || contribution) && eventTimeMs > 0) {
          onUpdateBuildContributionSubmissionState({
            branchBuildId,
            rootBuildId,
            contribution,
            lumineFix: result.lumineFix,
            eventTimeMs
          });
        }
      } catch {
        // The socket event is primary. A later poll, entry, visibility,
        // reconnect, or canonical message hydration can retry this read.
      }
    }
    // Context actions and request helpers are stable and intentionally omitted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    branchBuildId,
    hasUnresolvedLumineFix,
    lumineFixStatus,
    rootBuildId,
    status
  ]);

  if (!rootBuildId || !branchBuildId) {
    return <span>{content}</span>;
  }

  return (
    <BuildMessageCard
      themeName={sender.profileTheme}
      bannerText={
        <>Made updates to {isOwner ? 'your project' : 'this project'}</>
      }
      title={title}
      chips={
        <>
          <BuildMessageCardChip
            icon="code-branch"
            themeName={sender.profileTheme}
          >
            {branchLabel}
          </BuildMessageCardChip>
          {changedFiles.length > 0 ? (
            <BuildMessageCardChip muted>
              {formatDiffSummary(diffSummary, changedFiles.length)}
            </BuildMessageCardChip>
          ) : null}
        </>
      }
      actions={
        <>
          {/* Nothing to open once the branch is gone. The URL would 404, and a
              card offering a dead link reads as a bug rather than as the branch
              having been removed. */}
          {status !== 'gone' ? (
            <GameCTAButton
              variant="neutral"
              size="md"
              icon="external-link-alt"
              onClick={handleOpenBranch}
            >
              Open branch
            </GameCTAButton>
          ) : null}
          {hasUnresolvedLumineFix &&
          isContributor &&
          (lumineFixStatus === 'needs_resolution' ||
            lumineFixStatus === 'failed') ? (
            <GameCTAButton
              variant="purple"
              size="md"
              icon="wand-magic-sparkles"
              loading={actionLoading === 'load-lumine-fix'}
              onClick={handleOpenLumineFix}
            >
              Sponsor Lumine Fix
            </GameCTAButton>
          ) : null}
          {hasUnresolvedLumineFix && isOwner && lumineFixStatus === 'ready' ? (
            <GameCTAButton
              variant="purple"
              size="md"
              icon="wand-magic-sparkles"
              loading={actionLoading === 'load-lumine-fix'}
              onClick={handleOpenLumineFix}
            >
              {lumineFix?.reviewRequired
                ? 'Review Lumine Fix'
                : 'Finish Lumine Fix'}
            </GameCTAButton>
          ) : null}
          {/* Only an open branch can merge. Replace Main also supports a merged
              branch with an unresolved conflict as the owner's explicit
              fallback; a contributor never sees that destructive option. */}
          {isOwner && status === 'merging' ? (
            <GameCTAButton
              variant="orange"
              size="md"
              icon="code-branch"
              onClick={handleOpenMergePanel}
            >
              Finish merge
            </GameCTAButton>
          ) : null}
          {isOwner && (status === 'open' || hasUnresolvedLumineFix) ? (
            confirmingReplace ? (
              <>
                <GameCTAButton
                  variant="orange"
                  size="md"
                  icon="exclamation-triangle"
                  loading={actionLoading === 'replace-main'}
                  onClick={handleReplaceMain}
                >
                  Yes, replace Main
                </GameCTAButton>
                <GameCTAButton
                  variant="neutral"
                  size="md"
                  onClick={() => setConfirmingReplace(false)}
                >
                  Cancel
                </GameCTAButton>
              </>
            ) : (
              <>
                {status === 'open' ? (
                  <GameCTAButton
                    variant="success"
                    size="md"
                    icon="code-branch"
                    shiny
                    loading={actionLoading === 'merge'}
                    onClick={handleMerge}
                  >
                    Merge
                  </GameCTAButton>
                ) : null}
                <GameCTAButton
                  variant="orange"
                  size="md"
                  icon="repeat"
                  onClick={() => setConfirmingReplace(true)}
                >
                  Replace Main
                </GameCTAButton>
              </>
            )
          ) : null}
          {canUpdateApp ? (
            <GameCTAButton
              variant="magenta"
              size="md"
              icon="globe"
              shiny
              loading={actionLoading === 'update-app'}
              onClick={handleUpdateApp}
            >
              Update App
            </GameCTAButton>
          ) : null}
        </>
      }
    >
      {note ? <div className={noteClass}>{note}</div> : null}

      {hasUnresolvedLumineFix ? (
        <LumineFixStatusPanel
          fix={lumineFix}
          isContributor={isContributor}
          isOwner={isOwner}
          details={lumineFixDetails}
          selectedModel={selectedLumineModel}
          loading={actionLoading}
          onSelectModel={setSelectedLumineModel}
          onSponsor={handleSponsorLumineFix}
          onApply={handleApplyLumineFix}
        />
      ) : null}

      {changedFiles.length > 0 ? (
        <div>
          <button
            className={disclosureClass}
            onClick={() => setDetailsShown((shown) => !shown)}
            type="button"
          >
            <Icon icon={detailsShown ? 'chevron-down' : 'chevron-right'} />
            <span>{detailsShown ? 'Hide changes' : 'See what changed'}</span>
          </button>
          {detailsShown ? (
            <ul className={fileListClass}>
              {changedFiles.map((file) => (
                <li key={String(file?.path || '')}>
                  <span
                    className={fileStatusClass}
                    style={{ background: getFileStatusColor(file?.status) }}
                  >
                    {getFileStatusLabel(file?.status)}
                  </span>
                  <span className={filePathClass}>
                    {String(file?.path || '')}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {status === 'merged' && !hasUnresolvedLumineFix ? (
        <div className={settledClass}>
          <Icon icon="check" />
          <span>
            {isOwner
              ? 'You merged this into your project.'
              : 'Merged into the project.'}
          </span>
        </div>
      ) : null}

      {status === 'gone' ? (
        <div className={ownerLookClass}>
          <Icon icon="times-circle" />
          <span>
            This branch is no longer available, so these changes cannot be
            merged.
          </span>
        </div>
      ) : null}

      {status === 'merging' ? (
        <div className={ownerLookClass}>
          <Icon icon="code-branch" />
          <span>
            {isOwner
              ? 'This merge has conflicts left to resolve in the project.'
              : 'The owner is merging this, with conflicts left to resolve.'}
          </span>
        </div>
      ) : null}

      {sentByMe && status !== 'merged' ? (
        <div className={ownerLookClass}>{renderOwnerLookSignal(payload)}</div>
      ) : null}

      {/* The owner's half of the same signal. Merging takes the branch as it
          stands, not the file list frozen above, so when the two have drifted
          apart the owner is told which one the buttons act on. Deliberately not
          a blocker: a branch is a live thing and merging a newer version of it
          is the normal outcome, not an accident to be prevented. */}
      {isOwner &&
      status !== 'merged' &&
      status !== 'gone' &&
      payload?.hasNewerWorkSinceSubmission ? (
        <div className={ownerLookClass}>
          <Icon icon="info-circle" />
          <span>
            {sender.username} has saved more changes since this message. Merging
            takes the branch as it is now.
          </span>
        </div>
      ) : null}

      {actionError ? <div className={errorClass}>{actionError}</div> : null}

      {confirmingReplace ? (
        <div className={confirmCopyClass}>
          Replace everything in <strong>{title}</strong> with this branch?
        </div>
      ) : null}
    </BuildMessageCard>
  );

  function handleOpenBranch() {
    // Built by the shared helper, never by hand: the client route is
    // `/build/:buildId/:branchNumber`, while the API's branch route is
    // `/:buildId/branches/:branchNumber`, and hand-writing the link here once
    // borrowed the API shape and sent the owner to a path that matches no route.
    // The helper also already falls back to the branch build's own page when the
    // payload predates branch numbering.
    navigate(
      getBuildWorkspacePath({
        id: branchBuildId,
        contributionRootBuildId: rootBuildId,
        contributionBranchNumber: payload?.branchNumber
      })
    );
  }

  function handleOpenMergePanel() {
    navigate(`/build/${rootBuildId}`, {
      state: {
        openVersionsPanel: true,
        contributionBuildId: branchBuildId
      }
    });
  }

  async function handleMerge() {
    if (actionLoading) return;
    setActionLoading('merge');
    setActionError('');
    try {
      // No filePaths: Merge here means the whole submitted branch. The card's
      // file list is a display summary capped at 60 entries, so sending it as
      // the selection would silently drop the rest of a large branch's work.
      // The server defaults to every changed file when the field is absent.
      const result = await mergeBuildContribution({
        buildId: rootBuildId,
        contributionBuildId: branchBuildId
      });
      if (!result?.success) {
        setActionError(result?.error || 'Failed to merge branch');
        return;
      }
      applyCanonicalSubmissionState(result);
    } catch (error: any) {
      handleActionError(error, 'Failed to merge branch');
    } finally {
      setActionLoading('');
    }
  }

  async function handleReplaceMain() {
    if (actionLoading) return;
    setActionLoading('replace-main');
    setActionError('');
    setConfirmingReplace(false);
    try {
      const result = await replaceMainWithBuildContribution({
        buildId: rootBuildId,
        contributionBuildId: branchBuildId
      });
      if (!result?.success) {
        setActionError(result?.error || 'Failed to replace Main');
        return;
      }
      applyCanonicalSubmissionState(result);
    } catch (error: any) {
      handleActionError(error, 'Failed to replace Main');
    } finally {
      setActionLoading('');
    }
  }

  async function handleUpdateApp() {
    if (actionLoading) return;
    setActionLoading('update-app');
    setActionError('');
    try {
      const result = await publishBuild({ buildId: rootBuildId });
      if (!result?.success || !result?.build) {
        setActionError(result?.error || 'Failed to update app');
        return;
      }
      applyCanonicalSubmissionState(result);
    } catch (error: any) {
      const responseData = error?.response?.data || {};
      if (
        responseData.code === 'build_release_up_to_date' &&
        responseData.releaseStatus &&
        Number(responseData.eventTimeMs || 0) > 0
      ) {
        applyCanonicalSubmissionState({
          build: {
            id: rootBuildId,
            isPublic: responseData.releaseStatus.isPublic,
            releaseStatus: responseData.releaseStatus
          },
          eventTimeMs: responseData.eventTimeMs
        });
        return;
      }
      handleActionError(error, 'Failed to update app');
    } finally {
      setActionLoading('');
    }
  }

  async function handleOpenLumineFix() {
    if (actionLoading) return;
    setActionLoading('load-lumine-fix');
    setActionError('');
    try {
      const result = await loadBuildContributionLumineFix({
        buildId: rootBuildId,
        contributionBuildId: branchBuildId
      });
      if (!result?.success) {
        setActionError(result?.error || 'Failed to load the Lumine fix.');
        return;
      }
      applyCanonicalSubmissionState(result);
      const details = result as LumineFixDetails & { lumineFix?: unknown };
      setLumineFixDetails(details);
      const modelOptions = Array.isArray(details.modelOptions)
        ? details.modelOptions
        : [];
      const preferredModel = String(details.modelSelection?.model || '');
      setSelectedLumineModel(
        modelOptions.some((option) => option.model === preferredModel)
          ? preferredModel
          : modelOptions[0]?.model || ''
      );
    } catch (error: any) {
      handleActionError(error, 'Failed to load the Lumine fix.');
    } finally {
      setActionLoading('');
    }
  }

  async function handleSponsorLumineFix() {
    if (actionLoading || !selectedLumineModel) return;
    const modelOptions = lumineFixDetails?.modelOptions || [];
    const selectedOption = modelOptions.find(
      (option) => option.model === selectedLumineModel
    );
    if (!selectedOption) {
      setActionError('Choose a Lumine model before sponsoring this fix.');
      return;
    }
    setActionLoading('sponsor-lumine-fix');
    setActionError('');
    try {
      const result = await sponsorBuildContributionLumineFix({
        buildId: rootBuildId,
        contributionBuildId: branchBuildId,
        model: selectedOption.model,
        reasoningEffort: selectedOption.defaultReasoningEffort
      });
      if (!result?.success) {
        setActionError(result?.error || 'Failed to sponsor the Lumine fix.');
        return;
      }
      applyCanonicalSubmissionState(result);
      setLumineFixDetails(null);
    } catch (error: any) {
      handleActionError(error, 'Failed to sponsor the Lumine fix.');
    } finally {
      setActionLoading('');
    }
  }

  async function handleApplyLumineFix() {
    if (actionLoading) return;
    setActionLoading('apply-lumine-fix');
    setActionError('');
    try {
      const result = await applyBuildContributionLumineFix({
        buildId: rootBuildId,
        contributionBuildId: branchBuildId
      });
      if (!result?.success) {
        setActionError(result?.error || 'Failed to apply the Lumine fix.');
        return;
      }
      applyCanonicalSubmissionState(result);
      setLumineFixDetails(null);
    } catch (error: any) {
      handleActionError(error, 'Failed to apply the Lumine fix.');
    } finally {
      setActionLoading('');
    }
  }

  // Only the server's returned branch and root rows can move card or release
  // state. A request completing by itself proves neither merge nor publish.
  function applyCanonicalSubmissionState(result: any) {
    const contribution = result?.contribution || null;
    const build = result?.build || null;
    const hasLumineFix = Object.prototype.hasOwnProperty.call(
      result || {},
      'lumineFix'
    );
    const eventTimeMs = Number(result?.eventTimeMs || 0);
    if ((!contribution && !build && !hasLumineFix) || !eventTimeMs) return;
    onUpdateBuildContributionSubmissionState({
      branchBuildId,
      rootBuildId: Number(build?.id || rootBuildId),
      build,
      contribution,
      ...(hasLumineFix ? { lumineFix: result.lumineFix } : {}),
      eventTimeMs
    });
  }

  function handleActionError(error: any, fallbackMessage: string) {
    const responseData = error?.responseData || error?.response?.data || {};
    applyCanonicalSubmissionState(responseData);
    const code = String(responseData?.code || '');
    if (code === 'build_contribution_root_drifted') {
      setActionError(
        'Main moved on since this branch was made. Open the project to update and merge it.'
      );
      handleOpenMergePanel();
      return;
    }
    setActionError(responseData?.error || error?.message || fallbackMessage);
  }
}

// The sender's half of the card: did the owner actually look at the work, as
// opposed to the message being delivered. Hash-based, so updating from Main
// does not read as "they looked again".
function renderOwnerLookSignal(payload: BuildContributionSubmissionPayload) {
  const ownerLastOpenedBranchAt = Number(payload?.ownerLastOpenedBranchAt || 0);
  if (!ownerLastOpenedBranchAt) {
    return (
      <>
        <Icon icon="eye-slash" />
        <span>The owner hasn&apos;t opened your branch yet.</span>
      </>
    );
  }
  if (payload?.hasNewerWorkSinceSubmission && !payload?.ownerOpenedLatestWork) {
    return (
      <>
        <Icon icon="eye" />
        <span>
          The owner opened your branch {timeSince(ownerLastOpenedBranchAt)}, but
          you have saved changes since then.
        </span>
      </>
    );
  }
  if (payload?.ownerOpenedSubmittedWork || payload?.ownerOpenedLatestWork) {
    return (
      <>
        <Icon icon="eye" />
        <span>
          The owner opened your branch {timeSince(ownerLastOpenedBranchAt)}.
        </span>
      </>
    );
  }
  return (
    <>
      <Icon icon="eye-slash" />
      <span>
        The owner last opened your branch {timeSince(ownerLastOpenedBranchAt)},
        before these changes.
      </span>
    </>
  );
}

function LumineFixStatusPanel({
  fix,
  isContributor,
  isOwner,
  details,
  selectedModel,
  loading,
  onSelectModel,
  onSponsor,
  onApply
}: {
  fix: BuildContributionLumineFix;
  isContributor: boolean;
  isOwner: boolean;
  details: LumineFixDetails | null;
  selectedModel: string;
  loading: string;
  onSelectModel: (model: string) => void;
  onSponsor: () => void;
  onApply: () => void;
}) {
  const status = fix.status || 'needs_resolution';
  const modelOptions = Array.isArray(details?.modelOptions)
    ? details.modelOptions
    : [];
  const selectedOption = modelOptions.find(
    (option) => option.model === selectedModel
  );
  const reviewFiles: Array<{
    path?: string;
    beforeContent?: string;
    afterContent?: string;
  }> = details?.review?.changedFiles || [];
  const sponsorable =
    isContributor && (status === 'needs_resolution' || status === 'failed');

  return (
    <div className={lumineFixPanelClass}>
      <div className={lumineFixHeadingClass}>
        <Icon icon="wand-magic-sparkles" />
        <strong>
          {getLumineFixHeading(status, Boolean(fix.reviewRequired))}
        </strong>
      </div>
      <span className={lumineFixCopyClass}>
        {getLumineFixCopy({
          status,
          isContributor,
          isOwner,
          reviewRequired: Boolean(fix.reviewRequired)
        })}
      </span>
      {fix.errorMessage ? (
        <span className={lumineFixErrorClass}>{fix.errorMessage}</span>
      ) : null}
      {status === 'ready' && fix.reviewRequired && fix.summary ? (
        <span className={lumineFixCopyClass}>{fix.summary}</span>
      ) : null}
      {status === 'ready' && fix.changedPaths?.length ? (
        <span className={lumineFixPathsClass}>
          {fix.changedPaths.join(', ')}
        </span>
      ) : null}
      {sponsorable && details?.canSponsor ? (
        <div className={lumineFixControlsClass}>
          <label className={lumineModelLabelClass}>
            <span>Model</span>
            <select
              value={selectedModel}
              disabled={Boolean(loading)}
              onChange={(event) => onSelectModel(event.target.value)}
            >
              {modelOptions.map((option) => (
                <option key={option.model} value={option.model}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          {selectedOption ? (
            <span className={lumineFixCopyClass}>
              {selectedOption.description}
            </span>
          ) : null}
          <GameCTAButton
            variant="purple"
            size="md"
            icon="wand-magic-sparkles"
            loading={loading === 'sponsor-lumine-fix'}
            disabled={!selectedOption || Boolean(loading)}
            onClick={onSponsor}
          >
            Sponsor {selectedOption?.label || 'Lumine'} Fix
          </GameCTAButton>
        </div>
      ) : null}
      {isOwner && status === 'ready' && details?.canApply ? (
        <div className={lumineFixControlsClass}>
          <strong className={lumineReviewTitleClass}>
            {fix.reviewRequired ? 'Review fix' : 'Apply resolved fix'}
          </strong>
          {reviewFiles.map((file) => (
            <details
              key={String(file.path || '')}
              className={lumineReviewFileClass}
            >
              <summary>{String(file.path || 'Changed file')}</summary>
              <span>Conflict-marked Main</span>
              <pre>{String(file.beforeContent || '')}</pre>
              <span>Lumine proposal</span>
              <pre>{String(file.afterContent || '')}</pre>
            </details>
          ))}
          {reviewFiles.length === 0 ? (
            <span className={lumineFixErrorClass}>
              This proposal could not be verified again, so it cannot be
              applied.
            </span>
          ) : null}
          <GameCTAButton
            variant="success"
            size="md"
            icon="check"
            loading={loading === 'apply-lumine-fix'}
            disabled={reviewFiles.length === 0 || Boolean(loading)}
            onClick={onApply}
          >
            Apply Lumine Fix
          </GameCTAButton>
        </div>
      ) : null}
    </div>
  );
}

function getLumineFixHeading(
  status: BuildContributionLumineFixStatus,
  reviewRequired: boolean
) {
  if (status === 'running') return 'Lumine is preparing a fix';
  if (status === 'ready') {
    return reviewRequired
      ? 'Lumine fix is ready to review'
      : 'Lumine resolved the conflict';
  }
  if (status === 'failed') return 'Lumine fix did not finish';
  if (status === 'stale') return 'Lumine fix is out of date';
  return 'This merge needs conflict resolution';
}

function getLumineFixCopy({
  status,
  isContributor,
  isOwner,
  reviewRequired
}: {
  status: BuildContributionLumineFixStatus;
  isContributor: boolean;
  isOwner: boolean;
  reviewRequired: boolean;
}) {
  if (status === 'running') {
    return reviewRequired
      ? 'Lumine is resolving the conflict. This project is set to wait for owner review before changing Main.'
      : 'Lumine is resolving the conflict and will apply the fix to Main automatically after safety checks pass.';
  }
  if (status === 'ready') {
    if (!reviewRequired) {
      return isOwner
        ? 'Automatic apply did not complete. Apply the validated fix below.'
        : 'Automatic apply did not complete. The project owner can finish applying the validated fix.';
    }
    return isOwner
      ? 'Review the exact fix below before applying it to Main.'
      : 'This project requires the owner to review the fix before it changes Main.';
  }
  if (status === 'failed' || status === 'stale') {
    if (status === 'stale') {
      return 'Main changed after this conflict merge, so this proposal cannot safely be rerun. Resolve the current Main conflict manually.';
    }
    return isContributor
      ? 'Choose a model to try the fix again, or resolve the conflict manually in Main.'
      : 'The contributor can sponsor another fix, or the owner can resolve the conflict in Main.';
  }
  if (!isContributor) {
    return 'The contributor can sponsor Lumine, or the owner can resolve the conflict in Main.';
  }
  return reviewRequired
    ? 'Sponsor Lumine to resolve the conflict. This project is set to wait for owner review.'
    : 'Sponsor Lumine to resolve the conflict and apply the validated fix to Main automatically.';
}

function formatDiffSummary(
  diffSummary: BuildContributionSubmissionPayload['diffSummary'],
  fallbackTotal: number
) {
  const total = Number(diffSummary?.total || fallbackTotal || 0);
  const parts = [
    Number(diffSummary?.added || 0) > 0 ? `${diffSummary?.added} added` : '',
    Number(diffSummary?.updated || 0) > 0
      ? `${diffSummary?.updated} updated`
      : '',
    Number(diffSummary?.deleted || 0) > 0
      ? `${diffSummary?.deleted} deleted`
      : ''
  ].filter(Boolean);
  if (parts.length === 0) {
    return `${total} file${total === 1 ? '' : 's'} changed`;
  }
  return parts.join(', ');
}

function getFileStatusLabel(status?: ChangedFileStatus) {
  if (status === 'added') return 'new';
  if (status === 'deleted') return 'del';
  return 'mod';
}

function getFileStatusColor(status?: ChangedFileStatus) {
  if (status === 'added') return Color.green();
  if (status === 'deleted') return Color.rose();
  return Color.darkGray();
}

const noteClass = css`
  border-left: 4px solid ${Color.logoBlue(0.55)};
  padding: 0.1rem 0 0.1rem 0.75rem;
  color: ${Color.black()};
  line-height: 1.45;
  white-space: pre-wrap;
  font-size: 1.3rem;
`;

const disclosureClass = css`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: ${Color.logoBlue()};
  font-size: 1.1rem;
  font-weight: 800;
  &:hover {
    text-decoration: underline;
  }
`;

const fileListClass = css`
  margin: 0.6rem 0 0 0;
  padding: 0.5rem 0.6rem;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  max-height: 16rem;
  overflow-y: auto;
  background: ${Color.highlightGray()};
  border-radius: 8px;
  > li {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 1.1rem;
  }
`;

const fileStatusClass = css`
  font-family: 'Roboto Mono', monospace;
  font-size: 1.1rem;
  font-weight: 800;
  color: #fff;
  border-radius: 5px;
  padding: 0.1rem 0.4rem;
  flex-shrink: 0;
  text-transform: uppercase;
`;

const filePathClass = css`
  font-family: 'Roboto Mono', monospace;
  font-size: 1.1rem;
  color: ${Color.black()};
  word-break: break-all;
`;

const settledClass = css`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  color: ${Color.green()};
  font-size: 1.2rem;
  font-weight: 800;
`;

// Both sides' status line: the sender's "have they looked at it yet" and the
// owner's "the branch has moved since this". flex-start rather than center
// because either one can wrap to two lines on a phone, and a centred icon next
// to two lines of text sits in the middle of the block.
const ownerLookClass = css`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  color: ${Color.darkerGray()};
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1.4;
`;

const errorClass = css`
  color: ${Color.rose()};
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1.4;
`;

const confirmCopyClass = css`
  color: ${Color.black()};
  font-size: 1.2rem;
  font-weight: 700;
`;

const lumineFixPanelClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  border: 1px solid rgba(126, 87, 194, 0.35);
  border-radius: 8px;
  padding: 0.8rem;
  background: #faf7ff;
`;

const lumineFixHeadingClass = css`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6038a5;
  font-size: 1.2rem;
`;

const lumineFixCopyClass = css`
  color: ${Color.darkerGray()};
  font-size: 1.1rem;
  font-weight: 650;
  line-height: 1.4;
`;

const lumineFixErrorClass = css`
  color: ${Color.rose()};
  font-size: 1.1rem;
  font-weight: 750;
  line-height: 1.4;
`;

const lumineFixPathsClass = css`
  overflow-wrap: anywhere;
  color: ${Color.black()};
  font-family: 'Roboto Mono', monospace;
  font-size: 1.1rem;
  line-height: 1.4;
`;

const lumineFixControlsClass = css`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.6rem;
  margin-top: 0.1rem;
`;

const lumineModelLabelClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  color: ${Color.black()};
  font-size: 1.1rem;
  font-weight: 800;
  select {
    min-height: 2.4rem;
    min-width: min(100%, 18rem);
    border: 1px solid var(--ui-border);
    border-radius: 7px;
    background: #fff;
    padding: 0.3rem 0.55rem;
    color: ${Color.black()};
    font-size: 1.1rem;
  }
`;

const lumineReviewTitleClass = css`
  color: ${Color.black()};
  font-size: 1.2rem;
`;

const lumineReviewFileClass = css`
  width: 100%;
  border: 1px solid rgba(148, 163, 184, 0.4);
  border-radius: 7px;
  background: #fff;
  padding: 0.55rem;
  summary {
    cursor: pointer;
    color: ${Color.logoBlue()};
    font-family: 'Roboto Mono', monospace;
    font-size: 1.1rem;
    font-weight: 800;
  }
  span {
    display: block;
    margin-top: 0.65rem;
    color: ${Color.darkerGray()};
    font-size: 1.1rem;
    font-weight: 800;
  }
  pre {
    max-height: 18rem;
    overflow: auto;
    margin: 0.35rem 0 0;
    border-radius: 6px;
    background: #0f172a;
    padding: 0.65rem;
    color: #e2e8f0;
    font-size: 1.1rem;
    line-height: 1.35;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
`;
