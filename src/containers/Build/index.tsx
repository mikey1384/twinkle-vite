import React, { useState, useEffect, useCallback } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { Highlight, themes } from 'prism-react-renderer';
import { useAppContext } from '~/contexts';
import DraggableWindow from './DraggableWindow';

const boilerplateCode = `
import React, { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', textAlign: 'center', padding: '20px' }}>
      <h1>Welcome to Vite + React!</h1>
      <p>This is a more complex example with state management.</p>
      <div>
        <p>You clicked the button {count} times.</p>
        <button onClick={() => setCount(count + 1)}>
          Click me
        </button>
      </div>
      <p>Edit this code and see it update in real-time.</p>
    </div>
  );
}
`.trim();

export default function Build() {
  const [code, setCode] = useState(boilerplateCode);
  const [compiledCode, setCompiledCode] = useState('');
  const runSimulation = useAppContext((v) => v.requestHelpers.runSimulation);

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

  return (
    <ErrorBoundary componentPath="Build/index">
      <div
        className={css`
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          overflow: hidden;
          display: flex;
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
                font-family: monospace;
                font-size: 14px;
                resize: none;
                background: transparent;
                color: transparent;
                caret-color: white;
                z-index: 2;
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
                    pointerEvents: 'none'
                  }}
                >
                  {tokens.map((line, i) => {
                    const lineProps = getLineProps({ line, key: i });
                    delete lineProps.key;
                    return (
                      <div key={i} {...lineProps}>
                        {line.map((token, key) => {
                          const tokenProps = getTokenProps({ token, key });
                          delete tokenProps.key;
                          return <span key={key} {...tokenProps} />;
                        })}
                      </div>
                    );
                  })}
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
      />
    </ErrorBoundary>
  );
}
