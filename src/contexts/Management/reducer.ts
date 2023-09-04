import { User } from '~/types';

export default function ManagementReducer(
  state: any,
  action: {
    type: string;
    [key: string]: any;
  }
) {
  switch (action.type) {
    case 'ADD_ACCOUNT_TYPE':
      return {
        ...state,
        accountTypes: state.accountTypes.concat(action.accountType)
      };
    case 'APPROVE_DOB':
      return {
        ...state,
        approvalItems: state.approvalItems.map(
          (approvalItem: {
            id: number;
            status: string;
            type: string;
            submittedBy: number;
          }) =>
            approvalItem.type === 'dob' &&
            approvalItem.submittedBy === action.userId
              ? {
                  ...approvalItem,
                  status: action.status
                }
              : approvalItem
        )
      };
    case 'EDIT_MODERATORS':
      return {
        ...state,
        moderators: action.newModerators.concat(
          state.moderators.filter(
            (moderator: User) =>
              !action.newModerators
                .map((newModerator: User) => newModerator.id)
                .includes(moderator.id)
          )
        )
      };
    case 'CHANGE_MODERATOR_ACCOUNT_TYPE':
      return {
        ...state,
        moderators: action.selectedAccountType
          ? state.moderators.map((moderator: User) =>
              moderator.id === action.userId
                ? {
                    ...moderator,
                    userType: action.selectedAccountType
                  }
                : moderator
            )
          : state.moderators.filter(
              (moderator: User) => moderator.id !== action.userId
            )
      };
    case 'DELETE_ACCOUNT_TYPE':
      return {
        ...state,
        accountTypes: state.accountTypes.filter(
          (accountType: { label: string }) =>
            accountType.label !== action.accountTypeLabel
        ),
        moderators: state.moderators.filter(
          (moderator: User) => moderator.userType !== action.accountTypeLabel
        )
      };
    case 'EDIT_ACCOUNT_TYPE':
      return {
        ...state,
        accountTypes: state.accountTypes.map((accountType: { label: string }) =>
          accountType.label === action.label
            ? {
                ...accountType,
                ...action.editedAccountType
              }
            : accountType
        ),
        moderators: state.moderators.map((moderator: User) => {
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
    case 'LOAD_APPROVAL_ITEMS':
      return {
        ...state,
        approvalItems: action.approvalItems,
        approvalItemsLoaded: true
      };
    case 'LOAD_MORE_APPROVAL_ITEMS':
      return {
        ...state,
        numApprovalItemsShown: state.numApprovalItemsShown + 10
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
          state.bannedUsers.filter(
            (user: { id: number }) => user.id !== action.user.id
          )
        )
      };
    default:
      return state;
  }
}
