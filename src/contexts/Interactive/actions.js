export default function InteractiveActions(dispatch) {
  return {
    onAddNewInteractiveSlide({ interactiveId, lastFork, slide }) {
      return dispatch({
        type: 'ADD_NEW_INTERACTIVE_SLIDE',
        interactiveId,
        lastFork,
        slide
      });
    },
    onArchiveSlide({ interactiveId, slideId }) {
      return dispatch({
        type: 'ARCHIVE_SLIDE',
        interactiveId,
        slideId
      });
    },
    onChangeNumUpdates({ interactiveId, numUpdates }) {
      return dispatch({
        type: 'CHANGE_NUM_UPDATES',
        interactiveId,
        numUpdates
      });
    },
    onConcatDisplayedSlides({ interactiveId, newSlides }) {
      return dispatch({
        type: 'CONCAT_DISPLAYED_SLIDES',
        interactiveId,
        newSlides
      });
    },
    onGoBack({ interactiveId, forkId }) {
      return dispatch({
        type: 'GO_BACK',
        interactiveId,
        forkId
      });
    },
    onInsertInteractiveSlide({ interactiveId, forkedFrom, slideId, newSlide }) {
      return dispatch({
        type: 'INSERT_INTERACTIVE_SLIDE',
        interactiveId,
        forkedFrom,
        slideId,
        newSlide
      });
    },
    onLoadInteractive(interactive) {
      return dispatch({
        type: 'LOAD_INTERACTIVE',
        interactive
      });
    },
    onMoveInteractiveSlide({ direction, interactiveId, slideId }) {
      return dispatch({
        type: 'MOVE_INTERACTIVE_SLIDE',
        direction,
        interactiveId,
        slideId
      });
    },
    onPublishInteractive({ interactiveId, numUpdates }) {
      return dispatch({
        type: 'PUBLISH_INTERACTIVE',
        interactiveId,
        numUpdates
      });
    },
    onRecoverArchivedSlide({ interactiveId, slideId, forkedFrom }) {
      return dispatch({
        type: 'RECOVER_ARCHIVED_SLIDE',
        interactiveId,
        slideId,
        forkedFrom
      });
    },
    onRemoveInteractiveSlide({ interactiveId, slideId }) {
      return dispatch({
        type: 'REMOVE_INTERACTIVE_SLIDE',
        interactiveId,
        slideId
      });
    },
    onSetDisplayedSlides({ interactiveId, newSlides }) {
      return dispatch({
        type: 'SET_DISPLAYED_SLIDES',
        interactiveId,
        newSlides
      });
    },
    onSetSlideState({ interactiveId, slideId, newState }) {
      return dispatch({
        type: 'SET_SLIDE_STATE',
        interactiveId,
        slideId,
        newState
      });
    }
  };
}
