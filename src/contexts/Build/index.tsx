import React, { useReducer, ReactNode } from 'react';
import { createContext } from 'use-context-selector';
import BuildActions from './actions';
import BuildReducer from './reducer';

export const BuildContext = createContext({});

export const initialBuildState = {
  fileStructure: [],
  fileContents: {},
  currentFile: null,
  compiledCode: '',
  chatMessages: [],
  currentFileContent: '',
  isLoaded: false
};

export function BuildContextProvider({ children }: { children: ReactNode }) {
  const [buildState, buildDispatch] = useReducer(
    BuildReducer,
    initialBuildState
  );

  return (
    <BuildContext.Provider
      value={{
        state: buildState,
        actions: BuildActions(buildDispatch)
      }}
    >
      {children}
    </BuildContext.Provider>
  );
}
