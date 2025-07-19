import React, {
  useEffect,
  useReducer,
  ReactNode,
  useMemo,
  useRef
} from 'react';
import { createContext, useContext } from 'use-context-selector';
import ViewActions from './actions';
import ViewReducer, { ViewState, ViewAction } from './reducer';

interface ViewCtx {
  state: ViewState;
  actions: ReturnType<typeof ViewActions>;
  dispatch: React.Dispatch<ViewAction>;
}

export const ViewContext = createContext<ViewCtx | undefined>(undefined);

const pool: ViewState['exploreCategory'][] = [
  'subjects',
  'videos',
  'links',
  'ai-cards'
];
const getRandomCategory = (): ViewState['exploreCategory'] =>
  pool[Math.floor(Math.random() * pool.length)];

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

  const didRandomise = useRef(false);
  useEffect(() => {
    if (!didRandomise.current && viewState.exploreCategory === 'subjects') {
      viewDispatch({
        type: 'SET_EXPLORE_CATEGORY',
        category: getRandomCategory()
      });
      didRandomise.current = true;
    }
  }, [viewState.exploreCategory]);

  const actions = useMemo(() => ViewActions(viewDispatch), []);

  const value = useMemo(
    () => ({ state: viewState, actions, dispatch: viewDispatch }),
    [viewState, actions]
  );

  return <ViewContext.Provider value={value}>{children}</ViewContext.Provider>;
}

export const useViewContext = () => {
  const ctx = useContext(ViewContext);
  if (!ctx)
    throw new Error('useViewContext must be used within ViewContextProvider');
  return ctx;
};
