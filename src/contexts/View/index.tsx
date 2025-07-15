import React, { useEffect, useReducer, ReactNode, useMemo } from 'react';
import { createContext, useContext } from 'use-context-selector';
import ViewActions from './actions';
import ViewReducer, { ViewState, ViewAction } from './reducer';

interface ViewCtx {
  state: ViewState;
  actions: ReturnType<typeof ViewActions>;
  dispatch: React.Dispatch<ViewAction>;
}

const ViewContext = createContext<ViewCtx | undefined>(undefined);

const getRandomCategory = (): ViewState['exploreCategory'] =>
  ['subjects', 'videos', 'links', 'ai-cards'][
    Math.floor(Math.random() * 4)
  ] as ViewState['exploreCategory'];

const initialViewState: ViewState = {
  pageVisible: true,
  exploreCategory: 'subjects',
  contentPath: '',
  contentNav: '',
  pageTitle: '',
  profileNav: '',
  homeNav: '/',
  audioKey: ''
};

export function ViewContextProvider({ children }: { children: ReactNode }) {
  const [viewState, viewDispatch] = useReducer(ViewReducer, initialViewState);

  useEffect(() => {
    if (viewState.exploreCategory === 'subjects') {
      viewDispatch({
        type: 'SET_EXPLORE_CATEGORY',
        category: getRandomCategory()
      });
    }
  }, [viewState.exploreCategory]);

  const actions = useMemo(() => ViewActions(viewDispatch), []);
  const value = useMemo(
    () => ({ state: viewState, actions, dispatch: viewDispatch }),
    [viewState, actions]
  );

  return <ViewContext.Provider value={value}>{children}</ViewContext.Provider>;
}

export const useView = () => {
  const ctx = useContext(ViewContext);
  if (!ctx)
    throw new Error('useView must be used within a ViewContextProvider');
  return ctx;
};

export { ViewContext };
