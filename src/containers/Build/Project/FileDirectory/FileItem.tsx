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
  isOpen: boolean;
}

export default function FileItem({
  name,
  isFolder,
  isSelected,
  onClick,
  fullPath,
  children,
  depth,
  isOpen
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
          user-select: none;
          &:hover {
            background-color: #2a2d2e;
          }
        `}
      >
        <span
          className={css`
            display: inline-flex;
            align-items: center;
          `}
        >
          {isFolder ? (isOpen ? '📂' : '📁') : '📄'}
        </span>
        <span
          className={css`
            margin-left: 1rem;
          `}
          title={fullPath}
        >
          {name}
        </span>
      </div>
      {isFolder && children && (
        <div
          className={css`
            max-height: ${isOpen ? '1000px' : '0'};
            overflow: hidden;
            transition: max-height 0.3s ease;
          `}
        >
          <ul
            className={css`
              padding-left: 0;
              margin: 0;
            `}
          >
            {children}
          </ul>
        </div>
      )}
    </li>
  );
}
