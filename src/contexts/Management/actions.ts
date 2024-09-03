import { Dispatch } from '~/types';

export default function ManagementActions(dispatch: Dispatch) {
  return {
    onAddAccountType(accountType: string) {
      dispatch({
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
      dispatch({
        type: 'APPROVE_REQUEST',
        status,
        userId,
        requestType
      });
    },
    onDeleteAccountType(accountTypeLabel: string) {
      dispatch({
        type: 'DELETE_ACCOUNT_TYPE',
        accountTypeLabel
      });
    },
    onEditModerators(newModerators: object[]) {
      dispatch({
        type: 'EDIT_MODERATORS',
        newModerators
      });
    },
    onEditSupermods(supermods: object[]) {
      dispatch({
        type: 'EDIT_SUPERMODS',
        supermods
      });
    },
    onFilterModerators(userId: number) {
      dispatch({
        type: 'FILTER_MODERATORS',
        userId
      });
    },
    onChangeModeratorAccountType({
      userId,
      selectedAccountType
    }: {
      userId: number;
      selectedAccountType: string;
    }) {
      dispatch({
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
      dispatch({
        type: 'EDIT_ACCOUNT_TYPE',
        label,
        editedAccountType
      });
    },
    onLoadAccountTypes(accountTypes: string[]) {
      dispatch({
        type: 'LOAD_ACCOUNT_TYPES',
        accountTypes
      });
    },
    onLoadApprovalItems(approvalItems: object[]) {
      dispatch({
        type: 'LOAD_APPROVAL_ITEMS',
        approvalItems
      });
    },
    onLoadMoreApprovalItems() {
      dispatch({
        type: 'LOAD_MORE_APPROVAL_ITEMS'
      });
    },
    onLoadBannedUsers(bannedUsers: object[]) {
      dispatch({
        type: 'LOAD_BANNED_USERS',
        bannedUsers
      });
    },
    onLoadManagement() {
      dispatch({
        type: 'LOAD_MANAGEMENT'
      });
    },
    onLoadModerators(moderators: object[]) {
      dispatch({
        type: 'LOAD_MODERATORS',
        moderators
      });
    },
    onLoadMoreModerators() {
      dispatch({
        type: 'LOAD_MORE_MODERATORS'
      });
    },
    onLoadSupermods(supermods: object[]) {
      dispatch({
        type: 'LOAD_SUPERMODS',
        supermods
      });
    },
    onLoadMoreSupermods() {
      dispatch({
        type: 'LOAD_MORE_SUPERMODS'
      });
    },
    onUpdateBanStatus(user: object) {
      dispatch({
        type: 'UPDATE_BAN_STATUS',
        user
      });
    },
    onRemoveSupermod(userId: number) {
      dispatch({
        type: 'REMOVE_SUPERMOD',
        userId
      });
    },
    onSetSupermodState({
      userId,
      newState
    }: {
      userId: number;
      newState: object;
    }) {
      dispatch({
        type: 'SET_SUPERMOD_STATE',
        userId,
        newState
      });
    }
  };
}
