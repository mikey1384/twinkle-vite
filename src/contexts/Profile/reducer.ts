export default function ProfileReducer(
  state: any,
  action: {
    type: string;
    [key: string]: any;
  }
) {
  const defaultState = {
    notables: {
      feeds: [],
      loadMoreButton: false
    },
    likes: {
      ['ai-stories']: [],
      all: [],
      allLoaded: false,
      allLoadMoreButton: false,
      allByUser: [],
      allByUserLoaded: false,
      allByUserLoadMoreButton: false,
      comments: [],
      commentsLoaded: false,
      commentsLoadMoreButton: false,
      subjects: [],
      subjectsLoaded: false,
      subjectsLoadMoreButton: false,
      subjectsByUser: [],
      subjectsByUserLoaded: false,
      subjectsByUserLoadMoreButton: false,
      videos: [],
      videosLoaded: false,
      videosLoadMoreButton: false,
      videosByUser: [],
      videosByUserLoaded: false,
      videosByUserLoadMoreButton: false,
      links: [],
      linksLoaded: false,
      linksLoadMoreButton: false,
      linksByUser: [],
      linksByUserLoaded: false,
      linksByUserLoadMoreButton: false
    },
    posts: {
      ['ai-stories']: [],
      all: [],
      allLoaded: false,
      allLoadMoreButton: false,
      allByUser: [],
      allByUserLoaded: false,
      allByUserLoadMoreButton: false,
      comments: [],
      commentsLoaded: false,
      commentsLoadMoreButton: false,
      subjects: [],
      subjectsLoaded: false,
      subjectsLoadMoreButton: false,
      subjectsByUser: [],
      subjectsByUserLoaded: false,
      subjectsByUserLoadMoreButton: false,
      videos: [],
      videosLoaded: false,
      videosLoadMoreButton: false,
      videosByUser: [],
      videosByUserLoaded: false,
      videosByUserLoadMoreButton: false,
      watched: [],
      watchedLoaded: false,
      watchedLoadMoreButton: false,
      links: [],
      linksLoaded: false,
      linksLoadMoreButton: false,
      linksByUser: [],
      linksByUserLoaded: false,
      linksByUserLoadMoreButton: false
    }
  };
  const username = action.username;
  const prevContentState = state[action.username] || defaultState;
  switch (action.type) {
    case 'LOAD_NOTABLES':
      return {
        ...state,
        [username]: {
          ...prevContentState,
          notables: {
            ...prevContentState.notables,
            feeds: action.feeds,
            loadMoreButton: action.loadMoreButton,
            loaded: true
          }
        }
      };
    case 'LOAD_MORE_NOTABLES':
      return {
        ...state,
        [username]: {
          ...prevContentState,
          notables: {
            ...prevContentState.notables,
            feeds: prevContentState.notables.feeds.concat(action.feeds),
            loadMoreButton: action.loadMoreButton
          }
        }
      };
    case 'LOAD_POSTS':
      return {
        ...state,
        [username]: {
          ...prevContentState,
          posts: {
            ...prevContentState.posts,
            [action.section]: action.feeds,
            [`${action.section}Loaded`]: true,
            [`${action.section}LoadMoreButton`]: action.loadMoreButton
          }
        }
      };
    case 'LOAD_LIKED_POSTS':
      return {
        ...state,
        [username]: {
          ...prevContentState,
          likes: {
            ...prevContentState.likes,
            [action.section]: action.feeds,
            [`${action.section}Loaded`]: true,
            [`${action.section}LoadMoreButton`]: action.loadMoreButton
          }
        }
      };
    case 'LOAD_POSTS_BY_USER':
      return {
        ...state,
        [username]: {
          ...prevContentState,
          posts: {
            ...prevContentState.posts,
            [`${action.section}ByUser`]: action.feeds,
            [`${action.section}ByUserLoaded`]: true,
            [`${action.section}ByUserLoadMoreButton`]: action.loadMoreButton
          }
        }
      };
    case 'LOAD_MORE_POSTS':
      return {
        ...state,
        [username]: {
          ...prevContentState,
          posts: {
            ...prevContentState.posts,
            [action.section]: prevContentState.posts[action.section].concat(
              action.feeds
            ),
            [`${action.section}LoadMoreButton`]: action.loadMoreButton
          }
        }
      };
    case 'LOAD_MORE_LIKED_POSTS':
      return {
        ...state,
        [username]: {
          ...prevContentState,
          likes: {
            ...prevContentState.likes,
            [action.section]: prevContentState.likes[action.section].concat(
              action.feeds
            ),
            [`${action.section}LoadMoreButton`]: action.loadMoreButton
          }
        }
      };
    case 'LOAD_MORE_POSTS_BY_USER':
      return {
        ...state,
        [username]: {
          ...prevContentState,
          posts: {
            ...prevContentState.posts,
            [`${action.section}ByUser`]: prevContentState.posts[
              `${action.section}ByUser`
            ].concat(action.feeds),
            [`${action.section}ByUserLoadMoreButton`]: action.loadMoreButton
          }
        }
      };
    case 'RESET_PROFILE':
      return {
        ...state,
        [username]: {
          ...defaultState,
          profileId: state.profileId
        }
      };
    case 'SET_PROFILE_ID':
      return {
        ...state,
        [username]: {
          ...prevContentState,
          profileId: action.profileId
        }
      };
    case 'SET_FEATURED_SUBJECTS':
      return {
        ...state,
        [username]: {
          ...prevContentState,
          featuredSubjects: action.subjects
        }
      };
    case 'USER_NOT_EXIST':
      return {
        ...state,
        [username]: {
          ...prevContentState,
          notExist: true
        }
      };
    default:
      return state;
  }
}
