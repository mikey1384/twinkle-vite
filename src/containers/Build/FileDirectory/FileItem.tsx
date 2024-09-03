import React from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';

interface FileItemProps {
  name: string;
  isFolder?: boolean;
  children?: React.ReactNode;
}

export default function FileItem({
  name,
  isFolder = false,
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
          padding: 0.25rem 0;
          cursor: pointer;
          &:hover {
            background-color: #e9ecef;
          }
        `}
      >
        <Icon icon={isFolder ? 'folder' : 'file'} />
        <span
          className={css`
            font-size: 0.9rem;
            color: #495057;
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
