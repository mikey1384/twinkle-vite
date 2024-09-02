import React, { useState } from 'react';
import { css } from '@emotion/css';
import { useAppContext } from '~/contexts';
import { mobileMaxWidth } from '~/constants/css';

export default function Simulator() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState('');
  const runSimulation = useAppContext((v) => v.requestHelpers.runSimulation);

  const handleRunSimulation = async () => {
    try {
      const data = await runSimulation(code);
      setResult(data.result);
    } catch (error) {
      console.error('Error running simulation:', error);
      setResult('Error running simulation');
    }
  };

  return (
    <div
      className={css`
        height: 100%;
        padding: 20px;
        overflow: auto;
        position: absolute;
        top: 5rem; // Increased top padding
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
        <pre>{result}</pre>
      </div>
    </div>
  );
}
