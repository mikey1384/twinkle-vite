import { Dispatch } from '~/types';

export default function BuildActions(dispatch: Dispatch) {
  return {
    setFileStructure(fileStructure: any[]) {
      dispatch({ type: 'SET_FILE_STRUCTURE', payload: fileStructure });
    },
    setFileContents(fileContents: Record<string, string>) {
      dispatch({ type: 'SET_FILE_CONTENTS', payload: fileContents });
    },
    setCurrentFile(currentFile: string | null) {
      dispatch({ type: 'SET_CURRENT_FILE', payload: currentFile });
    },
    setCompiledCode(compiledCode: string) {
      dispatch({ type: 'SET_COMPILED_CODE', payload: compiledCode });
    },
    addChatMessage(message: { role: string; content: string }) {
      dispatch({ type: 'ADD_CHAT_MESSAGE', payload: message });
    }
  };
}
