import React, {
  ReactNode,
  useEffect,
  useMemo,
  useReducer,
  useRef
} from 'react';
import { createContext, useContext } from '../selectableContext';
import BuildActions from './actions';
import BuildReducer, {
  BuildAction,
  BuildLiveRunState,
  BuildState,
  createInitialBuildStudioState
} from './reducer';
import {
  PROMPT_STUDIO_CLONE_CONFIRMED_EVENT,
  PROMPT_STUDIO_SHARE_STATE_UPDATED_EVENT,
  SYSTEM_PROMPT_TOPIC_UPDATED_EVENT
} from '~/constants/systemPrompt';

interface BuildRunIdentityState {
  requestId: string;
  generating: boolean;
  runMode: BuildLiveRunState['runMode'];
  userMessageId: number | null;
  assistantMessageId: number | null;
}

interface BuildCtx {
  state: BuildState;
  actions: ReturnType<typeof BuildActions>;
  dispatch: React.Dispatch<BuildAction>;
  getLatestBuildRun: (buildId: number) => BuildLiveRunState | null;
  getBuildRunIdentity: (buildId: number) => BuildRunIdentityState | null;
}

export const BuildContext = createContext<BuildCtx | undefined>(undefined);

const initialBuildState: BuildState = {
  buildsById: {},
  buildRuns: {},
  buildRunRequestMap: {},
  buildWorkspaces: {},
  buildWorkspaceUi: {},
  forumInvalidationVersions: {},
  runtimeVerifyResults: {},
  buildStudio: createInitialBuildStudioState()
};

function readBuildRunIdentity(
  state: BuildState,
  buildId: number
): BuildRunIdentityState | null {
  const normalizedBuildId = Number(buildId || 0);
  if (!normalizedBuildId) {
    return null;
  }
  const buildRun = state.buildRuns[String(normalizedBuildId)] || null;
  const requestId = String(buildRun?.requestId || '').trim();
  if (!requestId) {
    return null;
  }
  return {
    requestId,
    generating: Boolean(buildRun?.generating),
    runMode: buildRun?.runMode || 'user',
    userMessageId:
      Number(buildRun?.userMessage?.id || 0) > 0
        ? Number(buildRun?.userMessage?.id)
        : null,
    assistantMessageId:
      Number(buildRun?.assistantMessage?.id || 0) > 0
        ? Number(buildRun?.assistantMessage?.id)
        : null
  };
}

function readLatestBuildRun(
  state: BuildState,
  buildId: number
): BuildLiveRunState | null {
  const normalizedBuildId = Number(buildId || 0);
  if (!normalizedBuildId) {
    return null;
  }
  return state.buildRuns[String(normalizedBuildId)] || null;
}

export function BuildContextProvider({ children }: { children: ReactNode }) {
  const [buildState, buildDispatch] = useReducer(
    BuildReducer,
    initialBuildState
  );
  const latestBuildStateRef = useRef(initialBuildState);
  latestBuildStateRef.current = buildState;
  const actions = useMemo(() => BuildActions(buildDispatch), []);
  const getLatestBuildRun = useMemo(
    () => (buildId: number) =>
      readLatestBuildRun(latestBuildStateRef.current, buildId),
    []
  );
  const getBuildRunIdentity = useMemo(
    () => (buildId: number) =>
      readBuildRunIdentity(latestBuildStateRef.current, buildId),
    []
  );
  const value = useMemo(
    () => ({
      state: buildState,
      actions,
      dispatch: buildDispatch,
      getLatestBuildRun,
      getBuildRunIdentity
    }),
    // Context actions and getter helpers are stable for the provider lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [buildState]
  );

  useEffect(() => {
    function invalidatePromptStudio() {
      buildDispatch({
        type: 'INVALIDATE_PROMPT_STUDIO_TAB',
        buildStudio: { promptTab: 'my' }
      });
      buildDispatch({
        type: 'INVALIDATE_PROMPT_STUDIO_TAB',
        buildStudio: { promptTab: 'community' }
      });
    }

    function invalidatePromptStudioCommunity() {
      buildDispatch({
        type: 'INVALIDATE_PROMPT_STUDIO_TAB',
        buildStudio: { promptTab: 'community' }
      });
    }

    window.addEventListener(
      SYSTEM_PROMPT_TOPIC_UPDATED_EVENT,
      invalidatePromptStudio
    );
    window.addEventListener(
      PROMPT_STUDIO_SHARE_STATE_UPDATED_EVENT,
      invalidatePromptStudio
    );
    window.addEventListener(
      PROMPT_STUDIO_CLONE_CONFIRMED_EVENT,
      invalidatePromptStudioCommunity
    );
    return () => {
      window.removeEventListener(
        SYSTEM_PROMPT_TOPIC_UPDATED_EVENT,
        invalidatePromptStudio
      );
      window.removeEventListener(
        PROMPT_STUDIO_SHARE_STATE_UPDATED_EVENT,
        invalidatePromptStudio
      );
      window.removeEventListener(
        PROMPT_STUDIO_CLONE_CONFIRMED_EVENT,
        invalidatePromptStudioCommunity
      );
    };
  }, []);

  return (
    <BuildContext.Provider value={value}>{children}</BuildContext.Provider>
  );
}

export const useBuildContext = () => {
  const ctx = useContext(BuildContext);
  if (!ctx)
    throw new Error('useBuildContext must be used within BuildContextProvider');
  return ctx;
};
