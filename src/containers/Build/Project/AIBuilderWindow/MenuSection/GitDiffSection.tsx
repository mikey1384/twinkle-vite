import React, { useState } from 'react';
import { css } from '@emotion/css';

export default function GitDiffSection() {
  const [selectedFile, setSelectedFile] = useState('App.tsx');
  const updatedFiles = ['App.tsx', 'Header.tsx', 'styles.css'];

  return (
    <div
      className={css`
        flex: 1;
        display: flex;
        margin-bottom: 16px;
        border: 1px solid #dee2e6;
      `}
    >
      {/* Updated Files Side Menu */}
      <div
        className={css`
          width: 200px;
          border-right: 1px solid #dee2e6;
          overflow-y: auto;
        `}
      >
        <h3
          className={css`
            padding: 8px;
            margin: 0;
            background-color: #e9ecef;
          `}
        >
          Updated Files
        </h3>
        <ul
          className={css`
            list-style-type: none;
            padding: 0;
            margin: 0;
          `}
        >
          {updatedFiles.map((file) => (
            <li
              key={file}
              onClick={() => setSelectedFile(file)}
              className={css`
                padding: 8px;
                cursor: pointer;
                background-color: ${file === selectedFile
                  ? '#e9ecef'
                  : 'transparent'};
                &:hover {
                  background-color: #e9ecef;
                }
              `}
            >
              {file}
            </li>
          ))}
        </ul>
      </div>
      {/* Git Diff Content */}
      <div
        className={css`
          flex: 1;
          overflow-y: auto;
          padding: 8px;
        `}
      >
        <h3>Git Diff: {selectedFile}</h3>
        <pre>
          {`- const oldValue = 5;
+ const newValue = 10;

- console.log("Old value:", oldValue);
+ console.log("New value:", newValue);`}
        </pre>
      </div>
    </div>
  );
}
