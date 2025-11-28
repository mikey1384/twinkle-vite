import React, { useReducer, ReactNode, useMemo } from 'react';
import { createContext } from 'use-context-selector';
import ChessActions from './actions';
import ChessReducer from './reducer';

export const ChessContext = createContext({});
export const initialChessState = {
  stats: null,
  loading: false,
  error: null
};

export function ChessContextProvider({ children }: { children: ReactNode }) {
  const [chessState, chessDispatch] = useReducer(ChessReducer, initialChessState);
  const memoizedActions = useMemo(
    () => ChessActions(chessDispatch),
    [chessDispatch]
  );
  return (
    <ChessContext.Provider
      value={{
        state: chessState,
        actions: memoizedActions
      }}
    >
      {children}
    </ChessContext.Provider>
  );
}