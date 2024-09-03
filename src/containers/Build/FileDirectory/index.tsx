import React from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import FileItem from './FileItem';
import ErrorBoundary from '~/components/ErrorBoundary';

interface FileDirectoryProps {
  isVisible: boolean;
  onMouseLeave: () => void;
}

export default function FileDirectory({
  isVisible,
  onMouseLeave
}: FileDirectoryProps) {
  return (
    <ErrorBoundary componentPath="containers/Build/FileDirectory">
      <div
        className={css`
          position: fixed;
          top: 50%;
          left: 0;
          width: 24px;
          height: 80px;
          background-color: #f0f0f0;
          border-radius: 0 8px 8px 0;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 1000;
          box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
          transform: translateY(-50%);
        `}
      >
        <Icon icon="folder" />
      </div>
      <div
        className={css`
          position: fixed;
          left: ${isVisible ? '0' : '-280px'};
          width: 280px;
          height: calc(100% - 60px); // Subtract the top offset
          background-color: #f8f9fa;
          transition: left 0.3s ease-in-out;
          z-index: 999;
          padding: 1.5rem;
          overflow-y: auto;
          box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
          font-family: 'Arial', sans-serif;
        `}
        onMouseLeave={onMouseLeave}
      >
        <h3
          className={css`
            font-size: 1.2rem;
            font-weight: 600;
            margin-bottom: 1rem;
            color: #333;
          `}
        >
          File Directory
        </h3>
        <ul
          className={css`
            list-style-type: none;
            padding-left: 0;
          `}
        >
          <FileItem name="src" isFolder>
            <FileItem name="containers" isFolder>
              <FileItem name="Build" isFolder>
                <FileItem name="index.tsx" />
                <FileItem name="CodeEditor.tsx" />
                <FileItem name="Simulator.tsx" />
                <FileItem name="FileDirectory.tsx" />
              </FileItem>
            </FileItem>
          </FileItem>
        </ul>
      </div>
    </ErrorBoundary>
  );
}
