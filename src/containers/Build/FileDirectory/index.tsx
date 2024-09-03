import React from 'react';
import { css } from '@emotion/css';
import ErrorBoundary from '~/components/ErrorBoundary';
import FileItem from './FileItem';

interface FileDirectoryProps {
  isVisible: boolean;
  onMouseLeave: () => void;
  fileStructure: any[];
  onFileSelect: (fileName: string) => void;
  currentFile: string;
  className?: string;
}

export default function FileDirectory({
  isVisible,
  onMouseLeave,
  fileStructure,
  onFileSelect,
  currentFile,
  className
}: FileDirectoryProps) {
  const renderFileStructure = (
    items: {
      name: string;
      isFolder: boolean;
      content: string;
      children?: {
        name: string;
        isFolder: boolean;
        content: string;
      }[];
    }[],
    parentPath = ''
  ) => {
    return items.map((item, index) => {
      const fullPath = parentPath ? `${parentPath}/${item.name}` : item.name;
      return (
        <FileItem
          key={index}
          name={item.name}
          isFolder={item.isFolder}
          isSelected={fullPath === currentFile}
          onClick={() => !item.isFolder && onFileSelect(fullPath)}
        >
          {item.children && renderFileStructure(item.children, fullPath)}
        </FileItem>
      );
    });
  };

  return (
    <ErrorBoundary componentPath="containers/Build/FileDirectory">
      <div
        className={`${css`
          background-color: #f8f9fa;
          transition: width 0.3s ease-in-out;
          overflow-y: auto;
          box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
          font-family: 'Arial', sans-serif;
          display: flex;
          flex-direction: column;
        `} ${className || ''}`}
        onMouseLeave={onMouseLeave}
      >
        {isVisible ? (
          <>
            <h3
              className={css`
                font-size: 1.2rem;
                font-weight: 600;
                margin: 1rem;
                color: #333;
              `}
            >
              File Directory
            </h3>
            <ul
              className={css`
                list-style-type: none;
                padding-left: 0;
                margin: 0 1rem;
                flex-grow: 1;
                overflow-y: auto;
              `}
            >
              {renderFileStructure(fileStructure)}
            </ul>
          </>
        ) : (
          <div
            className={css`
              writing-mode: vertical-rl;
              text-orientation: mixed;
              transform: rotate(180deg);
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 14px;
              font-weight: bold;
              color: #333;
              cursor: pointer;
            `}
          >
            Files
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
