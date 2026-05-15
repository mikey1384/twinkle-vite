import React from 'react';
import { css } from '@emotion/css';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import RuntimeAssetTransferProgressBar from '../RuntimeAssetTransferProgressBar';
import type { RuntimeAssetTransferProgressPayload } from '../helpers/runtimeAssetTransferProgress';
import type {
  BuildContributionFileDiff,
  BuildContributionStatus
} from './types';

const detailClass = css`
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  background: #fff;
  padding: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;

const rowClass = css`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  flex-wrap: wrap;
`;

const mutedTextClass = css`
  color: var(--chat-text);
  opacity: 0.68;
  font-size: 1.1rem;
  font-weight: 700;
`;

const statusPillClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border: 1px solid rgba(65, 140, 235, 0.28);
  border-radius: 999px;
  background: rgba(65, 140, 235, 0.1);
  color: #1d4ed8;
  padding: 0.35rem 0.7rem;
  font-weight: 900;
  font-size: 1.1rem;
`;

const fileListClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  max-height: 16rem;
  overflow: auto;
`;

const fileRowClass = css`
  display: grid;
  grid-template-columns: auto 5rem minmax(0, 1fr);
  align-items: center;
  gap: 0.55rem;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 8px;
  padding: 0.45rem 0.55rem;
  font-size: 1.1rem;
`;

const filePathClass = css`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
`;

const filePathButtonClass = css`
  border: 0;
  background: transparent;
  color: inherit;
  padding: 0;
  text-align: left;
  min-width: 0;
  cursor: pointer;
`;

const diffPreviewClass = css`
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.6rem;
`;

const codePreviewClass = css`
  min-height: 6rem;
  max-height: 14rem;
  overflow: auto;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 8px;
  background: #0f172a;
  color: #e2e8f0;
  padding: 0.7rem;
  font-size: 1.1rem;
  white-space: pre-wrap;
  word-break: break-word;
`;

const conflictBadgeClass = css`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.18rem 0.48rem;
  background: rgba(244, 63, 94, 0.12);
  color: #be123c;
  font-size: 1.1rem;
  font-weight: 900;
`;

const errorClass = css`
  color: #be123c;
  font-weight: 800;
  font-size: 1.1rem;
`;

function formatContributionStatusLabel(status: BuildContributionStatus) {
  if (status === 'merging') return 'conflicts';
  return status;
}

export default function ContributionDetail({
  activeConflictMarkerPaths,
  activeContributionId,
  actionError,
  actionLoading,
  canAskLumineToResolveConflicts,
  canCompleteConflictMerge,
  canUpdateFromMain,
  changedFiles,
  contributionCanMerge,
  contributionCanReplaceMain,
  contributionStatus,
  ownerReview,
  runtimeAssetTransferProgress,
  selectedPaths,
  selectedPreviewFile,
  onAskLumineToResolveConflicts,
  onCompleteContributionMerge,
  onMergeContribution,
  onPreviewContribution,
  onPreviewPathChange,
  onReplaceMain,
  onToggleSelectedPath,
  onUpdateVersionFromMain
}: {
  activeConflictMarkerPaths: string[];
  activeContributionId: number;
  actionError: string;
  actionLoading: string;
  canAskLumineToResolveConflicts: boolean;
  canCompleteConflictMerge: boolean;
  canUpdateFromMain: boolean;
  changedFiles: BuildContributionFileDiff[];
  contributionCanMerge: boolean;
  contributionCanReplaceMain: boolean;
  contributionStatus: BuildContributionStatus;
  ownerReview: boolean;
  runtimeAssetTransferProgress?: RuntimeAssetTransferProgressPayload | null;
  selectedPaths: string[];
  selectedPreviewFile: BuildContributionFileDiff | null;
  onAskLumineToResolveConflicts: () => void;
  onCompleteContributionMerge: () => void;
  onMergeContribution: () => void;
  onPreviewContribution: (contributionId: number) => void;
  onPreviewPathChange: (path: string) => void;
  onReplaceMain: () => void;
  onToggleSelectedPath: (path: string) => void;
  onUpdateVersionFromMain: () => void;
}) {
  const hasActiveConflictMarkers = activeConflictMarkerPaths.length > 0;
  const ownerConflictRepairShown =
    ownerReview && (hasActiveConflictMarkers || canCompleteConflictMerge);

  return (
    <div className={detailClass}>
      <div className={rowClass}>
        <strong>
          {ownerReview ? 'Review branch' : 'Branch needs attention'}
        </strong>
        {ownerReview ? (
          <span className={mutedTextClass}>{changedFiles.length} changed</span>
        ) : canUpdateFromMain ? (
          <span className={mutedTextClass}>
            Main has new changes for this branch.
          </span>
        ) : null}
        {contributionStatus !== 'draft' ? (
          <span className={statusPillClass}>
            {formatContributionStatusLabel(contributionStatus)}
          </span>
        ) : null}
        {ownerReview ? (
          <GameCTAButton
            variant="neutral"
            size="sm"
            icon="eye"
            onClick={() => onPreviewContribution(activeContributionId)}
          >
            Preview
          </GameCTAButton>
        ) : null}
      </div>
      {ownerReview ? (
        <ChangedFiles
          changedFiles={changedFiles}
          contributionCanMerge={contributionCanMerge}
          selectedPaths={selectedPaths}
          selectedPreviewFile={selectedPreviewFile}
          onPreviewPathChange={onPreviewPathChange}
          onToggleSelectedPath={onToggleSelectedPath}
        />
      ) : null}
      {canUpdateFromMain ? (
        <div className={rowClass}>
          <GameCTAButton
            variant="neutral"
            size="sm"
            icon="redo"
            loading={actionLoading === 'update-from-main'}
            disabled={Boolean(actionLoading)}
            onClick={onUpdateVersionFromMain}
          >
            Update from Main
          </GameCTAButton>
        </div>
      ) : null}
      {!ownerReview &&
      contributionStatus === 'draft' &&
      canAskLumineToResolveConflicts &&
      activeConflictMarkerPaths.length > 0 ? (
        <div className={rowClass}>
          <GameCTAButton
            variant="purple"
            size="sm"
            icon="wand-magic-sparkles"
            loading={actionLoading === 'ask-lumine-conflicts'}
            disabled={Boolean(actionLoading)}
            onClick={onAskLumineToResolveConflicts}
          >
            Fix with Lumine
          </GameCTAButton>
        </div>
      ) : null}
      {ownerReview && (contributionCanMerge || contributionCanReplaceMain) ? (
        <div className={rowClass}>
          {contributionCanMerge ? (
            <GameCTAButton
              variant="success"
              size="sm"
              icon="check"
              loading={actionLoading === 'merge'}
              disabled={Boolean(actionLoading) || selectedPaths.length === 0}
              onClick={onMergeContribution}
            >
              Merge Branch
            </GameCTAButton>
          ) : null}
          {contributionCanReplaceMain ? (
            <GameCTAButton
              variant="orange"
              size="sm"
              icon="copy"
              loading={actionLoading === 'replace-main'}
              disabled={Boolean(actionLoading)}
              onClick={onReplaceMain}
            >
              Replace Main
            </GameCTAButton>
          ) : null}
        </div>
      ) : null}
      {ownerConflictRepairShown ? (
        <div className={rowClass}>
          <span className={mutedTextClass}>
            {hasActiveConflictMarkers
              ? 'Main project files have conflict markers. Let Lumine fix them or edit the files.'
              : 'Conflict markers are resolved. Complete the legacy merge record.'}
          </span>
          {canAskLumineToResolveConflicts && hasActiveConflictMarkers ? (
            <GameCTAButton
              variant="purple"
              size="sm"
              icon="wand-magic-sparkles"
              loading={actionLoading === 'ask-lumine-conflicts'}
              disabled={Boolean(actionLoading)}
              onClick={onAskLumineToResolveConflicts}
            >
              Fix with Lumine
            </GameCTAButton>
          ) : null}
          {canCompleteConflictMerge ? (
            <GameCTAButton
              variant="success"
              size="sm"
              icon="check"
              loading={actionLoading === 'complete-merge'}
              disabled={Boolean(actionLoading)}
              onClick={onCompleteContributionMerge}
            >
              Complete Merge
            </GameCTAButton>
          ) : null}
        </div>
      ) : null}
      {runtimeAssetTransferProgress ? (
        <RuntimeAssetTransferProgressBar
          progress={runtimeAssetTransferProgress}
        />
      ) : null}
      {actionError ? <span className={errorClass}>{actionError}</span> : null}
    </div>
  );
}

function ChangedFiles({
  changedFiles,
  contributionCanMerge,
  selectedPaths,
  selectedPreviewFile,
  onPreviewPathChange,
  onToggleSelectedPath
}: {
  changedFiles: BuildContributionFileDiff[];
  contributionCanMerge: boolean;
  selectedPaths: string[];
  selectedPreviewFile: BuildContributionFileDiff | null;
  onPreviewPathChange: (path: string) => void;
  onToggleSelectedPath: (path: string) => void;
}) {
  if (changedFiles.length === 0) {
    return <span className={mutedTextClass}>No file changes loaded.</span>;
  }
  return (
    <>
      <div className={fileListClass}>
        {changedFiles.map((file) => (
          <label key={file.path} className={fileRowClass}>
            <input
              type="checkbox"
              checked={selectedPaths.includes(file.path)}
              disabled={!contributionCanMerge}
              onChange={() => onToggleSelectedPath(file.path)}
            />
            <strong>{file.status}</strong>
            <button
              type="button"
              className={filePathButtonClass}
              onClick={() => onPreviewPathChange(file.path)}
            >
              <span className={filePathClass}>{file.path}</span>
            </button>
            {file.mergeStatus === 'conflict' ? (
              <span className={conflictBadgeClass}>conflict</span>
            ) : null}
          </label>
        ))}
      </div>
      {selectedPreviewFile ? (
        <div className={diffPreviewClass}>
          <pre className={codePreviewClass}>
            {selectedPreviewFile.currentContent ?? ''}
          </pre>
          <pre className={codePreviewClass}>
            {selectedPreviewFile.contributionContent ?? ''}
          </pre>
        </div>
      ) : null}
    </>
  );
}
