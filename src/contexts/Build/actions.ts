import React from 'react';
import { BuildAction, BuildLiveRunActionPayload } from './reducer';

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
    onAppendBuildRunEvent(buildRun: BuildLiveRunActionPayload) {
      return dispatch({
        type: 'APPEND_BUILD_RUN_EVENT',
        buildRun
      });
    },
    onUpdateBuildRunUsage(buildRun: BuildLiveRunActionPayload) {
      return dispatch({
        type: 'UPDATE_BUILD_RUN_USAGE',
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
    onSetBuildWorkspace(buildRun: BuildLiveRunActionPayload) {
      return dispatch({
        type: 'SET_BUILD_WORKSPACE',
        buildRun
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
