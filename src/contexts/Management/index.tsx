import React, { useReducer, ReactNode } from 'react';
import { createContext } from 'use-context-selector';
import ManagementActions from './actions';
import ManagementReducer from './reducer';

export const ManagementContext = createContext({});
export const initialManagementState = {
  accountTypes: [],
  accountTypesLoaded: false,
  loaded: false,
  moderators: [],
  moderatorsLoaded: false,
  bannedUsers: [],
  bannedUsersLoaded: false,
  numModeratorsShown: 5
};

export function ManagementContextProvider({
  children
}: {
  children: ReactNode;
}) {
  const [managementState, managementDispatch] = useReducer(
    ManagementReducer,
    initialManagementState
  );
  return (
    <ManagementContext.Provider
      value={{
        state: managementState,
        actions: ManagementActions(managementDispatch)
      }}
    >
      {children}
    </ManagementContext.Provider>
  );
}
