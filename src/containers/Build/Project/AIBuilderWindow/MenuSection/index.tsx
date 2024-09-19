import React from 'react';
import { css } from '@emotion/css';

export default function MenuSection() {
  const handleRun = () => {
    // Your run logic here
  };

  const handleSave = () => {
    // Your save logic here
  };

  const handleSelectFiles = () => {
    // Your file selection logic here
  };

  return (
    <div
      className={css`
        flex: 1;
        display: flex;
        flex-direction: column;
        background-color: #f8f9fa;
        padding: 16px;
      `}
    >
      {/* Git Diff Section */}
      <div
        className={css`
          flex: 1;
          overflow-y: auto;
          margin-bottom: 16px;
          border: 1px solid #dee2e6;
          padding: 8px;
        `}
      >
        <h3>Git Diff</h3>
        <pre>
          {`- const oldValue = 5;
+ const newValue = 10;

- console.log("Old value:", oldValue);
+ console.log("New value:", newValue);`}
        </pre>
      </div>

      {/* Selected Files Section */}
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

      {/* Save and Run Section */}
      <div
        className={css`
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding-top: 8px;
          border-top: 1px solid #dee2e6;
        `}
      >
        <button
          onClick={handleSave}
          className={css`
            padding: 10px 20px;
            width: 100%;
            background-color: #0d6efd;
            color: #fff;
            border: none;
            border-radius: 20px;
            cursor: pointer;
            font-size: 1rem;
            margin-bottom: 8px;
            transition: background-color 0.3s;

            &:hover {
              background-color: #0b5ed7;
            }
          `}
        >
          Save
        </button>
        <button
          onClick={handleRun}
          className={css`
            padding: 10px 20px;
            width: 100%;
            background-color: #198754;
            color: #fff;
            border: none;
            border-radius: 20px;
            cursor: pointer;
            font-size: 1rem;
            transition: background-color 0.3s;

            &:hover {
              background-color: #157347;
            }
          `}
        >
          Run
        </button>
      </div>
    </div>
  );
}
