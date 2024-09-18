import React from 'react';
import { css } from '@emotion/css';
import ErrorBoundary from '~/components/ErrorBoundary';
import FileItem from './FileItem';
import { useBuildContext } from '~/contexts';

interface FileDirectoryProps {
  isVisible: boolean;
  fileStructure: any[];
  onFileSelect: (fileName: string) => void;
  currentFile: string;
  className?: string;
}

export default function FileDirectory({
  isVisible,
  fileStructure,
  onFileSelect,
  currentFile,
  className
}: FileDirectoryProps) {
  const openFolders = useBuildContext((v) => v.state.openFolders);
  const onToggleFolder = useBuildContext((v) => v.actions.onToggleFolder);

  const renderFileStructure = (
    items: {
      name: string;
      isFolder: boolean;
      content: string;
      children?: any[];
    }[],
    parentPath = '',
    depth = 0
  ) => {
    return items.map((item) => {
      const fullPath = parentPath ? `${parentPath}/${item.name}` : item.name;
      const isOpen = openFolders.has(fullPath);

      return (
        <FileItem
          key={fullPath}
          name={item.name}
          isFolder={item.isFolder}
          isSelected={fullPath === currentFile}
          onClick={() => {
            if (!item.isFolder) {
              onFileSelect(fullPath);
            } else {
              onToggleFolder({ path: fullPath });
            }
          }}
          fullPath={fullPath}
          depth={depth}
          isOpen={isOpen}
        >
          {item.children &&
            isOpen &&
            renderFileStructure(item.children, fullPath, depth + 1)}
        </FileItem>
      );
    });
  };

  return (
    <ErrorBoundary componentPath="containers/Build/FileDirectory">
      <div
        className={`${css`
          background-color: #252526;
          transition: width 0.3s ease-in-out;
          overflow-y: auto;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          display: flex;
          flex-direction: column;
          color: #cccccc;
        `} ${className || ''}`}
      >
        {isVisible ? (
          <>
            <h3
              className={css`
                font-size: 11px;
                font-weight: 400;
                text-transform: uppercase;
                margin: 0;
                padding: 10px 12px;
                color: #bbbbbb;
                background-color: #2d2d2d;
              `}
            >
              Explorer
            </h3>
            <ul
              className={css`
                list-style-type: none;
                padding-left: 0;
                margin: 0;
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
              font-size: 13px;
              font-weight: normal;
              color: #cccccc;
              cursor: pointer;
              background-color: #252526;
            `}
          >
            Explorer
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
