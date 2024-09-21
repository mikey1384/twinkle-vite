import React from 'react';
import { css } from '@emotion/css';

interface CodeBlockPlaceholderProps {
  height: number;
}

function CodeBlockPlaceholder({ height }: CodeBlockPlaceholderProps) {
  return (
    <div
      className={css`
        background-color: #f6f8fa;
        border: 1px solid #e1e4e8;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #6a737d;
        font-family: 'Fira Code', 'Source Code Pro', Menlo, Monaco, Consolas,
          'Courier New', monospace;
        font-size: 14px;
        @media (max-width: 600px) {
          font-size: 11px;
        }
      `}
      style={{ height: `${height}px` }}
    >
      Loading code...
    </div>
  );
}

export default CodeBlockPlaceholder;
