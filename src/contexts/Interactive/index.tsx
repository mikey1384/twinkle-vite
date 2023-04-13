import React, { useReducer, ReactNode } from 'react';
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

  return (
    <InteractiveContext.Provider
      value={{
        state: interactiveState,
        actions: InteractiveActions(interactiveDispatch)
      }}
    >
      {children}
    </InteractiveContext.Provider>
  );
}
