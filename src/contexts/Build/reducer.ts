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
    case 'SET_IS_LOADED':
      return { ...state, isLoaded: action.isLoaded };
    default:
      return state;
  }
}
