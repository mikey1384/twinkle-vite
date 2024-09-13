import React from 'react';
import { css } from '@emotion/css';

interface FileItemProps {
  name: string;
  isFolder: boolean;
  isSelected: boolean;
  onClick: () => void;
  fullPath: string;
  children?: React.ReactNode;
  depth: number;
}

export default function FileItem({
  name,
  isFolder,
  isSelected,
  onClick,
  fullPath,
  children,
  depth
}: FileItemProps) {
  return (
    <li
      className={css`
        list-style-type: none;
        ${isSelected
          ? `
            background-color: #37373d;
            border-left: 2px solid #007acc;
          `
          : ''}
      `}
    >
      <div
        onClick={onClick}
        className={css`
          padding: 6px 8px 6px ${8 + depth * 12}px;
          cursor: pointer;
          display: flex;
          align-items: center;
          font-size: 14px;
          ${!isFolder
            ? `
              &:hover {
                background-color: #2a2d2e;
              }
            `
            : ''}
        `}
      >
        {isFolder ? '📁' : '📄'}
        <span
          className={css`
            margin-left: 1rem;
          `}
          title={fullPath}
        >
          {name}
        </span>
      </div>
      {children && (
        <ul
          className={css`
            padding-left: 0;
            margin: 0;
          `}
        >
          {children}
        </ul>
      )}
    </li>
  );
}
