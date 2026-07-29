import React, { useMemo, useState } from 'react';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import Icon from '~/components/Icon';
import BuildMessageCard, { BuildMessageCardChip } from './BuildMessageCard';
import { Color } from '~/constants/css';
import { timeSince } from '~/helpers/timeStampHelpers';
import { useAppContext, useChatContext } from '~/contexts';
import { isCachedCardStateFresher } from '~/helpers/buildCardState';

type BuildContributionSubmissionStatus =
  | 'open'
  | 'merging'
  | 'merged'
  | 'gone';

type ChangedFileStatus = 'added' | 'updated' | 'deleted';

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
  const onUpdateBuildContributionSubmissionState = useChatContext(
    (v) => v.actions.onUpdateBuildContributionSubmissionState
  );
  const [detailsShown, setDetailsShown] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [actionError, setActionError] = useState('');
  const [confirmingReplace, setConfirmingReplace] = useState(false);

  const rootBuildId = Number(submission?.rootBuildId || 0);
  const branchBuildId = Number(submission?.branchBuildId || 0);
  const cachedState = useChatContext((v) =>
    branchBuildId > 0
      ? v.state.buildContributionSubmissionByBranchId?.[branchBuildId]
      : null
  );
  // Only when it is actually newer than what the server hydrated. The cache is
  // keyed by branch, and a branch outlives any one submission: merge an earlier
  // card, then the contributor saves again and sends a new one, and without this
  // the fresh 'open' card inherits the old 'merged' entry and hides the very
  // actions the owner was messaged about.
  const payload = useMemo(
    () =>
      isCachedCardStateFresher(cachedState, submission)
        ? { ...(submission || {}), ...(cachedState || {}) }
        : { ...(submission || {}) },
    [submission, cachedState]
  );
  const title = String(payload?.title || 'their project');
  const branchLabel = String(payload?.branchLabel || 'their branch');
  const changedFiles: Array<{ path?: string; status?: ChangedFileStatus }> =
    Array.isArray(payload?.changedFiles) ? payload.changedFiles : [];
  const diffSummary = payload?.diffSummary || {};
  const status: BuildContributionSubmissionStatus =
    (payload?.status as BuildContributionSubmissionStatus) || 'open';
  const sentByMe = Number(sender.id) === Number(myId);
  const isOwner = Number(payload?.ownerUserId || 0) === Number(myId);
  const note = String(content || '').trim();

  if (!rootBuildId || !branchBuildId) {
    return <span>{content}</span>;
  }

  return (
    <BuildMessageCard
      themeName={sender.profileTheme}
      bannerText={
        <>
          {sentByMe ? 'You' : sender.username} made updates to{' '}
          {isOwner ? 'your project' : 'this project'}
        </>
      }
      title={title}
      chips={
        <>
          <BuildMessageCardChip icon="code-branch" themeName={sender.profileTheme}>
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
          {/* Only 'open' offers Merge and Replace Main. A branch mid-merge is
              rejected by both endpoints — merge wants a draft, replace wants a
              draft or a merged branch — so rendering them there is offering the
              owner two buttons that can only fail. Conflict resolution lives in
              the workspace, so that is where the card points instead. */}
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
          {isOwner && status === 'open' ? (
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
        </>
      }
    >
      {note ? <div className={noteClass}>{note}</div> : null}

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

      {status === 'merged' ? (
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
    // The branch-number URL is what the editor routes on, but a payload written
    // before the branch had a number would build `/branches/` and land nowhere.
    const branchNumber = Math.floor(Number(payload?.branchNumber) || 0);
    navigate(
      branchNumber > 0
        ? `/build/${rootBuildId}/branches/${branchNumber}`
        : `/build/${branchBuildId}`
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
      const conflictCount = Array.isArray(result.conflicts)
        ? result.conflicts.length
        : 0;
      if (result.mergeConflictsWritten || conflictCount > 0) {
        // Conflict resolution lives in the workspace and only there. Saying so
        // beats a chat card pretending it can finish the job.
        setActionError(
          'Merged with conflicts that need to be resolved in the project.'
        );
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

  // The server's returned branch row is the only thing allowed to move the card
  // out of 'open'; nothing here guesses a status from the fact that a request
  // came back without throwing.
  function applyCanonicalSubmissionState(result: any) {
    const contribution = result?.contribution || null;
    if (!contribution) return;
    onUpdateBuildContributionSubmissionState({
      branchBuildId,
      contribution,
      eventTimeMs: Number(result?.eventTimeMs || Date.now())
    });
  }

  function handleActionError(error: any, fallbackMessage: string) {
    const responseData = error?.response?.data || {};
    const code = String(responseData?.code || '');
    if (code === 'build_contribution_root_drifted') {
      setActionError(
        'Main moved on since this branch was made. Open the project to update and merge it.'
      );
      handleOpenMergePanel();
      return;
    }
    setActionError(
      responseData?.error || error?.message || fallbackMessage
    );
  }
}

// The sender's half of the card: did the owner actually look at the work, as
// opposed to the message being delivered. Hash-based, so updating from Main
// does not read as "they looked again".
function renderOwnerLookSignal(payload: BuildContributionSubmissionPayload) {
  const ownerLastOpenedBranchAt = Number(
    payload?.ownerLastOpenedBranchAt || 0
  );
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
