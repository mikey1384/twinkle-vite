import React, { useState, useRef, useEffect } from 'react';
import { css } from '@emotion/css';
import { useAppContext } from '~/contexts';
import { mobileMaxWidth } from '~/constants/css';

export default function Simulator() {
  const [code, setCode] = useState('');
  const [compiledCode, setCompiledCode] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const runSimulation = useAppContext((v) => v.requestHelpers.runSimulation);

  const handleRunSimulation = async () => {
    try {
      const data = await runSimulation(code);
      if (data.success) {
        setCompiledCode(data.compiledCode);
      } else {
        console.error(data.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Error running simulation:', error);
    }
  };

  useEffect(() => {
    if (compiledCode && iframeRef.current) {
      const iframe = iframeRef.current;
      const iframeDoc =
        iframe.contentDocument || iframe.contentWindow?.document;

      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(`
          <html>
            <head>
              <script src="https://unpkg.com/react@17/umd/react.development.js"></script>
              <script src="https://unpkg.com/react-dom@17/umd/react-dom.development.js"></script>
            </head>
            <body>
              <div id="root"></div>
              <script>${compiledCode}</script>
            </body>
          </html>
        `);
        iframeDoc.close();
      }
    }
  }, [compiledCode]);

  return (
    <div
      className={css`
        height: 100%;
        padding: 20px;
        overflow: auto;
        position: absolute;
        top: 5rem;
        left: 0;
        right: 0;
        bottom: 0;

        @media (max-width: ${mobileMaxWidth}) {
          top: 0;
          bottom: 7rem;
        }
      `}
    >
      <h2>Simulator</h2>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Enter your code here"
        className={css`
          width: 100%;
          height: 200px;
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
          font-size: 14px;
          line-height: 1.4; // Adjusted line height
          padding: 10px;
          margin-bottom: 10px;
        `}
      />
      <button onClick={handleRunSimulation}>Run Simulation</button>
      <div>
        <h3>Result:</h3>
        <iframe
          ref={iframeRef}
          className={css`
            width: 100%;
            height: 300px;
            border: 1px solid #ccc;
          `}
        />
      </div>
    </div>
  );
}
