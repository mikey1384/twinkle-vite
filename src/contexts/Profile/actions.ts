import { Dispatch } from '~/types';

export default function HomeActions(dispatch: Dispatch) {
  return {
    onLoadNotables({
      feeds,
      loadMoreButton,
      username
    }: {
      feeds: object[];
      loadMoreButton: boolean;
      username: string;
    }) {
      return dispatch({
        type: 'LOAD_NOTABLES',
        feeds,
        loadMoreButton,
        username
      });
    },
    onLoadMoreNotables({
      feeds,
      loadMoreButton,
      username
    }: {
      feeds: object[];
      loadMoreButton: boolean;
      username: string;
    }) {
      return dispatch({
        type: 'LOAD_MORE_NOTABLES',
        feeds,
        loadMoreButton,
        username
      });
    },
    onLoadPosts({
      feeds,
      loadMoreButton,
      section,
      username
    }: {
      feeds: object[];
      loadMoreButton: boolean;
      section: string;
      username: string;
    }) {
      return dispatch({
        type: 'LOAD_POSTS',
        feeds,
        loadMoreButton,
        section,
        username
      });
    },
    onLoadLikedPosts({
      feeds,
      loadMoreButton,
      section,
      username
    }: {
      feeds: object[];
      loadMoreButton: boolean;
      section: string;
      username: string;
    }) {
      return dispatch({
        type: 'LOAD_LIKED_POSTS',
        feeds,
        loadMoreButton,
        section,
        username
      });
    },
    onLoadPostsByUser({
      feeds,
      loadMoreButton,
      section,
      username
    }: {
      feeds: object[];
      loadMoreButton: boolean;
      section: string;
      username: string;
    }) {
      return dispatch({
        type: 'LOAD_POSTS_BY_USER',
        feeds,
        loadMoreButton,
        section,
        username
      });
    },
    onLoadMorePosts({
      feeds,
      loadMoreButton,
      section,
      username
    }: {
      feeds: object[];
      loadMoreButton: boolean;
      section: string;
      username: string;
    }) {
      return dispatch({
        type: 'LOAD_MORE_POSTS',
        feeds,
        loadMoreButton,
        section,
        username
      });
    },
    onLoadMoreLikedPosts({
      feeds,
      loadMoreButton,
      section,
      username
    }: {
      feeds: object[];
      loadMoreButton: boolean;
      section: string;
      username: string;
    }) {
      return dispatch({
        type: 'LOAD_MORE_LIKED_POSTS',
        feeds,
        loadMoreButton,
        section,
        username
      });
    },
    onLoadMorePostsByUser({
      feeds,
      loadMoreButton,
      section,
      username
    }: {
      feeds: object[];
      loadMoreButton: boolean;
      section: string;
      username: string;
    }) {
      return dispatch({
        type: 'LOAD_MORE_POSTS_BY_USER',
        feeds,
        loadMoreButton,
        section,
        username
      });
    },
    onResetProfile(username: string) {
      return dispatch({
        type: 'RESET_PROFILE',
        username
      });
    },
    onSetFeaturedSubjects({
      subjects,
      username
    }: {
      subjects: object[];
      username: string;
    }) {
      return dispatch({
        type: 'SET_FEATURED_SUBJECTS',
        subjects,
        username
      });
    },
    onSetProfileId({
      username,
      profileId
    }: {
      username: string;
      profileId: number;
    }) {
      return dispatch({
        type: 'SET_PROFILE_ID',
        username,
        profileId
      });
    },
    onUserNotExist(username: string) {
      return dispatch({
        type: 'USER_NOT_EXIST',
        username
      });
    }
  };
}
