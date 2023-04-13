export default function ManagementActions(dispatch) {
  return {
    onAddAccountType(accountType) {
      return dispatch({
        type: 'ADD_ACCOUNT_TYPE',
        accountType
      });
    },
    onDeleteAccountType(accountTypeLabel) {
      return dispatch({
        type: 'DELETE_ACCOUNT_TYPE',
        accountTypeLabel
      });
    },
    onEditModerators(newModerators) {
      return dispatch({
        type: 'EDIT_MODERATORS',
        newModerators
      });
    },
    onChangeModeratorAccountType({ userId, selectedAccountType }) {
      return dispatch({
        type: 'CHANGE_MODERATOR_ACCOUNT_TYPE',
        userId,
        selectedAccountType
      });
    },
    onEditAccountType({ label, editedAccountType }) {
      return dispatch({
        type: 'EDIT_ACCOUNT_TYPE',
        label,
        editedAccountType
      });
    },
    onLoadAccountTypes(accountTypes) {
      return dispatch({
        type: 'LOAD_ACCOUNT_TYPES',
        accountTypes
      });
    },
    onLoadBannedUsers(bannedUsers) {
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
    onLoadModerators(moderators) {
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
    onUpdateBanStatus(user) {
      return dispatch({
        type: 'UPDATE_BAN_STATUS',
        user
      });
    }
  };
}
