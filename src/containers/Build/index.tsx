import React, { useState, useEffect } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { Highlight, themes } from 'prism-react-renderer';
import { useAppContext } from '~/contexts';
import DraggableWindow from './DraggableWindow';

const boilerplateCode = `
import React from 'react';

export default function App() {
  return (
    <div>
      <h1>Hello, Vite + React!</h1>
      <p>Edit this code and see it update in real-time.</p>
    </div>
  );
}
`.trim();

export default function Build() {
  const [code, setCode] = useState(boilerplateCode);
  const [compiledCode, setCompiledCode] = useState('');
  const runSimulation = useAppContext((v) => v.requestHelpers.runSimulation);

  useEffect(() => {
    handleRunSimulation();
  }, []);

  const handleRunSimulation = async () => {
    try {
      const { compiledCode } = await runSimulation(code);
      setCompiledCode(compiledCode);
    } catch (error) {
      console.error('Error running simulation:', error);
      setCompiledCode('Error compiling React component');
    }
  };

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
              <html>
                <body>
                  <div id="root"></div>
                  <script type="module">
                    import React from 'https://esm.sh/react';
                    import ReactDOM from 'https://esm.sh/react-dom';
                    ${compiledCode}
                    ReactDOM.render(React.createElement(App), document.getElementById('root'));
                  </script>
                </body>
              </html>
            `}
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        </div>
      </div>
      <DraggableWindow
        initialPosition={{ x: Math.max(0, window.innerWidth - 320), y: 20 }}
      />
    </ErrorBoundary>
  );
}
