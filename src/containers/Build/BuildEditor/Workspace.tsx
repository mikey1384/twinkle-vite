import React, { RefObject, useEffect, useState } from 'react';
import { css } from '@emotion/css';
import SegmentedToggle from '~/components/Buttons/SegmentedToggle';
import { borderRadius, mobileMaxWidth } from '~/constants/css';
import PreviewPanel from '../PreviewPanel';
import type {
  PreviewPanelHandle,
  PreviewPanelProps
} from '../PreviewPanel/types';
import ChatPanel from './ChatPanel';
import type { ChatPanelProps } from './ChatPanel/types';
import {
  BUILD_WORKSPACE_RESIZE_HANDLE_WIDTH,
  DEFAULT_BUILD_CHAT_PANEL_WIDTH,
  MAX_BUILD_CHAT_PANEL_WIDTH,
  MIN_BUILD_CHAT_PANEL_WIDTH
} from './constants';

const panelShellClass = css`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  padding: 0.85rem 1.6rem 1.6rem;
  overflow: hidden;
  min-height: 0;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 0.75rem 1rem 1rem;
    grid-template-rows: auto 1fr;
    gap: 0.5rem;
  }
`;

const workspaceShellBase = css`
  --build-workspace-header-height: 4.5rem;
  display: grid;
  min-height: 0;
  overflow: hidden;
  border-radius: ${borderRadius};
  border: 1px solid var(--ui-border);
  background: #fff;
`;

const workspaceWithChatClass = css`
  ${workspaceShellBase};
  grid-template-columns:
    var(--build-chat-panel-width, ${DEFAULT_BUILD_CHAT_PANEL_WIDTH}px)
    ${BUILD_WORKSPACE_RESIZE_HANDLE_WIDTH}px minmax(0, 1fr);
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;
  }
`;

const workspaceResizeHandleClass = css`
  position: relative;
  width: 100%;
  min-width: ${BUILD_WORKSPACE_RESIZE_HANDLE_WIDTH}px;
  min-height: 0;
  border: none;
  border-left: 1px solid var(--ui-border);
  border-right: 1px solid var(--ui-border);
  background: #fff;
  cursor: col-resize;
  padding: 0;
  touch-action: none;
  transition:
    background-color 0.16s ease,
    border-color 0.16s ease;
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 3px;
    height: 2.7rem;
    border-radius: 999px;
    background: rgba(100, 116, 139, 0.35);
    transform: translate(-50%, -50%);
    transition: background-color 0.16s ease;
  }
  &:hover,
  &:focus-visible {
    background: rgba(59, 130, 246, 0.06);
    border-color: var(--theme-border);
    outline: none;
  }
  &:hover::before,
  &:focus-visible::before {
    background: var(--theme-border);
  }
  @media (max-width: ${mobileMaxWidth}) {
    display: none;
  }
`;

const mobileTabBarClass = css`
  display: none;
  @media (max-width: ${mobileMaxWidth}) {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0.5rem 1rem 0;
  }
`;

const workspaceNoChatClass = css`
  ${workspaceShellBase};
  grid-template-columns: 1fr;
`;

type MobilePanelTab = 'chat' | 'preview';

interface MobilePanelTabIntent {
  tab: MobilePanelTab;
  version: number;
}

interface WorkspaceProps {
  buildChatPanelWidth: number;
  buildWorkshopScale: number;
  chatPanelProps: Omit<ChatPanelProps, 'className' | 'workshopScale'>;
  communicationPanelShown: boolean;
  isDesktopWorkspaceLayout: boolean;
  mobilePanelTabIntent: MobilePanelTabIntent;
  onMobilePanelTabChange: (tab: MobilePanelTab) => void;
  onWorkspaceResizeKeyDown: (
    event: React.KeyboardEvent<HTMLButtonElement>
  ) => void;
  onWorkspaceResizePointerDown: (
    event: React.PointerEvent<HTMLButtonElement>
  ) => void;
  previewPanelProps: Omit<PreviewPanelProps, 'className'>;
  previewPanelRef: RefObject<PreviewPanelHandle | null>;
  workspaceShellRef: RefObject<HTMLDivElement | null>;
  workspaceShellStyle?: React.CSSProperties;
}

export default function Workspace({
  buildChatPanelWidth,
  buildWorkshopScale,
  chatPanelProps,
  communicationPanelShown,
  isDesktopWorkspaceLayout,
  mobilePanelTabIntent,
  onMobilePanelTabChange,
  onWorkspaceResizeKeyDown,
  onWorkspaceResizePointerDown,
  previewPanelProps,
  previewPanelRef,
  workspaceShellRef,
  workspaceShellStyle
}: WorkspaceProps) {
  const [mobilePanelTab, setMobilePanelTab] = useState<MobilePanelTab>(
    mobilePanelTabIntent.tab
  );
  const showChatPanel =
    communicationPanelShown &&
    (isDesktopWorkspaceLayout || mobilePanelTab === 'chat');
  const showPreviewPanel =
    !communicationPanelShown ||
    isDesktopWorkspaceLayout ||
    mobilePanelTab === 'preview';

  useEffect(() => {
    setMobilePanelTab(mobilePanelTabIntent.tab);
  }, [mobilePanelTabIntent.tab, mobilePanelTabIntent.version]);

  function handleMobilePanelTabChange(tab: MobilePanelTab) {
    setMobilePanelTab(tab);
    onMobilePanelTabChange(tab);
  }

  return (
    <div className={panelShellClass}>
      {communicationPanelShown ? (
        <div className={mobileTabBarClass}>
          <SegmentedToggle
            value={mobilePanelTab}
            options={[
              { value: 'chat' as const, label: 'Chat', icon: 'comments' },
              { value: 'preview' as const, label: 'Preview', icon: 'eye' }
            ]}
            onChange={handleMobilePanelTabChange}
            ariaLabel="Switch between chat and preview"
            size="sm"
          />
        </div>
      ) : null}
      <div
        ref={workspaceShellRef}
        className={
          communicationPanelShown ? workspaceWithChatClass : workspaceNoChatClass
        }
        style={workspaceShellStyle}
      >
        {showChatPanel ? (
          <ChatPanel
            {...chatPanelProps}
            workshopScale={buildWorkshopScale}
          />
        ) : null}
        {communicationPanelShown && isDesktopWorkspaceLayout ? (
          <button
            type="button"
            className={workspaceResizeHandleClass}
            onPointerDown={onWorkspaceResizePointerDown}
            onKeyDown={onWorkspaceResizeKeyDown}
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize Lumine chat and workspace"
            aria-valuemin={MIN_BUILD_CHAT_PANEL_WIDTH}
            aria-valuemax={MAX_BUILD_CHAT_PANEL_WIDTH}
            aria-valuenow={buildChatPanelWidth}
            title="Drag to resize Lumine and workspace"
          />
        ) : null}
        {showPreviewPanel ? (
          <PreviewPanel
            {...previewPanelProps}
            runtimeHostVisible={showPreviewPanel}
            ref={previewPanelRef}
          />
        ) : null}
      </div>
    </div>
  );
}
