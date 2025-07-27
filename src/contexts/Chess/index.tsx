import React, { useReducer, ReactNode } from 'react';
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
  return (
    <ChessContext.Provider
      value={{
        state: chessState,
        actions: ChessActions(chessDispatch)
      }}
    >
      {children}
    </ChessContext.Provider>
  );
}