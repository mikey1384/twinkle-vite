export default function BuildReducer(
  state: any,
  action: {
    type: string;
    [key: string]: any;
  }
) {
  switch (action.type) {
    case 'SET_FILE_STRUCTURE':
      return { ...state, fileStructure: action.fileStructure };
    case 'SET_FILE_CONTENTS':
      return {
        ...state,
        fileContents: {
          ...state.fileContents,
          ...action.fileContents
        }
      };
    case 'SET_IS_PROJECT_SCREEN_SHOWN':
      return { ...state, isProjectScreenShown: action.isProjectScreenShown };
    case 'SET_CURRENT_FILE':
      return { ...state, currentFile: action.currentFile };
    case 'SET_CURRENT_FILE_CONTENT':
      return { ...state, currentFileContent: action.currentFileContent };
    case 'SET_COMPILED_CODE':
      return { ...state, compiledCode: action.compiledCode };
    case 'ADD_CHAT_MESSAGE':
      return {
        ...state,
        chatMessages: [...state.chatMessages, action.message]
      };
    case 'SET_COMPILED_HTML':
      return { ...state, compiledHtml: action.compiledHtml };
    case 'SET_COMPILED_JS':
      return { ...state, compiledJs: action.compiledJs };
    case 'SET_IS_INITIAL_LOAD':
      return { ...state, isInitialLoad: action.isInitialLoad };
    case 'SET_IS_PROJECT_LOADED':
      return { ...state, isProjectLoaded: action.isLoaded };
    default:
      return state;
  }
}
