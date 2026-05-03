import React from 'react';
import {
  BuildAction,
  BuildLiveRunActionPayload,
  BuildRuntimeVerifyResultPayload,
  BuildWorkspaceCommunicationMode,
  BuildWorkspaceUiActionPayload,
  BuildStudioActionPayload,
  BuildStudioTab
} from './reducer';

export default function BuildActions(dispatch: React.Dispatch<BuildAction>) {
  return {
    onRegisterBuildRun(buildRun: BuildLiveRunActionPayload) {
      return dispatch({
        type: 'REGISTER_BUILD_RUN',
        buildRun
      });
    },
    onUpdateBuildRunStatus(buildRun: BuildLiveRunActionPayload) {
      return dispatch({
        type: 'UPDATE_BUILD_RUN_STATUS',
        buildRun
      });
    },
    onUpdateBuildRunStream(buildRun: BuildLiveRunActionPayload) {
      return dispatch({
        type: 'UPDATE_BUILD_RUN_STREAM',
        buildRun
      });
    },
    onApplyBuildRunRunningSnapshot(buildRun: BuildLiveRunActionPayload) {
      return dispatch({
        type: 'APPLY_BUILD_RUN_RUNNING_SNAPSHOT',
        buildRun
      });
    },
    onAppendBuildRunEvent(buildRun: BuildLiveRunActionPayload) {
      return dispatch({
        type: 'APPEND_BUILD_RUN_EVENT',
        buildRun
      });
    },
    onCompleteBuildRun(buildRun: BuildLiveRunActionPayload) {
      return dispatch({
        type: 'COMPLETE_BUILD_RUN',
        buildRun
      });
    },
    onFailBuildRun(buildRun: BuildLiveRunActionPayload) {
      return dispatch({
        type: 'FAIL_BUILD_RUN',
        buildRun
      });
    },
    onStopBuildRun(buildRun: BuildLiveRunActionPayload) {
      return dispatch({
        type: 'STOP_BUILD_RUN',
        buildRun
      });
    },
    onRemoveBuildRunMessage(buildRun: BuildLiveRunActionPayload) {
      return dispatch({
        type: 'REMOVE_BUILD_RUN_MESSAGE',
        buildRun
      });
    },
    onSetBuildWorkspace(buildRun: BuildLiveRunActionPayload) {
      return dispatch({
        type: 'SET_BUILD_WORKSPACE',
        buildRun
      });
    },
    onSetBuildWorkspaceCommunicationMode({
      buildId,
      communicationMode
    }: {
      buildId: number;
      communicationMode: BuildWorkspaceCommunicationMode;
    }) {
      return dispatch({
        type: 'SET_BUILD_WORKSPACE_COMMUNICATION_MODE',
        buildWorkspaceUi: { buildId, communicationMode }
      });
    },
    onSetBuildWorkspaceScroll(buildWorkspaceUi: BuildWorkspaceUiActionPayload) {
      return dispatch({
        type: 'SET_BUILD_WORKSPACE_SCROLL',
        buildWorkspaceUi
      });
    },
    onSetBuildWorkspaceForumThread({
      buildId,
      forumThreadId
    }: {
      buildId: number;
      forumThreadId: number;
    }) {
      return dispatch({
        type: 'SET_BUILD_WORKSPACE_FORUM_THREAD',
        buildWorkspaceUi: { buildId, forumThreadId }
      });
    },
    onSetBuildStudioActiveTab(activeTab: BuildStudioTab) {
      return dispatch({
        type: 'SET_BUILD_STUDIO_ACTIVE_TAB',
        buildStudio: { activeTab }
      });
    },
    onSetBuildStudioMyBuilds({
      builds,
      userId
    }: {
      builds: any[];
      userId?: number | null;
    }) {
      return dispatch({
        type: 'SET_BUILD_STUDIO_MY_BUILDS',
        buildStudio: { builds, userId }
      });
    },
    onPatchBuildStudioMyBuild({
      build,
      userId
    }: {
      build: any;
      userId?: number | null;
    }) {
      return dispatch({
        type: 'PATCH_BUILD_STUDIO_MY_BUILD',
        buildStudio: { build, userId }
      });
    },
    onRemoveBuildStudioMyBuild({
      buildId,
      userId
    }: {
      buildId: number;
      userId?: number | null;
    }) {
      return dispatch({
        type: 'REMOVE_BUILD_STUDIO_MY_BUILD',
        buildStudio: { buildId, userId }
      });
    },
    onSetBuildStudioBrowseBuilds(buildStudio: BuildStudioActionPayload) {
      return dispatch({
        type: 'SET_BUILD_STUDIO_BROWSE_BUILDS',
        buildStudio
      });
    },
    onAppendBuildStudioBrowseBuilds(buildStudio: BuildStudioActionPayload) {
      return dispatch({
        type: 'APPEND_BUILD_STUDIO_BROWSE_BUILDS',
        buildStudio
      });
    },
    onPublishBuildRuntimeVerifyResult(
      runtimeVerifyResult: BuildRuntimeVerifyResultPayload
    ) {
      return dispatch({
        type: 'PUBLISH_BUILD_RUNTIME_VERIFY_RESULT',
        runtimeVerifyResult
      });
    },
    onClearBuildRuntimeVerifyResult(
      runtimeVerifyResult: Pick<
        BuildRuntimeVerifyResultPayload,
        'buildId' | 'requestId'
      >
    ) {
      return dispatch({
        type: 'CLEAR_BUILD_RUNTIME_VERIFY_RESULT',
        runtimeVerifyResult
      });
    },
    onClearBuildRun(buildId: number) {
      return dispatch({
        type: 'CLEAR_BUILD_RUN',
        buildRun: { buildId }
      });
    },
    onResetBuildRuns() {
      return dispatch({
        type: 'RESET_BUILD_RUNS'
      });
    }
  };
}
