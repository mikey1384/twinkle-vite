import React, { useReducer, ReactNode } from 'react';
import { createContext } from 'use-context-selector';
import ManagementActions from './actions';
import ManagementReducer from './reducer';

export const ManagementContext = createContext({});
export const initialManagementState = {
  accountTypes: [],
  accountTypesLoaded: false,
  adminLogs: [],
  approvalItems: [],
  approvalItemsLoaded: false,
  numApprovalItemsShown: 5,
  loaded: false,
  moderators: [],
  moderatorsLoaded: false,
  supermods: [],
  supermodsLoaded: false,
  bannedUsers: [],
  bannedUsersLoaded: false,
  numModeratorsShown: 5,
  numSupermodsShown: 5,
  wealthData: [],
  wealthDataLoaded: false
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
