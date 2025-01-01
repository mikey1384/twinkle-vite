export default function HomeReducer(
  state: any,
  action: {
    type: string;
    [key: string]: any;
  }
) {
  const contentKey =
    action.contentType && action.contentId
      ? action.contentType + action.contentId
      : 'temp';
  switch (action.type) {
    case 'CHANGE_CATEGORY':
      return {
        ...state,
        category: action.category
      };
    case 'CHANGE_SUB_FILTER':
      return {
        ...state,
        subFilter: action.subFilter
      };
    case 'CLEAR_FILE_UPLOAD_PROGRESS':
      return {
        ...state,
        fileUploadProgress: null,
        secretAttachmentUploadProgress: null
      };
    case 'DELETE_FEED':
      return {
        ...state,
        feeds: state.feeds.filter(
          (feed: { contentType: string; contentId: number }) =>
            feed.contentType + feed.contentId !== contentKey
        )
      };
    case 'SET_CURRENT_FEATURED_INDEX':
      return {
        ...state,
        currentFeaturedIndex: action.index
      };
    case 'SET_FEATURED_SUBJECTS_LOADED':
      return {
        ...state,
        featuredSubjectsLoaded: action.loaded
      };
    case 'LOAD_FEEDS':
      return {
        ...state,
        feedsOutdated: false,
        displayOrder: 'desc',
        feeds: action.feeds,
        loadMoreButton: action.loadMoreButton,
        loaded: true
      };
    case 'LOAD_MONTHLY_LEADERBOARDS':
      return {
        ...state,
        leaderboardsObj: {
          ...state.leaderboardsObj,
          [action.year]: {
            ...state.leaderboardsObj[action.year],
            loaded: true,
            expanded: false,
            leaderboards: action.leaderboards
          }
        }
      };
    case 'LOAD_MORE_FEEDS':
      return {
        ...state,
        feeds: [
          ...state.feeds,
          ...action.feeds.filter(
            (newFeed: any) =>
              !state.feeds.some(
                (existingFeed: any) => existingFeed.feedId === newFeed.feedId
              )
          )
        ],
        loadMoreButton: action.loadMoreButton
      };
    case 'LOAD_NEW_FEEDS':
      return {
        ...state,
        feedsOutdated: false,
        feeds: action.data.concat(state.feeds)
      };
    case 'SET_DISPLAY_ORDER':
      return {
        ...state,
        displayOrder: action.order
      };
    case 'SET_INPUT_MODAL_SHOWN':
      return {
        ...state,
        inputModalShown: action.shown,
        inputModalType: action.shown ? action.modalType : null
      };
    case 'SET_TOP_MENU_SECTION':
      return {
        ...state,
        topMenuSection: action.section
      };
    case 'SET_FEEDS_OUTDATED':
      return {
        ...state,
        feedsOutdated: action.outdated
      };
    case 'SET_AI_STORIES_MODAL_SHOWN':
      return {
        ...state,
        aiStoriesModalShown: action.shown
      };
    case 'LOAD_GROUPS':
      return {
        ...state,
        groupIds: action.groupIds,
        groupsObj: action.groupsObj,
        isGroupsLoaded: true,
        loadMoreGroupsShown: action.loadMoreShown
      };
    case 'LOAD_MORE_GROUPS':
      return {
        ...state,
        groupIds: [...state.groupIds, ...action.groupIds],
        groupsObj: {
          ...state.groupsObj,
          ...action.groupsObj
        },
        isGroupsLoaded: true,
        loadMoreGroupsShown: action.loadMoreShown
      };
    case 'RESET_GROUPS':
      return {
        ...state,
        groupIds: [],
        isGroupsLoaded: false,
        loadMoreGroupsShown: false
      };
    case 'CLEAR_SEARCHED_GROUPS':
      return {
        ...state,
        searchedGroupIds: []
      };
    case 'SEARCH_GROUPS':
      return {
        ...state,
        searchedGroupIds: action.groupIds,
        groupsObj: {
          ...state.groupsObj,
          ...action.groupsObj
        }
      };
    case 'SET_GROUP_STATE':
      return {
        ...state,
        groupsObj: {
          ...state.groupsObj,
          [action.groupId]: {
            ...state.groupsObj[action.groupId],
            ...action.newState
          }
        }
      };
    case 'SET_GROUPS_PREVIEW':
      return {
        ...state,
        previewGroups: action.groups
      };
    case 'SET_GRAMMAR_GAME_MODAL_SHOWN':
      return {
        ...state,
        grammarGameModalShown: action.shown
      };
    case 'SET_LEADERBOARDS_EXPANDED':
      return {
        ...state,
        leaderboardsObj: {
          ...state.leaderboardsObj,
          [action.year]: {
            ...state.leaderboardsObj?.[action.year],
            expanded: action.expanded
          }
        }
      };
    case 'SET_GROUP_MEMBER_STATE':
      return {
        ...state,
        groupsObj: {
          ...state.groupsObj,
          [action.groupId]: {
            ...state.groupsObj[action.groupId],
            allMemberIds:
              action.action === 'add'
                ? [
                    ...(state.groupsObj[action.groupId]?.allMemberIds || []),
                    action.memberId
                  ]
                : (state.groupsObj[action.groupId]?.allMemberIds || []).filter(
                    (id: number) => id !== action.memberId
                  )
          }
        }
      };
    case 'SET_SUBMITTING_SUBJECT':
      return {
        ...state,
        submittingSubject: action.submitting
      };
    case 'SET_UPLOADING_FILE':
      return {
        ...state,
        uploadingFile: action.uploading
      };
    case 'UPDATE_FILE_UPLOAD_PROGRESS':
      return {
        ...state,
        fileUploadProgress: action.progress
      };
    case 'UPDATE_SECRET_ATTACHMENT_UPLOAD_PROGRESS':
      return {
        ...state,
        secretAttachmentUploadProgress: action.progress
      };
    default:
      return state;
  }
}
