import React, { useReducer, ReactNode } from 'react';
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
  return (
    <ProfileContext.Provider
      value={{
        state: profileState,
        actions: ProfileActions(profileDispatch)
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}
