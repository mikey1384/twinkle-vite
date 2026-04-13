import React from 'react';
import {
  BuildAction,
  BuildLiveRunActionPayload,
  BuildRuntimeVerifyResultPayload
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
