import React from 'react';
import { css } from '@emotion/css';

interface FileDirectoryProps {
  isVisible: boolean;
  onMouseLeave: () => void;
}

export default function FileDirectory({
  isVisible,
  onMouseLeave
}: FileDirectoryProps) {
  return (
    <>
      <div
        className={css`
          position: fixed;
          top: 50%;
          left: 0;
          width: 20px;
          height: 60px;
          background-color: #f0f0f0;
          border-radius: 0 5px 5px 0;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 11;
          box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
          transform: translateY(-50%);
        `}
      >
        <span
          className={css`
            writing-mode: vertical-rl;
            text-orientation: mixed;
            transform: rotate(180deg);
            font-size: 12px;
          `}
        >
          Files
        </span>
      </div>
      <div
        className={css`
          position: fixed;
          top: 0;
          left: ${isVisible ? '0' : '-250px'};
          width: 250px;
          height: 100%;
          background-color: #f0f0f0;
          transition: left 0.3s ease-in-out;
          z-index: 10;
          padding: 1rem;
          overflow-y: auto;
          box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
        `}
        onMouseLeave={onMouseLeave}
      >
        <h3>File Directory</h3>
        {/* Add your file directory structure here */}
        <ul>
          <li>src/</li>
          <ul>
            <li>containers/</li>
            <ul>
              <li>Build/</li>
              <ul>
                <li>index.tsx</li>
                <li>CodeEditor.tsx</li>
                <li>Simulator.tsx</li>
                <li>FileDirectory.tsx</li>
              </ul>
            </ul>
          </ul>
        </ul>
      </div>
    </>
  );
}
