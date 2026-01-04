export default function MissionReducer(
  state: any,
  action: {
    type: string;
    [key: string]: any;
  }
) {
  switch (action.type) {
    case 'LOAD_MISSION': {
      if (!action.mission) {
        return state;
      }
      return {
        ...state,
        ...(action.prevUserId ? { prevUserId: action.prevUserId } : {}),
        missionObj: {
          ...state.missionObj,
          [action.mission.id]: {
            ...state.missionObj[action.mission.id],
            ...action.mission,
            prevUserId: action.prevUserId,
            tutorialId: action.mission.tutorialId || 0,
            loaded: true
          }
        }
      };
    }
    case 'LOAD_MISSION_TYPE_ID_HASH': {
      return {
        ...state,
        missionTypeIdHash: action.hash
      };
    }
    case 'LOAD_MISSION_LIST': {
      const newMissionObj = state.missionObj || {};
      for (const mission of action.missions) {
        newMissionObj[mission.id] = {
          ...newMissionObj[mission.id],
          ...mission,
          prevUserId: action.prevUserId,
          tutorialId: mission.tutorialId || 0
        };
      }
      const newMyAttempts = action.myAttempts;
      if (action.prevUserId === state.prevUserId) {
        for (const key in state.myAttempts) {
          if (newMyAttempts[key] && state.myAttempts[key]?.tryingAgain) {
            newMyAttempts[key].tryingAgain = true;
          }
        }
      }
      return {
        ...state,
        listLoaded: true,
        prevUserId: action.prevUserId,
        missions: action.missions.map(({ id }: { id: number }) => id),
        missionObj: newMissionObj,
        myAttempts: newMyAttempts,
        loadMoreButton: action.loadMoreButton
      };
    }
    case 'SET_MISSION_STATE': {
      return {
        ...state,
        missionObj: {
          ...state.missionObj,
          [action.missionId]: {
            ...state.missionObj[action.missionId],
            ...action.newState
          }
        }
      };
    }
    case 'RESET_SYSTEM_PROMPT_STATE_FOR_USER': {
      const mission = state.missionObj[action.missionId] || {};
      if (
        !action.userId ||
        !mission.prevUserId ||
        mission.prevUserId === action.userId
      ) {
        return state;
      }
      return {
        ...state,
        missionObj: {
          ...state.missionObj,
          [action.missionId]: {
            ...mission,
            prevUserId: action.userId,
            systemPromptState: {
              title: '',
              prompt: '',
              userMessage: '',
              chatMessages: [],
              missionPromptId: null,
              promptEverGenerated: false
            },
            systemPromptProgress: {}
          }
        }
      };
    }
    case 'SET_ATTEMPT_OBJ':
      return {
        ...state,
        attemptObj: {
          ...state.attemptObj,
          ...action.attemptObj
        }
      };
    case 'SET_MANAGEMENT_OBJ':
      return {
        ...state,
        managementObj: {
          ...state.managementObj,
          ...action.managementObj
        }
      };
    case 'SET_SELECTED_MANAGEMENT_TAB':
      return {
        ...state,
        selectedManagementTab: action.selectedTab
      };
    case 'SET_SELECTED_MISSIONS_TAB':
      return {
        ...state,
        selectedMissionsTab: action.selectedTab
      };
    case 'SET_SELECTED_MISSION_LIST_TAB':
      return {
        ...state,
        selectedMissionListTab: action.selectedTab
      };
    case 'SET_MISSION_ATTEMPT': {
      return {
        ...state,
        myAttempts: {
          ...state.myAttempts,
          [action.missionId]: action.attempt
        }
      };
    }
    case 'SET_MY_MISSION_ATTEMPTS':
      return {
        ...state,
        myAttempts: action.myAttempts
      };
    case 'UPDATE_MISSION_ATTEMPT': {
      return {
        ...state,
        myAttempts: {
          ...state.myAttempts,
          [action.missionId]: {
            ...state.myAttempts[action.missionId],
            ...action.newState
          }
        }
      };
    }
    case 'LOAD_SHARED_PROMPTS':
      return {
        ...state,
        sharedPrompts: action.prompts,
        sharedPromptsLoaded: true,
        sharedPromptsLoadMoreButton: action.loadMoreButton,
        sharedPromptsSortBy: action.sortBy
      };
    case 'LOAD_MORE_SHARED_PROMPTS':
      return {
        ...state,
        sharedPrompts: state.sharedPrompts.concat(action.prompts),
        sharedPromptsLoadMoreButton: action.loadMoreButton
      };
    case 'SET_SHARED_PROMPTS_SORT_BY':
      return {
        ...state,
        sharedPromptsSortBy: action.sortBy,
        sharedPromptsLoaded: false
      };
    case 'UPDATE_SHARED_PROMPT_CLONE':
      return {
        ...state,
        sharedPrompts: state.sharedPrompts.map((prompt: any) =>
          prompt.id === action.promptId || prompt.subjectId === action.promptId
            ? {
                ...prompt,
                cloneCount: (prompt.cloneCount || 0) + 1,
                myClones: [
                  ...(prompt.myClones || []),
                  {
                    target: action.target,
                    channelId: action.channelId,
                    topicId: action.topicId
                  }
                ]
              }
            : prompt
        )
      };
    case 'RESET_SHARED_PROMPTS':
      return {
        ...state,
        sharedPrompts: [],
        sharedPromptsLoaded: false,
        sharedPromptsLoadMoreButton: false
      };
    default:
      return state;
  }
}
