export default function BuildReducer(
  state: any,
  action: {
    type: string;
    [key: string]: any;
  }
) {
  switch (action.type) {
    case 'SET_FILE_STRUCTURE':
      return { ...state, fileStructure: action.payload };
    case 'SET_FILE_CONTENTS':
      return { ...state, fileContents: action.payload };
    case 'SET_CURRENT_FILE':
      return { ...state, currentFile: action.payload };
    case 'SET_COMPILED_CODE':
      return { ...state, compiledCode: action.payload };
    case 'ADD_CHAT_MESSAGE':
      return {
        ...state,
        chatMessages: [...state.chatMessages, action.payload]
      };
    case 'SET_IS_LOADED':
      return { ...state, isLoaded: action.payload };
    default:
      return state;
  }
}
