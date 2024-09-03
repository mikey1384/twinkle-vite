import { Dispatch } from '~/types';

export default function BuildActions(dispatch: Dispatch) {
  return {
    onSetFileStructure(fileStructure: any[]) {
      dispatch({ type: 'SET_FILE_STRUCTURE', payload: fileStructure });
    },
    onSetFileContents(fileContents: Record<string, string>) {
      dispatch({ type: 'SET_FILE_CONTENTS', payload: fileContents });
    },
    onSetCurrentFile(currentFile: string | null) {
      dispatch({ type: 'SET_CURRENT_FILE', payload: currentFile });
    },
    onSetCompiledCode(compiledCode: string) {
      dispatch({ type: 'SET_COMPILED_CODE', payload: compiledCode });
    },
    onAddChatMessage(message: { role: string; content: string }) {
      dispatch({ type: 'ADD_CHAT_MESSAGE', payload: message });
    },
    onSetIsLoaded(isLoaded: boolean) {
      dispatch({ type: 'SET_IS_LOADED', payload: isLoaded });
    }
  };
}
