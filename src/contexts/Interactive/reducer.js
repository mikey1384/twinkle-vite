export default function InteractiveReducer(state, action) {
  switch (action.type) {
    case 'ADD_NEW_INTERACTIVE_SLIDE': {
      let newLastFork;
      if (action.lastFork) {
        const { selectedForkButtonId, paths } = action.lastFork;
        newLastFork = {
          ...action.lastFork,
          paths: {
            ...paths,
            [selectedForkButtonId]: paths[selectedForkButtonId].concat([
              action.slide.id
            ])
          }
        };
      }
      return {
        ...state,
        [action.interactiveId]: {
          ...state[action.interactiveId],
          displayedSlideIds: state[action.interactiveId].displayedSlideIds
            .concat([action.slide.id])
            .filter((slideId) => {
              const slide = state[action.interactiveId].slideObj[slideId];
              return !(slide?.isFork && slide?.isDeleted);
            }),
          slideObj: {
            ...state[action.interactiveId].slideObj,
            ...(newLastFork
              ? {
                  [action.lastFork.id]: newLastFork
                }
              : {}),
            [action.slide.id]: {
              ...action.slide,
              ...(action.lastFork ? { forkedFrom: action.lastFork.id } : {})
            }
          }
        }
      };
    }
    case 'ARCHIVE_SLIDE': {
      return {
        [action.interactiveId]: {
          ...state[action.interactiveId],
          archivedSlideIds: state[action.interactiveId].archivedSlideIds.concat(
            [action.slideId]
          ),
          displayedSlideIds: state[
            action.interactiveId
          ].displayedSlideIds.filter((slideId) => {
            return slideId !== action.slideId;
          })
        }
      };
    }
    case 'CHANGE_NUM_UPDATES': {
      return {
        [action.interactiveId]: {
          ...state[action.interactiveId],
          numUpdates: action.numUpdates
        }
      };
    }
    case 'GO_BACK': {
      const newDisplayedSlideIds = [
        ...state[action.interactiveId].displayedSlideIds
      ];
      const forkIndex = newDisplayedSlideIds.indexOf(action.forkId);
      newDisplayedSlideIds.length = forkIndex + 1;
      const newSlideObj = { ...state[action.interactiveId].slideObj };
      for (let key of Object.keys(newSlideObj)) {
        if (
          !newDisplayedSlideIds.includes(Number(key)) ||
          Number(key) === action.forkId
        ) {
          newSlideObj[key].selectedForkButtonId = null;
        }
      }
      return {
        [action.interactiveId]: {
          ...state[action.interactiveId],
          displayedSlideIds: newDisplayedSlideIds,
          slideObj: newSlideObj
        }
      };
    }
    case 'INSERT_INTERACTIVE_SLIDE': {
      const newDisplayedSlideIds = [
        ...state[action.interactiveId].displayedSlideIds
      ];
      const index = newDisplayedSlideIds.indexOf(action.slideId);
      newDisplayedSlideIds.splice(index, 0, action.newSlide.id);
      let newLastFork;
      if (action.forkedFrom) {
        const lastFork =
          state[action.interactiveId].slideObj[action.forkedFrom];
        const { selectedForkButtonId, paths } = lastFork;
        let newPath = [...lastFork.paths[selectedForkButtonId]];
        const index = newPath.indexOf(action.slideId);
        newPath.splice(index, 0, action.newSlide.id);
        newLastFork = {
          ...lastFork,
          paths: {
            ...paths,
            [selectedForkButtonId]: newPath
          }
        };
      }
      return {
        ...state,
        [action.interactiveId]: {
          ...state[action.interactiveId],
          displayedSlideIds: newDisplayedSlideIds,
          slideObj: {
            ...state[action.interactiveId].slideObj,
            ...(newLastFork
              ? {
                  [newLastFork.id]: newLastFork
                }
              : {}),
            [action.newSlide.id]: action.newSlide
          }
        }
      };
    }
    case 'LOAD_INTERACTIVE': {
      return {
        ...state,
        [action.interactive.id]: action.interactive
      };
    }
    case 'CONCAT_DISPLAYED_SLIDES': {
      return {
        ...state,
        [action.interactiveId]: {
          ...state[action.interactiveId],
          displayedSlideIds: state[action.interactiveId].displayedSlideIds
            .concat(action.newSlides)
            .filter((slideId) => {
              const slide = state[action.interactiveId].slideObj[slideId];
              return !(slide?.isFork && slide?.isDeleted);
            })
        }
      };
    }
    case 'MOVE_INTERACTIVE_SLIDE': {
      const { displayedSlideIds } = state[action.interactiveId];
      const index = displayedSlideIds.indexOf(action.slideId);
      const newDisplayedSlideIds = [...displayedSlideIds];
      if (action.direction === 'up') {
        const prevSlideId = displayedSlideIds[index - 1];
        newDisplayedSlideIds[index - 1] = action.slideId;
        newDisplayedSlideIds[index] = prevSlideId;
      } else {
        const nextSlideId = displayedSlideIds[index + 1];
        newDisplayedSlideIds[index] = nextSlideId;
        newDisplayedSlideIds[index + 1] = action.slideId;
      }
      return {
        ...state,
        [action.interactiveId]: {
          ...state[action.interactiveId],
          displayedSlideIds: newDisplayedSlideIds
        }
      };
    }
    case 'PUBLISH_INTERACTIVE': {
      return {
        ...state,
        [action.interactiveId]: {
          ...state[action.interactiveId],
          isPublished: true,
          numUpdates: action.numUpdates
        }
      };
    }
    case 'RECOVER_ARCHIVED_SLIDE': {
      let newForkSlide;
      if (action.forkedFrom) {
        const forkSlide =
          state[action.interactiveId].slideObj[action.forkedFrom];
        const { selectedForkButtonId, paths } = forkSlide;
        const newPath = forkSlide.paths[selectedForkButtonId].concat([
          action.slideId
        ]);
        newForkSlide = {
          ...forkSlide,
          paths: {
            ...paths,
            [selectedForkButtonId]: newPath
          }
        };
      }
      return {
        ...state,
        [action.interactiveId]: {
          ...state[action.interactiveId],
          archivedSlideIds: state[action.interactiveId].archivedSlideIds.filter(
            (slideId) => slideId !== action.slideId
          ),
          slideObj: {
            ...state[action.interactiveId].slideObj,
            ...(newForkSlide
              ? {
                  [action.forkedFrom]: newForkSlide
                }
              : {})
          }
        }
      };
    }
    case 'REMOVE_INTERACTIVE_SLIDE': {
      return {
        [action.interactiveId]: {
          ...state[action.interactiveId],
          displayedSlideIds: state[
            action.interactiveId
          ].displayedSlideIds.filter((slideId) => {
            return slideId !== action.slideId;
          })
        }
      };
    }
    case 'SET_DISPLAYED_SLIDES': {
      return {
        ...state,
        [action.interactiveId]: {
          ...state[action.interactiveId],
          displayedSlideIds: action.newSlides
        }
      };
    }
    case 'SET_SLIDE_STATE': {
      return {
        ...state,
        [action.interactiveId]: {
          ...state[action.interactiveId],
          slideObj: {
            ...state[action.interactiveId].slideObj,
            [action.slideId]: {
              ...state[action.interactiveId].slideObj[action.slideId],
              ...action.newState
            }
          }
        }
      };
    }
    default:
      return state;
  }
}
