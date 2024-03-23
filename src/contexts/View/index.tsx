import React, { useReducer, ReactNode } from 'react';
import { createContext } from 'use-context-selector';
import ViewActions from './actions';
import ViewReducer from './reducer';

export const ViewContext = createContext({});
const initialViewState = {
  pageVisible: true,
  exploreCategory: ['subjects', 'videos', 'links', 'ai-cards'][
    Math.floor(Math.random() * 4)
  ],
  contentPath: '',
  contentNav: '',
  pageTitle: '',
  profileNav: '',
  homeNav: '/'
};

export function ViewContextProvider({ children }: { children: ReactNode }) {
  const [viewState, viewDispatch] = useReducer(ViewReducer, initialViewState);
  return (
    <ViewContext.Provider
      value={{
        state: viewState,
        actions: ViewActions(viewDispatch)
      }}
    >
      {children}
    </ViewContext.Provider>
  );
}
