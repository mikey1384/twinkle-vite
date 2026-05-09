import React from 'react';
import { css } from '@emotion/css';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import SegmentedToggle from '~/components/Buttons/SegmentedToggle';
import Icon from '~/components/Icon';
import { mobileMaxWidth } from '~/constants/css';
import type { WorkspaceViewMode } from './constants/workspaceView';

const displayFontFamily =
  "'Trebuchet MS', 'Comic Sans MS', 'Segoe UI', 'Arial Rounded MT Bold', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif";

const toolbarClass = css`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  min-height: var(--build-workspace-header-height);
  padding: 0 1rem;
  column-gap: 0.75rem;
  background: #fff;
  border-bottom: 1px solid var(--ui-border);
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
    row-gap: 0.65rem;
    padding: 0.9rem 1rem;
  }
`;

const toolbarTitleClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-weight: 900;
  color: var(--chat-text);
  font-size: 1.2rem;
  font-family: ${displayFontFamily};
`;

const toolbarActionsClass = css`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
`;

export default function WorkspaceToolbar({
  isOwner,
  viewMode,
  viewOptions,
  onOpenHistory,
  onViewModeChange
}: {
  isOwner: boolean;
  viewMode: WorkspaceViewMode;
  viewOptions: ReadonlyArray<{
    value: WorkspaceViewMode;
    label: string;
    icon: string;
  }>;
  onOpenHistory: () => void;
  onViewModeChange: (mode: WorkspaceViewMode) => void;
}) {
  return (
    <div className={toolbarClass}>
      <div className={toolbarTitleClass}>
        <Icon icon="laptop-code" />
        Workspace
      </div>
      <div className={toolbarActionsClass}>
        {isOwner ? (
          <GameCTAButton
            variant="purple"
            size="md"
            icon="clock"
            onClick={onOpenHistory}
          >
            History
          </GameCTAButton>
        ) : null}
        <SegmentedToggle<WorkspaceViewMode>
          value={viewMode}
          onChange={onViewModeChange}
          options={viewOptions}
          size="md"
          ariaLabel="Workspace mode"
        />
      </div>
    </div>
  );
}
