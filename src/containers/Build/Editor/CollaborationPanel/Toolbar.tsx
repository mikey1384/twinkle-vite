import React from 'react';
import { css } from '@emotion/css';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import Icon from '~/components/Icon';
import type {
  BuildCollaborationMode,
  BuildContributionStatus
} from './types';

const toolbarClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const toolbarPrimaryClass = css`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-wrap: wrap;
  min-width: 0;
`;

const toolbarActionsClass = css`
  display: flex;
  align-items: center;
  gap: 0.55rem;
  flex-wrap: wrap;
  margin-left: auto;
`;

const labelClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
  font-weight: 900;
  color: var(--chat-text);
  font-size: 1.1rem;
`;

const selectClass = css`
  height: 2.25rem;
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  background: #fff;
  color: var(--chat-text);
  padding: 0 0.65rem;
  font-weight: 800;
  max-width: 100%;
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

const summaryPillClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border: 1px solid rgba(148, 163, 184, 0.34);
  border-radius: 999px;
  background: rgba(248, 250, 252, 0.9);
  color: var(--chat-text);
  padding: 0.35rem 0.7rem;
  font-weight: 900;
  font-size: 1.1rem;
  white-space: nowrap;
`;

const errorClass = css`
  color: #be123c;
  font-weight: 800;
  font-size: 1.1rem;
`;

function normalizeContributionStatus(value: unknown): BuildContributionStatus {
  const normalized = String(value || '').trim();
  if (
    normalized === 'draft' ||
    normalized === 'merging' ||
    normalized === 'merged'
  ) {
    return normalized;
  }
  return 'none';
}

export default function Toolbar({
  collaborationMode,
  contributionStatus,
  embedded,
  forumThreadCount,
  isContributionFork,
  isOwner,
  panelExpanded,
  reviewContributionCount,
  savingSettings,
  settingsError,
  onCollaborationModeChange,
  onSaveSettings,
  onToggleExpanded
}: {
  collaborationMode: BuildCollaborationMode;
  contributionStatus?: BuildContributionStatus;
  embedded: boolean;
  forumThreadCount: number;
  isContributionFork: boolean;
  isOwner: boolean;
  panelExpanded: boolean;
  reviewContributionCount: number;
  savingSettings: boolean;
  settingsError: string;
  onCollaborationModeChange: (mode: BuildCollaborationMode) => void;
  onSaveSettings: () => void;
  onToggleExpanded: () => void;
}) {
  const normalizedContributionStatus =
    normalizeContributionStatus(contributionStatus);
  return (
    <div className={toolbarClass}>
      <div className={toolbarPrimaryClass}>
        {embedded ? (
          <span className={statusPillClass}>
            <Icon icon="comments" />
            Team
          </span>
        ) : isOwner && !isContributionFork ? (
          <>
            <span className={statusPillClass}>
              <Icon icon="code-branch" />
              Team
            </span>
            <label className={labelClass}>
              Mode
              <select
                className={selectClass}
                value={collaborationMode}
                onChange={(event) =>
                  onCollaborationModeChange(
                    event.target.value === 'open_source'
                      ? 'open_source'
                      : 'private'
                  )
                }
              >
                <option value="private">Private Project</option>
                <option value="open_source">Open source</option>
              </select>
            </label>
            <GameCTAButton
              variant="logoBlue"
              size="sm"
              icon="save"
              loading={savingSettings}
              disabled={savingSettings}
              onClick={onSaveSettings}
            >
              Save
            </GameCTAButton>
            {settingsError ? (
              <span className={errorClass}>{settingsError}</span>
            ) : null}
          </>
        ) : (
          <span className={statusPillClass}>
            <Icon icon="code-branch" />
            {normalizedContributionStatus === 'draft'
              ? 'Branch'
              : `Branch ${normalizedContributionStatus}`}
          </span>
        )}
        <span className={summaryPillClass}>
          <Icon icon="comment" />
          {forumThreadCount}
        </span>
        {!embedded && isOwner && !isContributionFork ? (
          <span className={summaryPillClass}>
            <Icon icon="code-branch" />
            {reviewContributionCount}
          </span>
        ) : null}
      </div>
      {!embedded ? (
        <div className={toolbarActionsClass}>
          <GameCTAButton
            variant="neutral"
            size="sm"
            icon={panelExpanded ? 'chevron-up' : 'comment'}
            onClick={onToggleExpanded}
          >
            {panelExpanded ? 'Hide' : 'Discuss'}
          </GameCTAButton>
        </div>
      ) : null}
    </div>
  );
}
