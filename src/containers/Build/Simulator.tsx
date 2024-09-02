import React, { useState } from 'react';
import { css } from '@emotion/css';
import { useAppContext } from '~/contexts';

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
      `}
    >
      <h2>Simulator</h2>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Enter your code here"
      />
      <button onClick={handleRunSimulation}>Run Simulation</button>
      <div>
        <h3>Result:</h3>
        <pre>{result}</pre>
      </div>
    </div>
  );
}
