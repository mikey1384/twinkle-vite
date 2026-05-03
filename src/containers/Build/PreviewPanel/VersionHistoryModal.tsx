import React from 'react';
import { css } from '@emotion/css';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import Icon from '~/components/Icon';
import Modal from '~/components/Modal';
import { timeSince } from '~/helpers/timeStampHelpers';
import type { ArtifactVersion } from './types';

interface VersionHistoryModalProps {
  isOpen: boolean;
  loadingVersions: boolean;
  versions: ArtifactVersion[];
  restoringVersionId: number | null;
  onClose: () => void;
  onRestoreVersion: (versionId: number) => void;
}

const versionRowClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 0.9rem;
  border-radius: 12px;
  background: #fff;
  border: 1px solid var(--ui-border);
`;

const versionMetaClass = css`
  font-size: 0.8rem;
  color: var(--chat-text);
  opacity: 0.6;
  margin-top: 0.2rem;
`;

const historyModalShellClass = css`
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const historyModalHeaderClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--ui-border);
  background: #fff;
`;

const historyModalTitleClass = css`
  font-weight: 700;
  color: var(--chat-text);
  font-size: 1.1rem;
`;

const historyModalCloseButtonClass = css`
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid var(--ui-border);
  background: #fff;
  color: var(--chat-text);
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
  &:hover {
    background: var(--chat-bg);
    border-color: var(--theme-border);
  }
  &:focus-visible {
    outline: 2px solid var(--theme-border);
    outline-offset: 2px;
  }
`;

const historyModalContentClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem 1.25rem 1.25rem;
`;

const centeredStateClass = css`
  padding: 1rem;
  text-align: center;
  color: var(--chat-text);
  opacity: 0.7;
`;

const versionSummaryClass = css`
  font-size: 0.9rem;
  color: var(--chat-text);
  opacity: 0.75;
`;

const versionTitleClass = css`
  font-weight: 700;
  color: var(--chat-text);
`;

export default function VersionHistoryModal({
  isOpen,
  loadingVersions,
  versions,
  restoringVersionId,
  onClose,
  onRestoreVersion
}: VersionHistoryModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      modalKey="BuildVersionHistory"
      hasHeader={false}
      showCloseButton={false}
      bodyPadding={0}
      aria-label="Version history"
      style={{
        backgroundColor: '#fff',
        boxShadow: 'none',
        border: '1px solid var(--ui-border)'
      }}
    >
      <div className={historyModalShellClass}>
        <div className={historyModalHeaderClass}>
          <div className={historyModalTitleClass}>Version History</div>
          <button
            className={historyModalCloseButtonClass}
            onClick={onClose}
            type="button"
            aria-label="Close version history"
          >
            <Icon icon="times" />
          </button>
        </div>
        <div className={historyModalContentClass}>
          {loadingVersions ? (
            <div className={centeredStateClass}>Loading versions...</div>
          ) : versions.length === 0 ? (
            <div className={centeredStateClass}>
              No versions yet. Lumine runs, saved file changes, and branch
              merges will create version history.
            </div>
          ) : (
            versions.map((version) => (
              <div key={version.id} className={versionRowClass}>
                <div>
                  <div className={versionTitleClass}>v{version.version}</div>
                  {version.summary ? (
                    <div className={versionSummaryClass}>{version.summary}</div>
                  ) : null}
                  <div className={versionMetaClass}>
                    {timeSince(version.createdAt)} ·{' '}
                    {version.createdByRole === 'assistant' ? 'AI' : 'You'}
                    {version.gitCommitSha
                      ? ` · ${String(version.gitCommitSha).slice(0, 7)}`
                      : ''}
                  </div>
                </div>
                <GameCTAButton
                  variant="orange"
                  size="sm"
                  onClick={() => onRestoreVersion(version.id)}
                  disabled={restoringVersionId === version.id}
                  loading={restoringVersionId === version.id}
                >
                  {restoringVersionId === version.id
                    ? 'Restoring...'
                    : 'Restore'}
                </GameCTAButton>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
