import React, { useState, useEffect } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { useAppContext, useBuildContext } from '~/contexts';
import DraggableWindow from './DraggableWindow';
import { mobileMaxWidth } from '~/constants/css';
import CodeEditor from './CodeEditor';
import Icon from '~/components/Icon';
import FileDirectory from './FileDirectory';

export default function Build() {
  const [isFileDirectoryVisible, setIsFileDirectoryVisible] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const runSimulation = useAppContext((v) => v.requestHelpers.runSimulation);
  const fetchSampleCode = useAppContext(
    (v) => v.requestHelpers.fetchSampleCode
  );

  const currentFileContent = useBuildContext((v) => v.state.currentFileContent);
  const fileStructure = useBuildContext((v) => v.state.fileStructure);
  const fileContents = useBuildContext((v) => v.state.fileContents);
  const currentFile = useBuildContext((v) => v.state.currentFile);
  const isLoaded = useBuildContext((v) => v.state.isLoaded);
  const compiledCode = useBuildContext((v) => v.state.compiledCode);
  const chatMessages = useBuildContext((v) => v.state.chatMessages);

  const onSetCurrentFileContent = useBuildContext(
    (v) => v.actions.onSetCurrentFileContent
  );
  const onSetFileStructure = useBuildContext(
    (v) => v.actions.onSetFileStructure
  );
  const onSetIsLoaded = useBuildContext((v) => v.actions.onSetIsLoaded);
  const onSetFileContents = useBuildContext((v) => v.actions.onSetFileContents);
  const onSetCurrentFile = useBuildContext((v) => v.actions.onSetCurrentFile);
  const onSetCompiledCode = useBuildContext((v) => v.actions.onSetCompiledCode);
  const onAddChatMessage = useBuildContext((v) => v.actions.onAddChatMessage);

  useEffect(() => {
    if (!isLoaded) {
      loadSampleCode();
    }

    async function loadSampleCode() {
      try {
        const { fileContents, fileStructure } = await fetchSampleCode();
        onSetFileStructure({ fileStructure });
        onSetFileContents({ fileContents });

        const rootFile = determineRootFile(fileContents);
        onSetCurrentFile({ currentFile: rootFile });

        if (fileContents[rootFile]) {
          onSetCurrentFileContent({
            currentFileContent: fileContents[rootFile]
          });
          handleRunSimulation();
        } else {
          console.error(`${rootFile} not found in file contents`);
          const firstFile = Object.keys(fileContents)[0];
          onSetCurrentFile({ currentFile: firstFile });
          onSetCurrentFileContent({
            currentFileContent: fileContents[firstFile] || ''
          });
        }
      } catch (error) {
        console.error('Error loading sample code:', error);
      } finally {
        onSetIsLoaded({ isLoaded: true });
        setIsInitialLoad(false);
      }

      function determineRootFile(fileContents: Record<string, string>): string {
        const topLevelFiles = Object.keys(fileContents).filter(
          (file) => !file.includes('/') && file.endsWith('.tsx')
        );

        if (topLevelFiles.includes('index.tsx')) {
          return 'index.tsx';
        }

        if (topLevelFiles.includes('App.tsx')) {
          return 'App.tsx';
        }

        if (topLevelFiles.length > 0) {
          return topLevelFiles[0];
        }

        return Object.keys(fileContents)[0];
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentFile && fileContents[currentFile] && !isInitialLoad) {
      onSetCurrentFileContent({
        currentFileContent: fileContents[currentFile]
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFile, fileContents, isInitialLoad]);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <ErrorBoundary componentPath="Build/index">
      <div
        className={css`
          width: 100%;
          height: 100%;
          overflow: hidden;
          display: grid;
          grid-template-columns: auto 1fr 1fr;
          grid-template-rows: 1fr;
          grid-template-areas: 'filedirectory editor simulator';

          @media (max-width: ${mobileMaxWidth}) {
            grid-template-columns: 1fr;
            grid-template-rows: auto 1fr auto;
            grid-template-areas:
              'filedirectory'
              'editor'
              'simulator';
          }
        `}
      >
        <FileDirectory
          isVisible={isFileDirectoryVisible}
          onMouseLeave={handleMouseLeave}
          fileStructure={fileStructure}
          onFileSelect={handleFileSelect}
          currentFile={currentFile}
          className={css`
            grid-area: filedirectory;
            width: ${isFileDirectoryVisible ? '250px' : '20px'};
            transition: width 0.3s ease-in-out;
          `}
        />
        <div
          className={css`
            grid-area: editor;
            overflow: hidden;
          `}
        >
          {currentFileContent && (
            <CodeEditor
              code={currentFileContent}
              onCodeChange={handleCodeChange}
            />
          )}
        </div>
        <div
          className={css`
            grid-area: simulator;
            display: flex;
            flex-direction: column;
            border-left: 1px solid #ccc;
            background-color: #f0f0f0;
            overflow: hidden;

            @media (max-width: ${mobileMaxWidth}) {
              border-left: none;
              border-top: 1px solid #ccc;
            }
          `}
        >
          <div
            className={css`
              padding: 1rem;
              border-bottom: 1px solid #e0e0e0;
              background-color: #f8f9fa;
              display: flex;
              justify-content: space-between;
              align-items: center;
            `}
          >
            <h2
              className={css`
                margin: 0;
                font-size: 1.2rem;
                color: #333;
              `}
            >
              Simulator
            </h2>
            <button
              onClick={handleRunSimulation}
              className={css`
                padding: 8px 16px;
                background-color: #4caf50;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                transition: background-color 0.3s;

                &:hover {
                  background-color: #45a049;
                }
              `}
            >
              <Icon icon="play" />
              <span
                className={css`
                  margin-left: 0.7rem;
                `}
              >
                Run
              </span>
            </button>
          </div>
          <div
            className={css`
              flex-grow: 1;
              display: flex;
              flex-direction: column;
              padding: 1rem;
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
                srcDoc={`
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <script src="https://unpkg.com/react@17/umd/react.development.js"></script>
                      <script src="https://unpkg.com/react-dom@17/umd/react-dom.development.js"></script>
                    </head>
                    <body>
                      <div id="root"></div>
                      <script>
                        ${compiledCode}
                        ReactDOM.render(React.createElement(window.App), document.getElementById('root'));
                      </script>
                    </body>
                  </html>
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
      <DraggableWindow
        initialPosition={{ x: Math.max(0, window.innerWidth - 320), y: 70 }}
        onSendMessage={handleSendMessage}
      >
        <div
          className={css`
            display: flex;
            flex-direction: column;
            gap: 8px;
          `}
        >
          {chatMessages.map((message: any, index: number) => (
            <div
              key={index}
              className={css`
                padding: 8px;
                border-radius: 4px;
                background-color: ${message.role === 'user'
                  ? '#e6f2ff'
                  : '#f0f0f0'};
                align-self: ${message.role === 'user'
                  ? 'flex-end'
                  : 'flex-start'};
                max-width: 80%;
              `}
            >
              {message.content}
            </div>
          ))}
        </div>
      </DraggableWindow>
    </ErrorBoundary>
  );

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

  async function handleRunSimulation() {
    try {
      const { compiledCode } = await runSimulation(fileContents);
      onSetCompiledCode({ compiledCode });
    } catch (error) {
      console.error('Error running simulation:', error);
      onSetCompiledCode({ compiledCode: 'Error compiling React component' });
    }
  }

  function handleSendMessage(message: string) {
    onAddChatMessage({ message: { role: 'user', content: message } });
    onAddChatMessage({
      message: {
        role: 'assistant',
        content:
          'This is a placeholder response. Implement actual AI response logic here.'
      }
    });
  }

  function handleMouseMove(e: MouseEvent) {
    if (e.clientX <= 20) {
      setIsFileDirectoryVisible(true);
    }
  }

  function handleMouseLeave() {
    setIsFileDirectoryVisible(false);
  }
}
