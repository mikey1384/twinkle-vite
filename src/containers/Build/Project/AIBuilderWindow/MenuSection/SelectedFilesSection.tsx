import React from 'react';
import { css } from '@emotion/css';

export default function SelectedFilesSection() {
  const handleSelectFiles = () => {
    // Your file selection logic here
  };

  return (
    <div
      className={css`
        margin-bottom: 16px;
      `}
    >
      <h3>Selected Files</h3>
      <ul>
        <li>src/components/Header.tsx</li>
        <li>src/utils/helpers.ts</li>
      </ul>
      <button
        onClick={handleSelectFiles}
        className={css`
          padding: 5px 10px;
          background-color: #6c757d;
          color: #fff;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
        `}
      >
        Select Files
      </button>
    </div>
  );
}
