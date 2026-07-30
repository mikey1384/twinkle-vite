import React, { RefObject, useEffect, useState } from 'react';
import { css } from '@emotion/css';
import SegmentedToggle from '~/components/Buttons/SegmentedToggle';
import { borderRadius } from '~/constants/css';
import MainProjectButton from './MainProjectButton';
import PreviewPanel from '../PreviewPanel';
import type {
  PreviewPanelHandle,
  PreviewPanelProps
} from '../PreviewPanel/types';
import ChatPanel from './ChatPanel';
import type {
  ChatPanelCommunicationMode,
  ChatPanelProps
} from './ChatPanel/types';
import {
  BUILD_WORKSPACE_COMPACT_LANDSCAPE_MEDIA_QUERY,
  BUILD_WORKSPACE_COMPACT_MEDIA_QUERY,
  BUILD_WORKSPACE_RESIZE_HANDLE_WIDTH,
  DEFAULT_BUILD_CHAT_PANEL_WIDTH,
  MAX_BUILD_CHAT_PANEL_WIDTH,
  MIN_BUILD_CHAT_PANEL_WIDTH
} from './constants';
import type { MobilePanelTab, MobilePanelTabIntent } from './types';

const panelShellClass = css`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  padding: 0.85rem 1.6rem 1.6rem;
  overflow: hidden;
  min-height: 0;
  @media ${BUILD_WORKSPACE_COMPACT_MEDIA_QUERY} {
    padding: 0.75rem 1rem 1rem;
    grid-template-rows: auto 1fr;
    gap: 0.5rem;
  }
  @media ${BUILD_WORKSPACE_COMPACT_LANDSCAPE_MEDIA_QUERY} {
    gap: 0.25rem;
    padding: 0.35rem 0.6rem 0.45rem;
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
  @media ${BUILD_WORKSPACE_COMPACT_LANDSCAPE_MEDIA_QUERY} {
    --build-workspace-header-height: 3.6rem;
  }
`;

const workspaceWithChatClass = css`
  ${workspaceShellBase};
  grid-template-columns:
    var(--build-chat-panel-width, ${DEFAULT_BUILD_CHAT_PANEL_WIDTH}px)
    ${BUILD_WORKSPACE_RESIZE_HANDLE_WIDTH}px minmax(0, 1fr);
  @media ${BUILD_WORKSPACE_COMPACT_MEDIA_QUERY} {
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
  @media ${BUILD_WORKSPACE_COMPACT_MEDIA_QUERY} {
    display: none;
  }
`;

const mobileTabBarClass = css`
  display: none;
  @media ${BUILD_WORKSPACE_COMPACT_MEDIA_QUERY} {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0.5rem 1rem 0;
    overflow-x: auto;
  }
  @media ${BUILD_WORKSPACE_COMPACT_LANDSCAPE_MEDIA_QUERY} {
    padding: 0.25rem 0.6rem 0;
  }
`;

const tabBarWithMainClass = css`
  display: none;
  @media ${BUILD_WORKSPACE_COMPACT_MEDIA_QUERY} {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 1rem 0;
  }
  @media ${BUILD_WORKSPACE_COMPACT_LANDSCAPE_MEDIA_QUERY} {
    gap: 0.45rem;
    padding: 0.25rem 0.6rem 0;
  }
`;

const tabsSlotClass = css`
  justify-self: center;
  min-width: 0;
  max-width: 100%;
  overflow-x: auto;
`;

const workspaceNoChatClass = css`
  ${workspaceShellBase};
  grid-template-columns: 1fr;
`;

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
  showMainProjectNavigation?: boolean;
  onOpenMainProject?: () => void;
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
  showMainProjectNavigation,
  onOpenMainProject,
  previewPanelProps,
  previewPanelRef,
  workspaceShellRef,
  workspaceShellStyle
}: WorkspaceProps) {
  const [mobilePanelTab, setMobilePanelTab] = useState<MobilePanelTab>(
    mobilePanelTabIntent.tab
  );
  const mainProjectNavigationShown =
    Boolean(showMainProjectNavigation) && Boolean(onOpenMainProject);
  const mobilePanelOptions = getMobilePanelOptions({
    communicationPanelShown,
    chatPanelProps
  });
  const activeMobilePanelTab = mobilePanelOptions.some(
    (option) => option.value === mobilePanelTab
  )
    ? mobilePanelTab
    : mobilePanelOptions[0]?.value || 'preview';
  const showChatPanel =
    communicationPanelShown &&
    (isDesktopWorkspaceLayout ||
      mobilePanelTabIsCommunication(activeMobilePanelTab));
  const showPreviewPanel =
    !communicationPanelShown ||
    isDesktopWorkspaceLayout ||
    activeMobilePanelTab === 'preview';

  useEffect(() => {
    setMobilePanelTab(mobilePanelTabIntent.tab);
  }, [mobilePanelTabIntent.tab, mobilePanelTabIntent.version]);

  function handleMobilePanelTabChange(tab: MobilePanelTab) {
    setMobilePanelTab(tab);
    onMobilePanelTabChange(tab);
  }

  const panelToggle = communicationPanelShown ? (
    <SegmentedToggle
      value={activeMobilePanelTab}
      options={mobilePanelOptions}
      onChange={handleMobilePanelTabChange}
      ariaLabel="Switch build workspace panel"
      size="sm"
    />
  ) : null;

  return (
    <div className={panelShellClass}>
      {mainProjectNavigationShown ? (
        <div className={tabBarWithMainClass}>
          <MainProjectButton onClick={onOpenMainProject} />
          {panelToggle ? (
            <div className={tabsSlotClass}>{panelToggle}</div>
          ) : null}
        </div>
      ) : panelToggle ? (
        <div className={mobileTabBarClass}>{panelToggle}</div>
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

function getMobilePanelOptions({
  communicationPanelShown,
  chatPanelProps
}: {
  communicationPanelShown: boolean;
  chatPanelProps: Omit<ChatPanelProps, 'className' | 'workshopScale'>;
}): Array<{
  value: MobilePanelTab;
  label: string;
  icon: string;
}> {
  if (!communicationPanelShown) {
    return [];
  }
  const options: Array<{
    value: MobilePanelTab;
    label: string;
    icon: string;
  }> = [];
  if (chatPanelProps.luminePanelOverride) {
    options.push({
      value: 'versions',
      label: chatPanelProps.lumineTabLabel || 'Branches',
      icon: chatPanelProps.lumineTabIcon || 'code-branch'
    });
  } else {
    options.push({
      value: 'lumine',
      label: chatPanelProps.lumineTabLabel || 'Lumine',
      icon: chatPanelProps.lumineTabIcon || 'sparkles'
    });
  }
  options.push({ value: 'preview', label: 'Workspace', icon: 'eye' });
  if (!chatPanelProps.luminePanelOverride && chatPanelProps.versionsPanel) {
    options.push({ value: 'versions', label: 'Branches', icon: 'code-branch' });
  }
  if (chatPanelProps.peoplePanel) {
    options.push({ value: 'people', label: 'Team', icon: 'comments' });
  }
  return options;
}

function mobilePanelTabIsCommunication(
  tab: MobilePanelTab
): tab is ChatPanelCommunicationMode {
  return tab === 'lumine' || tab === 'versions' || tab === 'people';
}
