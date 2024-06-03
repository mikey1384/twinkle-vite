import { Dispatch } from '~/types';

export default function HomeActions(dispatch: Dispatch) {
  return {
    onClearFileUploadProgress(filePath: string) {
      return dispatch({
        type: 'CLEAR_FILE_UPLOAD_PROGRESS',
        filePath
      });
    },
    onChangeCategory(category: string) {
      return dispatch({
        type: 'CHANGE_CATEGORY',
        category
      });
    },
    onChangeSubFilter(subFilter: string) {
      return dispatch({
        type: 'CHANGE_SUB_FILTER',
        subFilter
      });
    },
    onLoadFeeds({
      feeds,
      loadMoreButton
    }: {
      feeds: object[];
      loadMoreButton: boolean;
    }) {
      return dispatch({
        type: 'LOAD_FEEDS',
        feeds,
        loadMoreButton
      });
    },
    onLoadMonthlyLeaderboards({
      leaderboards,
      year
    }: {
      leaderboards: object[];
      year: number;
    }) {
      return dispatch({
        type: 'LOAD_MONTHLY_LEADERBOARDS',
        leaderboards,
        year
      });
    },
    onLoadMoreFeeds({
      feeds,
      loadMoreButton
    }: {
      feeds: object[];
      loadMoreButton: boolean;
    }) {
      return dispatch({
        type: 'LOAD_MORE_FEEDS',
        feeds,
        loadMoreButton
      });
    },
    onLoadNewFeeds(data: object) {
      return dispatch({
        type: 'LOAD_NEW_FEEDS',
        data
      });
    },
    onSetCurrentFeaturedIndex(index: number) {
      return dispatch({
        type: 'SET_CURRENT_FEATURED_INDEX',
        index
      });
    },
    onSetDisplayOrder(order: string[]) {
      return dispatch({
        type: 'SET_DISPLAY_ORDER',
        order
      });
    },
    onSetTopMenuSectionSection(section: string) {
      return dispatch({
        type: 'SET_TOP_MENU_SECTION',
        section
      });
    },
    onSetFeaturedSubjectsLoaded(loaded: boolean) {
      return dispatch({
        type: 'SET_FEATURED_SUBJECTS_LOADED',
        loaded
      });
    },
    onSetFeedsOutdated(outdated: boolean) {
      return dispatch({
        type: 'SET_FEEDS_OUTDATED',
        outdated
      });
    },
    onSetLeaderboardsExpanded({
      expanded,
      year
    }: {
      expanded: boolean;
      year: number;
    }) {
      return dispatch({
        type: 'SET_LEADERBOARDS_EXPANDED',
        expanded,
        year
      });
    },
    onSetAIStoriesModalShown(shown: boolean) {
      return dispatch({
        type: 'SET_AI_STORIES_MODAL_SHOWN',
        shown
      });
    },
    onSetGrammarGameModalShown(shown: boolean) {
      return dispatch({
        type: 'SET_GRAMMAR_GAME_MODAL_SHOWN',
        shown
      });
    },
    onSetInputModalShown({
      shown,
      modalType
    }: {
      shown: boolean;
      modalType: string;
    }) {
      return dispatch({
        type: 'SET_INPUT_MODAL_SHOWN',
        shown,
        modalType
      });
    },
    onSetSubmittingSubject(submitting: boolean) {
      return dispatch({
        type: 'SET_SUBMITTING_SUBJECT',
        submitting
      });
    },
    onSetUploadingFile(uploading: boolean) {
      return dispatch({
        type: 'SET_UPLOADING_FILE',
        uploading
      });
    },
    onUpdateFileUploadProgress(progress: number) {
      return dispatch({
        type: 'UPDATE_FILE_UPLOAD_PROGRESS',
        progress
      });
    },
    onUpdateSecretAttachmentUploadProgress(progress: number) {
      return dispatch({
        type: 'UPDATE_SECRET_ATTACHMENT_UPLOAD_PROGRESS',
        progress
      });
    }
  };
}
