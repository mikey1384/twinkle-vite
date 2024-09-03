import React, { useState, useEffect } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { useAppContext, useBuildContext } from '~/contexts';
import DraggableWindow from './DraggableWindow';
import { mobileMaxWidth } from '~/constants/css';
import CodeEditor from './CodeEditor';
import FileDirectory from './FileDirectory';

export default function Build() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentFileContent, setCurrentFileContent] = useState('');
  const [isFileDirectoryVisible, setIsFileDirectoryVisible] = useState(false);

  const runSimulation = useAppContext((v) => v.requestHelpers.runSimulation);
  const fetchSampleCode = useAppContext(
    (v) => v.requestHelpers.fetchSampleCode
  );

  const fileStructure = useBuildContext((v) => v.state.fileStructure);
  const fileContents = useBuildContext((v) => v.state.fileContents);
  const currentFile = useBuildContext((v) => v.state.currentFile);
  const compiledCode = useBuildContext((v) => v.state.compiledCode);
  const chatMessages = useBuildContext((v) => v.state.chatMessages);

  const setFileStructure = useBuildContext((v) => v.actions.setFileStructure);
  const setFileContents = useBuildContext((v) => v.actions.setFileContents);
  const setCurrentFile = useBuildContext((v) => v.actions.setCurrentFile);
  const setCompiledCode = useBuildContext((v) => v.actions.setCompiledCode);
  const addChatMessage = useBuildContext((v) => v.actions.addChatMessage);

  useEffect(() => {
    loadSampleCode();

    async function loadSampleCode() {
      setIsLoading(true);
      try {
        const { fileContents, fileStructure } = await fetchSampleCode();
        setFileStructure(fileStructure);
        setFileContents(fileContents);

        const rootFile = determineRootFile(fileContents);
        setCurrentFile(rootFile);

        if (fileContents[rootFile]) {
          setCurrentFileContent(fileContents[rootFile]);
        } else {
          console.error(`${rootFile} not found in file contents`);
          const firstFile = Object.keys(fileContents)[0];
          setCurrentFile(firstFile);
          setCurrentFileContent(fileContents[firstFile] || '');
        }
      } catch (error) {
        console.error('Error loading sample code:', error);
      } finally {
        setIsLoading(false);
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
      setCurrentFileContent(fileContents[currentFile]);
      handleRunSimulation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFile]);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  if (isLoading) {
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
    setCurrentFile(fileName);
    if (fileContents[fileName]) {
      setCurrentFileContent(fileContents[fileName]);
    } else {
      console.error(`File content not found for ${fileName}`);
      setCurrentFileContent('');
    }
  }

  function handleCodeChange(newCode: string) {
    setCurrentFileContent(newCode);
    if (currentFile) {
      setFileContents((prev: any) => ({ ...prev, [currentFile]: newCode }));
    }
  }

  async function handleRunSimulation() {
    try {
      const { compiledCode } = await runSimulation(fileContents);
      setCompiledCode(compiledCode);
    } catch (error) {
      console.error('Error running simulation:', error);
      setCompiledCode('Error compiling React component');
    }
  }

  function handleSendMessage(message: string) {
    addChatMessage({ role: 'user', content: message });
    addChatMessage({
      role: 'assistant',
      content:
        'This is a placeholder response. Implement actual AI response logic here.'
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
