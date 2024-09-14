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
    onSetIsProjectScreenShown({
      isProjectScreenShown
    }: {
      isProjectScreenShown: boolean;
    }) {
      dispatch({ type: 'SET_IS_PROJECT_SCREEN_SHOWN', isProjectScreenShown });
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
    onSetCompiledHtml({ compiledHtml }: { compiledHtml: string }) {
      dispatch({ type: 'SET_COMPILED_HTML', compiledHtml });
    },
    onSetCompiledJs({ compiledJs }: { compiledJs: string }) {
      dispatch({ type: 'SET_COMPILED_JS', compiledJs });
    },
    onSetIsInitialLoad({ isInitialLoad }: { isInitialLoad: boolean }) {
      dispatch({ type: 'SET_IS_INITIAL_LOAD', isInitialLoad });
    },
    onSetIsProjectLoaded({ isLoaded }: { isLoaded: boolean }) {
      dispatch({ type: 'SET_IS_PROJECT_LOADED', isLoaded });
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
