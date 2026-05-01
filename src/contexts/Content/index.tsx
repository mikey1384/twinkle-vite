import React, { useReducer, ReactNode, useMemo, useRef } from 'react';
import { createContext } from '../selectableContext';
import ContentActions from './actions';
import ContentReducer from './reducer';

export const ContentContext = createContext({});
export const initialContentState = {};

export function ContentContextProvider({ children }: { children: ReactNode }) {
  const [contentState, contentDispatch] = useReducer(
    ContentReducer,
    initialContentState
  );
  const latestContentStateRef = useRef(initialContentState);
  latestContentStateRef.current = contentState;
  const memoizedActions = useMemo(
    () => ContentActions(contentDispatch),
    [contentDispatch]
  );
  const getContentStateSnapshot = useMemo(
    () => () => latestContentStateRef.current,
    []
  );
  const contextValue = useMemo(
    () => ({
      state: contentState,
      actions: memoizedActions,
      getContentStateSnapshot
    }),
    [contentState, getContentStateSnapshot, memoizedActions]
  );
  return (
    <ContentContext.Provider value={contextValue}>
      {children}
    </ContentContext.Provider>
  );
}
