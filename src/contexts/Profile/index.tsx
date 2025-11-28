import React, { useReducer, ReactNode, useMemo } from 'react';
import { createContext } from 'use-context-selector';
import ProfileActions from './actions';
import ProfileReducer from './reducer';

export const ProfileContext = createContext({});
export const initialProfileState = {};

export function ProfileContextProvider({ children }: { children: ReactNode }) {
  const [profileState, profileDispatch] = useReducer(
    ProfileReducer,
    initialProfileState
  );
  const memoizedActions = useMemo(
    () => ProfileActions(profileDispatch),
    [profileDispatch]
  );
  return (
    <ProfileContext.Provider
      value={{
        state: profileState,
        actions: memoizedActions
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}
