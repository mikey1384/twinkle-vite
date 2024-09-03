import React, { useState, useEffect } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { useAppContext, useBuildContext } from '~/contexts';
import DraggableWindow from './DraggableWindow';
import { mobileMaxWidth } from '~/constants/css';
import CodeEditor from './CodeEditor';
import FileDirectory from './FileDirectory';

export default function Build() {
  const [isFileDirectoryVisible, setIsFileDirectoryVisible] = useState(false);

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
    if (currentFile && fileContents[currentFile]) {
      onSetCurrentFileContent({
        currentFileContent: fileContents[currentFile]
      });
      handleRunSimulation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFile, currentFileContent]);

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
          height: 100vh;
          overflow: hidden;
          display: flex;

          @media (max-width: ${mobileMaxWidth}) {
            flex-direction: column;
          }
        `}
      >
        <FileDirectory
          isVisible={isFileDirectoryVisible}
          onMouseLeave={handleMouseLeave}
          fileStructure={fileStructure}
          onFileSelect={handleFileSelect}
          currentFile={currentFile}
        />
        <div
          className={css`
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            margin-left: ${isFileDirectoryVisible ? '250px' : '20px'};
            transition: margin-left 0.3s ease-in-out;
          `}
        >
          {currentFileContent && (
            <CodeEditor
              code={currentFileContent}
              onCodeChange={handleCodeChange}
            />
          )}
          <button onClick={handleRunSimulation}>Run Simulation</button>
        </div>
        <div
          className={css`
            width: 50%;
            border-left: 1px solid #ccc;
            padding: 1rem;
            overflow: auto;

            @media (max-width: ${mobileMaxWidth}) {
              width: 100%;
              border-left: none;
              border-top: 1px solid #ccc;
            }
          `}
        >
          <h2>Simulator Output</h2>
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
            style={{ width: '100%', height: '400px', border: 'none' }}
          />
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
