import { useReducer } from 'react';
import { createContext } from 'use-context-selector';
import PropTypes from 'prop-types';
import ViewActions from './actions';
import ViewReducer from './reducer';

export const ViewContext = createContext();
const initialViewState = {
  pageVisible: true,
  exploreCategory: ['subjects', 'videos', 'links', 'ai-cards'][
    Math.floor(Math.random() * 4)
  ],
  contentPath: '',
  contentNav: '',
  pageTitle: '',
  profileNav: '',
  homeNav: '/',
  scrollPositions: {}
};

ViewContextProvider.propTypes = {
  children: PropTypes.node
};
export function ViewContextProvider({ children }) {
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
