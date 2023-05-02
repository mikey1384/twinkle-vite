import { Dispatch } from '~/types';

export default function InteractiveActions(dispatch: Dispatch) {
  return {
    onAddNewInteractiveSlide({
      interactiveId,
      lastFork,
      slide
    }: {
      interactiveId: number;
      lastFork: object;
      slide: object;
    }) {
      return dispatch({
        type: 'ADD_NEW_INTERACTIVE_SLIDE',
        interactiveId,
        lastFork,
        slide
      });
    },
    onArchiveSlide({
      interactiveId,
      slideId
    }: {
      interactiveId: number;
      slideId: number;
    }) {
      return dispatch({
        type: 'ARCHIVE_SLIDE',
        interactiveId,
        slideId
      });
    },
    onChangeNumUpdates({
      interactiveId,
      numUpdates
    }: {
      interactiveId: number;
      numUpdates: number;
    }) {
      return dispatch({
        type: 'CHANGE_NUM_UPDATES',
        interactiveId,
        numUpdates
      });
    },
    onConcatDisplayedSlides({
      interactiveId,
      newSlides
    }: {
      interactiveId: number;
      newSlides: number[];
    }) {
      return dispatch({
        type: 'CONCAT_DISPLAYED_SLIDES',
        interactiveId,
        newSlides
      });
    },
    onGoBack({
      interactiveId,
      forkId
    }: {
      interactiveId: number;
      forkId: number;
    }) {
      return dispatch({
        type: 'GO_BACK',
        interactiveId,
        forkId
      });
    },
    onInsertInteractiveSlide({
      interactiveId,
      forkedFrom,
      slideId,
      newSlide
    }: {
      interactiveId: number;
      forkedFrom: number;
      slideId: number;
      newSlide: object;
    }) {
      return dispatch({
        type: 'INSERT_INTERACTIVE_SLIDE',
        interactiveId,
        forkedFrom,
        slideId,
        newSlide
      });
    },
    onLoadInteractive(interactive: object) {
      return dispatch({
        type: 'LOAD_INTERACTIVE',
        interactive
      });
    },
    onMoveInteractiveSlide({
      direction,
      interactiveId,
      slideId
    }: {
      direction: string;
      interactiveId: number;
      slideId: number;
    }) {
      return dispatch({
        type: 'MOVE_INTERACTIVE_SLIDE',
        direction,
        interactiveId,
        slideId
      });
    },
    onPublishInteractive({
      interactiveId,
      numUpdates
    }: {
      interactiveId: number;
      numUpdates: number;
    }) {
      return dispatch({
        type: 'PUBLISH_INTERACTIVE',
        interactiveId,
        numUpdates
      });
    },
    onRecoverArchivedSlide({
      interactiveId,
      slideId,
      forkedFrom
    }: {
      interactiveId: number;
      slideId: number;
      forkedFrom: number;
    }) {
      return dispatch({
        type: 'RECOVER_ARCHIVED_SLIDE',
        interactiveId,
        slideId,
        forkedFrom
      });
    },
    onRemoveInteractiveSlide({
      interactiveId,
      slideId
    }: {
      interactiveId: number;
      slideId: number;
    }) {
      return dispatch({
        type: 'REMOVE_INTERACTIVE_SLIDE',
        interactiveId,
        slideId
      });
    },
    onSetDisplayedSlides({
      interactiveId,
      newSlides
    }: {
      interactiveId: number;
      newSlides: number[];
    }) {
      return dispatch({
        type: 'SET_DISPLAYED_SLIDES',
        interactiveId,
        newSlides
      });
    },
    onSetSlideState({
      interactiveId,
      slideId,
      newState
    }: {
      interactiveId: number;
      slideId: number;
      newState: object;
    }) {
      return dispatch({
        type: 'SET_SLIDE_STATE',
        interactiveId,
        slideId,
        newState
      });
    }
  };
}
