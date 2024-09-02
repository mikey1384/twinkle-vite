import React, { useState, useEffect, useCallback } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { Highlight, themes } from 'prism-react-renderer';
import { useAppContext } from '~/contexts';
import DraggableWindow from './DraggableWindow';
import { mobileMaxWidth } from '~/constants/css';

export default function Build() {
  const [code, setCode] = useState('');
  const [compiledCode, setCompiledCode] = useState('');
  const fetchSampleCode = useAppContext(
    (v) => v.requestHelpers.fetchSampleCode
  );
  const runSimulation = useAppContext((v) => v.requestHelpers.runSimulation);

  useEffect(() => {
    async function loadBoilerplateCode() {
      try {
        const boilerplateCode = await fetchSampleCode('boilerplate.tsx');
        setCode(boilerplateCode);
      } catch (error) {
        console.error('Error fetching boilerplate code:', error);
        setCode('// Error loading boilerplate code');
      }
    }
    loadBoilerplateCode();
  }, [fetchSampleCode]);

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

  return (
    <ErrorBoundary componentPath="Build/index">
      <div
        className={css`
          position: fixed;
          top: 4.5rem; // Add top padding to account for the header
          left: 0;
          right: 0;
          bottom: 0;
          overflow: hidden;
          display: flex;

          @media (max-width: ${mobileMaxWidth}) {
            top: 0;
            bottom: 7rem;
          }
        `}
      >
        <div
          className={css`
            flex: 1;
            display: flex;
            flex-direction: column;
          `}
        >
          <div
            className={css`
              flex: 1;
              position: relative;
              overflow: hidden;
              font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
              font-size: 14px;
              line-height: 1.5;
            `}
          >
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={css`
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                border: none;
                padding: 1rem;
                font-family: inherit;
                font-size: inherit;
                line-height: inherit;
                tab-size: 2;
                resize: none;
                background: transparent;
                color: transparent;
                caret-color: white;
                z-index: 2;
                white-space: pre;
                overflow-wrap: normal;
                overflow-x: auto;
              `}
            />
            <Highlight theme={themes.vsDark} code={code} language="jsx">
              {({ className, style, tokens, getLineProps, getTokenProps }) => (
                <pre
                  className={className}
                  style={{
                    ...style,
                    margin: 0,
                    padding: '1rem',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    overflow: 'auto',
                    pointerEvents: 'none',
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    lineHeight: 'inherit',
                    tabSize: 2,
                    whiteSpace: 'pre',
                    overflowWrap: 'normal',
                    overflowX: 'auto'
                  }}
                >
                  {tokens.map((line, i) => (
                    <div key={i} {...getLineProps({ line, key: i })}>
                      {line.map((token, key) => (
                        <span key={key} {...getTokenProps({ token, key })} />
                      ))}
                    </div>
                  ))}
                </pre>
              )}
            </Highlight>
          </div>
          <button onClick={handleRunSimulation}>Run Simulation</button>
        </div>
        <div
          className={css`
            width: 50%;
            border-left: 1px solid #ccc;
            padding: 1rem;
            overflow: auto;
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
        initialPosition={{ x: Math.max(0, window.innerWidth - 320), y: 20 }}
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
