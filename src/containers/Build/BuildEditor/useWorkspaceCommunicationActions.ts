import type { NavigateFunction } from 'react-router-dom';
import type { ChatPanelCommunicationMode } from './ChatPanel/types';
import type { Build, BuildEditorRouteState } from './types';

interface UseWorkspaceCommunicationActionsOptions {
  applyBuildUpdate: (build: Build) => void;
  build: Build;
  canEditCurrentBuildMetadata: boolean;
  getLatestBuild: () => Build;
  locationPathname: string;
  navigate: NavigateFunction;
  onSetBuildWorkspaceCommunicationMode: (options: {
    buildId: number;
    communicationMode: ChatPanelCommunicationMode;
  }) => void;
  onSetBuildWorkspaceForumThread: (options: {
    buildId: number;
    forumThreadId: number;
  }) => void;
  onSetBuildWorkspaceScroll: (options: {
    buildId: number;
    scrollMode: ChatPanelCommunicationMode;
    scrollTop: number;
  }) => void;
  routeForumThreadId: number;
  routeState: BuildEditorRouteState;
  setCollaborationSettingsModalShown: (shown: boolean) => void;
}

export default function useWorkspaceCommunicationActions({
  applyBuildUpdate,
  build,
  canEditCurrentBuildMetadata,
  getLatestBuild,
  locationPathname,
  navigate,
  onSetBuildWorkspaceCommunicationMode,
  onSetBuildWorkspaceForumThread,
  onSetBuildWorkspaceScroll,
  routeForumThreadId,
  routeState,
  setCollaborationSettingsModalShown
}: UseWorkspaceCommunicationActionsOptions) {
  function handleBuildWorkspaceCommunicationModeChange(
    communicationMode: ChatPanelCommunicationMode
  ) {
    onSetBuildWorkspaceCommunicationMode({
      buildId: build.id,
      communicationMode
    });
  }

  function handleBuildWorkspaceCommunicationScrollChange(
    scrollMode: ChatPanelCommunicationMode,
    scrollTop: number
  ) {
    onSetBuildWorkspaceScroll({
      buildId: build.id,
      scrollMode,
      scrollTop
    });
  }

  function handleBuildWorkspaceForumThreadChange(threadId: number) {
    const normalizedThreadId = Math.max(0, Math.floor(Number(threadId || 0)));
    onSetBuildWorkspaceForumThread({
      buildId: build.id,
      forumThreadId: normalizedThreadId
    });
    if (routeForumThreadId > 0) {
      const nextRouteState = { ...routeState };
      delete nextRouteState.forumThreadId;
      navigate(locationPathname, {
        replace: true,
        state: Object.keys(nextRouteState).length > 0 ? nextRouteState : null
      });
    }
  }

  function handleBuildCollaborationPatch(patch: Record<string, any>) {
    const latestBuild = getLatestBuild();
    applyBuildUpdate({
      ...latestBuild,
      ...patch
    });
  }

  function handleOpenCollaborationSettingsModal() {
    if (!canEditCurrentBuildMetadata) return;
    setCollaborationSettingsModalShown(true);
  }

  function handleCloseCollaborationSettingsModal() {
    setCollaborationSettingsModalShown(false);
  }

  return {
    handleBuildCollaborationPatch,
    handleBuildWorkspaceCommunicationModeChange,
    handleBuildWorkspaceCommunicationScrollChange,
    handleBuildWorkspaceForumThreadChange,
    handleCloseCollaborationSettingsModal,
    handleOpenCollaborationSettingsModal
  };
}
