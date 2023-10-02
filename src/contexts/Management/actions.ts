import { Dispatch } from '~/types';

export default function ManagementActions(dispatch: Dispatch) {
  return {
    onAddAccountType(accountType: string) {
      return dispatch({
        type: 'ADD_ACCOUNT_TYPE',
        accountType
      });
    },
    onApproveRequest({
      status,
      userId,
      requestType
    }: {
      status: string;
      userId: number;
      requestType: string;
    }) {
      return dispatch({
        type: 'APPROVE_REQUEST',
        status,
        userId,
        requestType
      });
    },
    onDeleteAccountType(accountTypeLabel: string) {
      return dispatch({
        type: 'DELETE_ACCOUNT_TYPE',
        accountTypeLabel
      });
    },
    onEditModerators(newModerators: object[]) {
      return dispatch({
        type: 'EDIT_MODERATORS',
        newModerators
      });
    },
    onEditSupermods(supermods: object[]) {
      return dispatch({
        type: 'EDIT_SUPERMODS',
        supermods
      });
    },
    onChangeModeratorAccountType({
      userId,
      selectedAccountType
    }: {
      userId: number;
      selectedAccountType: string;
    }) {
      return dispatch({
        type: 'CHANGE_MODERATOR_ACCOUNT_TYPE',
        userId,
        selectedAccountType
      });
    },
    onEditAccountType({
      label,
      editedAccountType
    }: {
      label: string;
      editedAccountType: string;
    }) {
      return dispatch({
        type: 'EDIT_ACCOUNT_TYPE',
        label,
        editedAccountType
      });
    },
    onLoadAccountTypes(accountTypes: string[]) {
      return dispatch({
        type: 'LOAD_ACCOUNT_TYPES',
        accountTypes
      });
    },
    onLoadApprovalItems(approvalItems: object[]) {
      return dispatch({
        type: 'LOAD_APPROVAL_ITEMS',
        approvalItems
      });
    },
    onLoadMoreApprovalItems() {
      return dispatch({
        type: 'LOAD_MORE_APPROVAL_ITEMS'
      });
    },
    onLoadBannedUsers(bannedUsers: object[]) {
      return dispatch({
        type: 'LOAD_BANNED_USERS',
        bannedUsers
      });
    },
    onLoadManagement() {
      return dispatch({
        type: 'LOAD_MANAGEMENT'
      });
    },
    onLoadModerators(moderators: object[]) {
      return dispatch({
        type: 'LOAD_MODERATORS',
        moderators
      });
    },
    onLoadMoreModerators() {
      return dispatch({
        type: 'LOAD_MORE_MODERATORS'
      });
    },
    onLoadSupermods(supermods: object[]) {
      return dispatch({
        type: 'LOAD_SUPERMODS',
        supermods
      });
    },
    onLoadMoreSupermods() {
      return dispatch({
        type: 'LOAD_MORE_SUPERMODS'
      });
    },
    onUpdateBanStatus(user: object) {
      return dispatch({
        type: 'UPDATE_BAN_STATUS',
        user
      });
    },
    onSetSupermodState({
      userId,
      newState
    }: {
      userId: number;
      newState: object;
    }) {
      return dispatch({
        type: 'SET_SUPERMOD_STATE',
        userId,
        newState
      });
    }
  };
}
