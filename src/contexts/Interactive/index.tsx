import React, { useReducer, ReactNode, useMemo } from 'react';
import { createContext } from 'use-context-selector';
import InteractiveActions from './actions';
import InteractiveReducer from './reducer';

export const InteractiveContext = createContext({});
export const initialInteractiveState = {};

export function InteractiveContextProvider({
  children
}: {
  children: ReactNode;
}) {
  const [interactiveState, interactiveDispatch] = useReducer(
    InteractiveReducer,
    initialInteractiveState
  );
  const memoizedActions = useMemo(
    () => InteractiveActions(interactiveDispatch),
    [interactiveDispatch]
  );
  const contextValue = useMemo(
    () => ({ state: interactiveState, actions: memoizedActions }),
    [interactiveState, memoizedActions]
  );
  return (
    <InteractiveContext.Provider value={contextValue}>
      {children}
    </InteractiveContext.Provider>
  );
}
