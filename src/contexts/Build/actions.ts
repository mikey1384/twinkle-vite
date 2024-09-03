import { Dispatch } from '~/types';

export default function BuildActions(dispatch: Dispatch) {
  return {
    onSetFileStructure({ fileStructure }: { fileStructure: any[] }) {
      dispatch({ type: 'SET_FILE_STRUCTURE', fileStructure });
    },
    onSetFileContents({
      fileContents
    }: {
      fileContents: Record<string, string>;
    }) {
      dispatch({ type: 'SET_FILE_CONTENTS', fileContents });
    },
    onSetCurrentFile({ currentFile }: { currentFile: string | null }) {
      dispatch({ type: 'SET_CURRENT_FILE', currentFile });
    },
    onSetCompiledCode({ compiledCode }: { compiledCode: string }) {
      dispatch({ type: 'SET_COMPILED_CODE', compiledCode });
    },
    onAddChatMessage({
      message
    }: {
      message: { role: string; content: string };
    }) {
      dispatch({ type: 'ADD_CHAT_MESSAGE', message });
    },
    onSetIsLoaded({ isLoaded }: { isLoaded: boolean }) {
      dispatch({ type: 'SET_IS_LOADED', isLoaded });
    },
    onSetCurrentFileContent({
      currentFileContent
    }: {
      currentFileContent: string;
    }) {
      dispatch({ type: 'SET_CURRENT_FILE_CONTENT', currentFileContent });
    }
  };
}
