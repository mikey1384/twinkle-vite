import React, { ReactNode, useMemo, useReducer } from 'react';
import { createContext, useContext } from 'use-context-selector';
import BuildActions from './actions';
import BuildReducer, { BuildAction, BuildState } from './reducer';

interface BuildCtx {
  state: BuildState;
  actions: ReturnType<typeof BuildActions>;
  dispatch: React.Dispatch<BuildAction>;
}

export const BuildContext = createContext<BuildCtx | undefined>(undefined);

const initialBuildState: BuildState = {
  buildRuns: {},
  buildRunRequestMap: {},
  buildWorkspaces: {}
};

export function BuildContextProvider({ children }: { children: ReactNode }) {
  const [buildState, buildDispatch] = useReducer(BuildReducer, initialBuildState);
  const actions = useMemo(() => BuildActions(buildDispatch), []);
  const value = useMemo(
    () => ({ state: buildState, actions, dispatch: buildDispatch }),
    [buildState, actions]
  );

  return <BuildContext.Provider value={value}>{children}</BuildContext.Provider>;
}

export const useBuildContext = () => {
  const ctx = useContext(BuildContext);
  if (!ctx)
    throw new Error('useBuildContext must be used within BuildContextProvider');
  return ctx;
};
