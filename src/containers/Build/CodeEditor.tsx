import React from 'react';
import { css } from '@emotion/css';

const CodeEditor: React.FC = () => {
  return (
    <div
      className={css`
        flex: 1;
        height: 100%;
        background-color: #1e1e1e;
        color: #d4d4d4;
        padding: 1rem;
      `}
    >
      {/* Implement your code editor here */}
      <textarea
        className={css`
          width: 100%;
          height: 100%;
          background-color: transparent;
          color: inherit;
          border: none;
          resize: none;
          font-family: monospace;
          font-size: 14px;
          outline: none;
        `}
        placeholder="Enter your code here..."
      />
    </div>
  );
};

export default CodeEditor;
