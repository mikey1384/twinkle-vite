import React, { useReducer, ReactNode, useMemo } from 'react';
import { createContext } from 'use-context-selector';
import ContentActions from './actions';
import ContentReducer from './reducer';

export const ContentContext = createContext({});
export const initialContentState = {};

export function ContentContextProvider({ children }: { children: ReactNode }) {
  const [contentState, contentDispatch] = useReducer(
    ContentReducer,
    initialContentState
  );
  const memoizedActions = useMemo(
    () => ContentActions(contentDispatch),
    [contentDispatch]
  );

  return (
    <ContentContext.Provider
      value={{
        state: contentState,
        actions: memoizedActions
      }}
    >
      {children}
    </ContentContext.Provider>
  );
}
