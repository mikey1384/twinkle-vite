import React, { useState, useEffect, useRef } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { useBuildContext } from '~/contexts';
import AIBuilderWindow from './AIBuilderWindow';
import { mobileMaxWidth } from '~/constants/css';
import CodeEditor from './CodeEditor';
import Icon from '~/components/Icon';
import FileDirectory from './FileDirectory';
import { socket } from '~/constants/sockets/compiler';

export default function Project({
  onSetIsBuildScreenShown
}: {
  onSetIsBuildScreenShown: (isBuildScreenShown: boolean) => void;
}) {
  const [isMouseOverArea, setIsMouseOverArea] = useState(false);
  const hasMountedRef = useRef(false);

  // Build context state
  const chatMessages = useBuildContext((v) => v.state.chatMessages);
  const currentFile = useBuildContext((v) => v.state.currentFile);
  const currentFileContent = useBuildContext((v) => v.state.currentFileContent);
  const fileContents = useBuildContext((v) => v.state.fileContents);
  const fileStructure = useBuildContext((v) => v.state.fileStructure);
  const projectType = useBuildContext((v) => v.state.projectType);

  // Build context actions
  const onSetIsProjectLoaded = useBuildContext(
    (v) => v.actions.onSetIsProjectLoaded
  );
  const onSetCurrentFile = useBuildContext((v) => v.actions.onSetCurrentFile);
  const onSetFileStructure = useBuildContext(
    (v) => v.actions.onSetFileStructure
  );
  const onSetCurrentFileContent = useBuildContext(
    (v) => v.actions.onSetCurrentFileContent
  );
  const onSetFileContents = useBuildContext((v) => v.actions.onSetFileContents);
  const onSetOpenFolders = useBuildContext((v) => v.actions.onSetOpenFolders); // Added this line
  const onSetProjectId = useBuildContext((v) => v.actions.onSetProjectId);

  const projectId = useBuildContext((v) => v.state.projectId);
  const [devServerUrl, setDevServerUrl] = useState<string | null>(null);

  useEffect(() => {
    // Generate and set projectId if not already set
    if (!projectId) {
      const newProjectId = generateProjectId();
      onSetProjectId({ projectId: newProjectId });
    }
  }, [projectType, projectId, onSetProjectId]);

  useEffect(() => {
    setTimeout(() => {
      hasMountedRef.current = true;
    }, 500);

    return () => {
      hasMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!socket || !socket.connected || !projectId || !projectType) return;

    // Request boilerplate code from the server
    socket.emit('request_boilerplate', { projectId, projectType });

    function handleBoilerplateCode({
      files
    }: {
      files: Record<string, string>;
    }) {
      // Handle received boilerplate files
      onSetFileContents({ fileContents: files });
      const fileStructure = buildFileStructure(files);
      onSetFileStructure({ fileStructure });

      // Set the default file
      const defaultFile = 'src/index.tsx';
      if (files[defaultFile]) {
        onSetCurrentFile({ currentFile: defaultFile });
      } else {
        const firstFile = Object.keys(files)[0];
        onSetCurrentFile({ currentFile: firstFile });
      }

      // Set the open folders (added this)
      const initialOpenFolders = new Set<string>();
      Object.keys(files).forEach((filePath) => {
        const parts = filePath.split('/');
        parts.pop(); // Remove the file name
        let path = '';
        parts.forEach((part) => {
          path = path ? `${path}/${part}` : part;
          initialOpenFolders.add(path);
        });
      });
      onSetOpenFolders({ openFolders: initialOpenFolders });

      onSetIsProjectLoaded({ isLoaded: true });
    }

    function handleBoilerplateError({
      projectId,
      error
    }: {
      projectId: string;
      error: string;
    }) {
      console.error(
        `Error receiving boilerplate for project ${projectId}:`,
        error
      );
    }

    function handleDevSessionReady({ url }: { url: string }) {
      setDevServerUrl(url);
      console.log(`Dev server ready at ${url}`);
    }

    function handleCodeChangeAck({ filePath }: { filePath: string }) {
      console.log(`Code change acknowledged for ${filePath}`);
    }

    function handleCodeChangeError({
      projectId,
      error
    }: {
      projectId: string;
      error: string;
    }) {
      console.error(`Error updating code for project ${projectId}:`, error);
    }

    socket.on('boilerplate_code', handleBoilerplateCode);
    socket.on('boilerplate_error', handleBoilerplateError);
    socket.on('dev_session_ready', handleDevSessionReady);
    socket.on('code_change_ack', handleCodeChangeAck);
    socket.on('code_change_error', handleCodeChangeError);

    // Cleanup event listeners on unmount
    return () => {
      socket.off('boilerplate_code', handleBoilerplateCode);
      socket.off('boilerplate_error', handleBoilerplateError);
      socket.off('dev_session_ready', handleDevSessionReady);
      socket.off('code_change_ack', handleCodeChangeAck);
      socket.off('code_change_error', handleCodeChangeError);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, projectId, projectType]);

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
            {currentFileContent !== null && currentFile && (
              <CodeEditor
                code={currentFileContent}
                onCodeChange={handleCodeChange}
                language={getLanguageFromFileName(currentFile || '')}
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
              {devServerUrl ? (
                <iframe
                  src={devServerUrl}
                  className={css`
                    width: 100%;
                    height: 100%;
                    border: none;
                    background-color: #fff;
                  `}
                />
              ) : (
                <p>Waiting for dev server...</p>
              )}
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
        return extension || 'plaintext';
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
        fileContents: { ...fileContents, [currentFile]: newCode }
      });
      if (socket && socket.connected) {
        socket.emit('code_change', {
          projectId,
          filePath: currentFile,
          content: newCode
        });
      }
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

  function generateProjectId() {
    return `project-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
}
