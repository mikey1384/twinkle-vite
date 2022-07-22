export default function HomeActions(dispatch) {
  return {
    onLoadNotables({ feeds, loadMoreButton, username }) {
      return dispatch({
        type: 'LOAD_NOTABLES',
        feeds,
        loadMoreButton,
        username
      });
    },
    onLoadMoreNotables({ feeds, loadMoreButton, username }) {
      return dispatch({
        type: 'LOAD_MORE_NOTABLES',
        feeds,
        loadMoreButton,
        username
      });
    },
    onLoadPosts({ feeds, loadMoreButton, section, username }) {
      return dispatch({
        type: 'LOAD_POSTS',
        feeds,
        loadMoreButton,
        section,
        username
      });
    },
    onLoadPostsByUser({ feeds, loadMoreButton, section, username }) {
      return dispatch({
        type: 'LOAD_POSTS_BY_USER',
        feeds,
        loadMoreButton,
        section,
        username
      });
    },
    onLoadMorePosts({ feeds, loadMoreButton, section, username }) {
      return dispatch({
        type: 'LOAD_MORE_POSTS',
        feeds,
        loadMoreButton,
        section,
        username
      });
    },
    onLoadMorePostsByUser({ feeds, loadMoreButton, section, username }) {
      return dispatch({
        type: 'LOAD_MORE_POSTS_BY_USER',
        feeds,
        loadMoreButton,
        section,
        username
      });
    },
    onResetProfile(username) {
      return dispatch({
        type: 'RESET_PROFILE',
        username
      });
    },
    onSetProfileId({ username, profileId }) {
      return dispatch({
        type: 'SET_PROFILE_ID',
        username,
        profileId
      });
    },
    onUserNotExist(username) {
      return dispatch({
        type: 'USER_NOT_EXIST',
        username
      });
    }
  };
}
