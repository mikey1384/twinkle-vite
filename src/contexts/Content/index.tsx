import React, { useReducer, ReactNode } from 'react';
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

  return (
    <ContentContext.Provider
      value={{
        state: contentState,
        actions: ContentActions(contentDispatch)
      }}
    >
      {children}
    </ContentContext.Provider>
  );
}
