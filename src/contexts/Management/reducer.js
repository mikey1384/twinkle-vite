export default function ManagementReducer(state, action) {
  switch (action.type) {
    case 'ADD_ACCOUNT_TYPE':
      return {
        ...state,
        accountTypes: state.accountTypes.concat(action.accountType)
      };
    case 'EDIT_MODERATORS':
      return {
        ...state,
        moderators: action.newModerators.concat(
          state.moderators.filter(
            (moderator) =>
              !action.newModerators
                .map((newModerator) => newModerator.id)
                .includes(moderator.id)
          )
        )
      };
    case 'CHANGE_MODERATOR_ACCOUNT_TYPE':
      return {
        ...state,
        moderators: action.selectedAccountType
          ? state.moderators.map((moderator) =>
              moderator.id === action.userId
                ? {
                    ...moderator,
                    userType: action.selectedAccountType
                  }
                : moderator
            )
          : state.moderators.filter(
              (moderator) => moderator.id !== action.userId
            )
      };
    case 'DELETE_ACCOUNT_TYPE':
      return {
        ...state,
        accountTypes: state.accountTypes.filter(
          (accountType) => accountType.label !== action.accountTypeLabel
        ),
        moderators: state.moderators.filter(
          (moderator) => moderator.userType !== action.accountTypeLabel
        )
      };
    case 'EDIT_ACCOUNT_TYPE':
      return {
        ...state,
        accountTypes: state.accountTypes.map((accountType) =>
          accountType.label === action.label
            ? {
                ...accountType,
                ...action.editedAccountType
              }
            : accountType
        ),
        moderators: state.moderators.map((moderator) => {
          return {
            ...moderator,
            userType:
              moderator.userType === action.label
                ? action.editedAccountType.label
                : moderator.userType
          };
        })
      };
    case 'LOAD_ACCOUNT_TYPES':
      return {
        ...state,
        accountTypes: action.accountTypes,
        accountTypesLoaded: true
      };
    case 'LOAD_BANNED_USERS':
      return {
        ...state,
        bannedUsers: action.bannedUsers,
        bannedUsersLoaded: true
      };
    case 'LOAD_MANAGEMENT':
      return {
        ...state,
        loaded: true
      };
    case 'LOAD_MODERATORS':
      return {
        ...state,
        moderators: action.moderators,
        moderatorsLoaded: true
      };
    case 'LOAD_MORE_MODERATORS':
      return {
        ...state,
        numModeratorsShown: state.numModeratorsShown + 10
      };
    case 'UPDATE_BAN_STATUS':
      return {
        ...state,
        bannedUsers: [action.user].concat(
          state.bannedUsers.filter((user) => user.id !== action.user.id)
        )
      };
    default:
      return state;
  }
}
