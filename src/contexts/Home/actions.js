export default function HomeActions(dispatch) {
  return {
    onClearFileUploadProgress(filePath) {
      return dispatch({
        type: 'CLEAR_FILE_UPLOAD_PROGRESS',
        filePath
      });
    },
    onChangeCategory(category) {
      return dispatch({
        type: 'CHANGE_CATEGORY',
        category
      });
    },
    onChangeSubFilter(subFilter) {
      return dispatch({
        type: 'CHANGE_SUB_FILTER',
        subFilter
      });
    },
    onLoadFeeds({ feeds, loadMoreButton }) {
      return dispatch({
        type: 'LOAD_FEEDS',
        feeds,
        loadMoreButton
      });
    },
    onLoadMonthlyLeaderboards({ leaderboards, year }) {
      return dispatch({
        type: 'LOAD_MONTHLY_LEADERBOARDS',
        leaderboards,
        year
      });
    },
    onLoadMoreFeeds({ feeds, loadMoreButton }) {
      return dispatch({
        type: 'LOAD_MORE_FEEDS',
        feeds,
        loadMoreButton
      });
    },
    onLoadNewFeeds(data) {
      return dispatch({
        type: 'LOAD_NEW_FEEDS',
        data
      });
    },
    onSetDisplayOrder(order) {
      return dispatch({
        type: 'SET_DISPLAY_ORDER',
        order
      });
    },
    onSetTopMenuSectionSection(section) {
      return dispatch({
        type: 'SET_TOP_MENU_SECTION',
        section
      });
    },
    onSetFeedsOutdated(outdated) {
      return dispatch({
        type: 'SET_FEEDS_OUTDATED',
        outdated
      });
    },
    onSetLeaderboardsExpanded({ expanded, year }) {
      return dispatch({
        type: 'SET_LEADERBOARDS_EXPANDED',
        expanded,
        year
      });
    },
    onSetGrammarGameModalShown(shown) {
      return dispatch({
        type: 'SET_GRAMMAR_GAME_MODAL_SHOWN',
        shown
      });
    },
    onSetSubmittingSubject(submitting) {
      return dispatch({
        type: 'SET_SUBMITTING_SUBJECT',
        submitting
      });
    },
    onSetUploadingFile(uploading) {
      return dispatch({
        type: 'SET_UPLOADING_FILE',
        uploading
      });
    },
    onUpdateFileUploadProgress(progress) {
      return dispatch({
        type: 'UPDATE_FILE_UPLOAD_PROGRESS',
        progress
      });
    },
    onUpdateSecretAttachmentUploadProgress(progress) {
      return dispatch({
        type: 'UPDATE_SECRET_ATTACHMENT_UPLOAD_PROGRESS',
        progress
      });
    }
  };
}
