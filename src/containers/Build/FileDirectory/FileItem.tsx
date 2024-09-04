import React from 'react';
import { css } from '@emotion/css';

interface FileItemProps {
  name: string;
  isFolder: boolean;
  isSelected: boolean;
  onClick: () => void;
  children?: React.ReactNode;
  className?: string;
}

const FileItem: React.FC<FileItemProps> = ({
  name,
  isFolder,
  isSelected,
  onClick,
  children,
  className
}) => {
  return (
    <li
      className={css`
        padding: 3px 0;
        cursor: pointer;
        &:hover {
          background-color: #2a2d2e;
        }
        ${className}// Add this line
      `}
    >
      <div
        onClick={onClick}
        className={css`
          display: flex;
          align-items: center;
          padding: 0 8px;
          height: 22px;
          font-size: 13px;
          color: ${isSelected ? '#ffffff' : '#cccccc'};
        `}
      >
        <span
          className={css`
            margin-right: 6px;
            color: ${isFolder ? '#c09553' : '#519aba'};
          `}
        >
          {isFolder ? '📁' : '📄'}
        </span>
        {name}
      </div>
      {isFolder && children && (
        <ul
          className={css`
            list-style-type: none;
            padding-left: 12px;
            margin: 0;
          `}
        >
          {children}
        </ul>
      )}
    </li>
  );
};

export default FileItem;
