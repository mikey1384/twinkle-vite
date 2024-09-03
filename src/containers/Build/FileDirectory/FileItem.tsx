import React from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';

interface FileItemProps {
  name: string;
  isFolder?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}

export default function FileItem({
  name,
  isSelected = false,
  isFolder = false,
  onClick,
  children
}: FileItemProps) {
  return (
    <li
      className={css`
        margin-bottom: 0.5rem;
      `}
    >
      <div
        className={css`
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.25rem 0.5rem;
          cursor: pointer;
          background-color: ${isSelected ? '#e2e6ea' : 'transparent'};
          border-radius: 4px;
          &:hover {
            background-color: ${isSelected ? '#d8dde2' : '#e9ecef'};
          }
        `}
        onClick={onClick}
      >
        <Icon icon={isFolder ? 'folder' : 'file'} />
        <span
          className={css`
            font-size: 0.9rem;
            color: ${isSelected ? '#007bff' : '#495057'};
            font-weight: ${isSelected ? 'bold' : 'normal'};
          `}
        >
          {name}
        </span>
      </div>
      {isFolder && children && (
        <ul
          className={css`
            list-style-type: none;
            padding-left: 1.5rem;
          `}
        >
          {children}
        </ul>
      )}
    </li>
  );
}
