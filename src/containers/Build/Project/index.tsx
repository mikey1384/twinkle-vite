import React, { useState, useEffect, useRef } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { useAppContext, useBuildContext } from '~/contexts';
import AIBuilderWindow from './AIBuilderWindow';
import { mobileMaxWidth } from '~/constants/css';
import CodeEditor from './CodeEditor';
import Icon from '~/components/Icon';
import FileDirectory from './FileDirectory';

export default function Project({
  projectType,
  onSetIsBuildScreenShown
}: {
  projectType: string;
  onSetIsBuildScreenShown: (isBuildScreenShown: boolean) => void;
}) {
  const [isMouseOverArea, setIsMouseOverArea] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const hasMountedRef = useRef(false);

  // App context
  const initNewProject = useAppContext((v) => v.requestHelpers.initNewProject);

  // Build context state
  const chatMessages = useBuildContext((v) => v.state.chatMessages);
  const compiledHtml = useBuildContext((v) => v.state.compiledHtml);
  const compiledJs = useBuildContext((v) => v.state.compiledJs);
  const currentFile = useBuildContext((v) => v.state.currentFile);
  const currentFileContent = useBuildContext((v) => v.state.currentFileContent);
  const fileContents = useBuildContext((v) => v.state.fileContents);
  const fileStructure = useBuildContext((v) => v.state.fileStructure);
  const isInitialLoad = useBuildContext((v) => v.state.isInitialLoad);

  // Build context actions
  const onSetIsProjectLoaded = useBuildContext(
    (v) => v.actions.onSetIsProjectLoaded
  );
  const onSetCompiledHtml = useBuildContext((v) => v.actions.onSetCompiledHtml);
  const onSetCompiledJs = useBuildContext((v) => v.actions.onSetCompiledJs);
  const onSetCurrentFile = useBuildContext((v) => v.actions.onSetCurrentFile);
  const onSetFileStructure = useBuildContext(
    (v) => v.actions.onSetFileStructure
  );
  const onSetCurrentFileContent = useBuildContext(
    (v) => v.actions.onSetCurrentFileContent
  );
  const onSetFileContents = useBuildContext((v) => v.actions.onSetFileContents);
  const onSetIsInitialLoad = useBuildContext(
    (v) => v.actions.onSetIsInitialLoad
  );
  const onSetOpenFolders = useBuildContext((v) => v.actions.onSetOpenFolders);
  const onSetProjectId = useBuildContext((v) => v.actions.onSetProjectId);

  useEffect(() => {
    setTimeout(() => {
      hasMountedRef.current = true;
    }, 500);

    return () => {
      hasMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (isInitialLoad) {
      handleInitNewProject();
      onSetIsInitialLoad(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialLoad]);

  useEffect(() => {
    if (currentFile && fileContents[currentFile] && !isInitialLoad) {
      onSetCurrentFileContent({
        currentFileContent: fileContents[currentFile]
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFile, fileContents, isInitialLoad]);

  return (
    <ErrorBoundary componentPath="Build/Project/index">
      <div
        onMouseEnter={() => {
          if (hasMountedRef.current) {
            setIsMouseOverArea(true);
          }
        }}
        onMouseLeave={() => {
          if (hasMountedRef.current) {
            setIsMouseOverArea(false);
          }
        }}
        className={css`
          position: fixed;
          top: 0;
          left: 0;
          height: 100%;
          z-index: 1001;
          display: flex;
          flex-direction: column;
        `}
      >
        <button
          onClick={() => onSetIsBuildScreenShown(false)}
          className={css`
            background-color: #252526;
            border: none;
            color: #cccccc;
            font-size: 1.6rem;
            padding-right: 12px;
            cursor: pointer;
            display: flex;
            align-items: center;
            transition: width 0.3s ease, padding 0.3s ease;
            overflow: hidden;
            height: 48px;
            width: ${isMouseOverArea ? '250px' : '30px'};

            .go-back-text {
              opacity: ${isMouseOverArea ? '1' : '0'};
              overflow: hidden;
              white-space: nowrap;
              transition: opacity 0.3s ease, margin-left 0.3s ease;
              margin-left: ${isMouseOverArea ? '8px' : '0'};
            }

            @media (max-width: 480px) {
              font-size: 1.4rem;
              height: 40px;
            }
          `}
          aria-label="Go Back"
        >
          <Icon icon="arrow-left" />
          <span className="go-back-text">Main Menu</span>
        </button>

        <FileDirectory
          isVisible={isMouseOverArea}
          fileStructure={fileStructure}
          onFileSelect={handleFileSelect}
          currentFile={currentFile}
          className={css`
            height: 100%;
            width: ${isMouseOverArea ? '250px' : '20px'};
            transition: width 0.3s ease-in-out;

            @media (max-width: ${mobileMaxWidth}) {
              width: ${isMouseOverArea ? '80%' : '20px'};
            }
          `}
        />
      </div>

      <div
        className={css`
          width: 100%;
          height: 100%;
          overflow: hidden;
          display: grid;
          grid-template-columns: auto 1fr;
          grid-template-rows: 1fr;
          grid-template-areas: 'filedirectory main';

          @media (max-width: ${mobileMaxWidth}) {
            grid-template-columns: 1fr;
            grid-template-rows: auto 1fr;
            grid-template-areas:
              'filedirectory'
              'main';
          }
        `}
      >
        <div
          className={css`
            grid-area: main;
            display: flex;
            overflow: hidden;
          `}
        >
          <div
            className={css`
              flex: 1;
              display: flex;
              flex-direction: column;
              overflow: hidden;
            `}
          >
            {currentFileContent && (
              <CodeEditor
                code={currentFileContent}
                onCodeChange={handleCodeChange}
                language={getLanguageFromFileName(currentFile)}
              />
            )}
          </div>
          <div
            className={css`
              flex: 1;
              display: flex;
              flex-direction: column;
              overflow: hidden;
              background-color: #ffffff;
            `}
          >
            <div
              className={css`
                flex-grow: 1;
                border: 1px solid #e0e0e0;
                border-radius: 4px;
                overflow: hidden;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              `}
            >
              <iframe
                ref={iframeRef}
                sandbox="allow-scripts allow-same-origin"
                srcDoc={`
                  ${compiledHtml}
                  <script>${compiledJs}</script>
                `}
                className={css`
                  width: 100%;
                  height: 100%;
                  border: none;
                  background-color: #fff;
                `}
              />
            </div>
          </div>
        </div>
      </div>
      <AIBuilderWindow
        initialPosition={{ x: Math.max(0, window.innerWidth - 820), y: 70 }}
        chatMessages={chatMessages}
      />
    </ErrorBoundary>
  );

  function getLanguageFromFileName(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'json':
        return 'json';
      // Add more cases as needed
      default:
        return 'plaintext';
    }
  }

  function handleFileSelect(fileName: string) {
    onSetCurrentFile({ currentFile: fileName });
    if (fileContents[fileName]) {
      onSetCurrentFileContent({ currentFileContent: fileContents[fileName] });
    } else {
      console.error(`File content not found for ${fileName}`);
      onSetCurrentFileContent({ currentFileContent: '' });
    }
  }

  function handleCodeChange(newCode: string) {
    onSetCurrentFileContent({ currentFileContent: newCode });
    if (currentFile) {
      onSetFileContents({
        fileContents: { [currentFile]: newCode }
      });
    }
  }

  async function handleInitNewProject() {
    try {
      onSetCompiledHtml({ compiledHtml: '<p>Compiling...</p>' });
      onSetCompiledJs({ compiledJs: '' });
      const result = await initNewProject(projectType);

      if (
        result &&
        result.html &&
        result.bundleJs &&
        result.projectFiles &&
        result.projectId
      ) {
        onSetCompiledHtml({ compiledHtml: result.html });
        onSetCompiledJs({ compiledJs: result.bundleJs });
        onSetProjectId(result.projectId);

        onSetFileContents({ fileContents: result.projectFiles });
        const fileStructure = buildFileStructure(result.projectFiles);
        onSetFileStructure({ fileStructure });

        onSetOpenFolders({ openFolders: new Set(['src']) });

        const defaultFile = 'src/index.tsx';
        if (result.projectFiles[defaultFile]) {
          onSetCurrentFile({ currentFile: defaultFile });
        } else {
          const firstFile = Object.keys(result.projectFiles)[0];
          onSetCurrentFile({ currentFile: firstFile });
        }

        onSetIsProjectLoaded({ isLoaded: true });
      } else {
        console.error('Invalid compilation result:', result);
        throw new Error('Compilation result is invalid');
      }
    } catch (error: unknown) {
      onSetCompiledHtml({
        compiledHtml: `<p>Error compiling React component: ${
          error instanceof Error ? error.message : 'Unknown error'
        }</p>`
      });
      onSetCompiledJs({ compiledJs: '' });
    }
  }

  function buildFileStructure(fileContents: Record<string, string>) {
    const structure: any = { name: 'root', children: [], isFolder: true };

    Object.keys(fileContents).forEach((filePath) => {
      const content = fileContents[filePath];
      if (filePath === '') return;

      const parts = filePath.split('/').filter((part) => part !== '');
      let currentLevel = structure;

      parts.forEach((part, index) => {
        const isLastPart = index === parts.length - 1;
        let existing = currentLevel.children.find((c: any) => c.name === part);

        if (!existing) {
          const newItem = {
            name: part,
            children: [],
            isFolder: !isLastPart || !part.includes('.')
          };
          currentLevel.children.push(newItem);
          existing = newItem;
        }

        if (isLastPart && content.length > 0) {
          existing.isFolder = false;
          existing.children = [];
        }

        currentLevel = existing;
      });
    });

    // Function to sort children arrays
    function sortTree(node: any) {
      if (!node.children || node.children.length === 0) {
        return;
      }

      node.children.sort((a: any, b: any) => {
        // Folders first
        if (a.isFolder && !b.isFolder) return -1;
        if (!a.isFolder && b.isFolder) return 1;
        // Both are folders or both are files, sort alphabetically
        return a.name.localeCompare(b.name);
      });

      node.children.forEach(sortTree);
    }

    // Sort the tree starting from the root
    sortTree(structure);

    return structure.children;
  }
}
