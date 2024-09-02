import React, { useState, useEffect, useCallback } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { useAppContext } from '~/contexts';
import DraggableWindow from './DraggableWindow';
import { mobileMaxWidth } from '~/constants/css';
import CodeEditor from './CodeEditor';
import FileDirectory from './FileDirectory';

export default function Build() {
  const [code, setCode] = useState('');
  const [compiledCode, setCompiledCode] = useState('');
  const runSimulation = useAppContext((v) => v.requestHelpers.runSimulation);

  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
  }, []);

  const handleRunSimulation = useCallback(async () => {
    try {
      const { compiledCode } = await runSimulation(code);
      setCompiledCode(compiledCode);
    } catch (error) {
      console.error('Error running simulation:', error);
      setCompiledCode('Error compiling React component');
    }
  }, [code, runSimulation]);

  useEffect(() => {
    handleRunSimulation();
  }, [handleRunSimulation]);

  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! How can I assist you with your code today?'
    },
    { role: 'user', content: 'Can you help me optimize this React component?' },
    {
      role: 'assistant',
      content: `Certainly! I'd be happy to help you optimize your React component. Could you please share the component code you'd like me to review?`
    }
  ]);

  const handleSendMessage = useCallback((message: string) => {
    setChatMessages((prevMessages) => [
      ...prevMessages,
      { role: 'user', content: message },
      {
        role: 'assistant',
        content:
          'This is a placeholder response. Implement actual AI response logic here.'
      }
    ]);
  }, []);

  const [isFileDirectoryVisible, setIsFileDirectoryVisible] = useState(false);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (e.clientX <= 20) {
      setIsFileDirectoryVisible(true);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsFileDirectoryVisible(false);
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleMouseMove]);

  return (
    <ErrorBoundary componentPath="Build/index">
      <div
        className={css`
          height: 100%;
          width: 100%;
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
          <CodeEditor onCodeChange={handleCodeChange} />
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
          {chatMessages.map((message, index) => (
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
}
