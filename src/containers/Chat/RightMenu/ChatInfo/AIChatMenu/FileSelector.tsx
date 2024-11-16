import React from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import Icon from '~/components/Icon';

export default function FileSelector({
  files = []
}: {
  files: {
    actualFileName: string;
    fileName: string;
    id: number;
  }[];
}) {
  return (
    <div
      className={css`
        border-top: 1px solid ${Color.borderGray()};
        padding: 1rem 0;
        width: 100%;
      `}
    >
      <div
        className={css`
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        `}
      >
        <h3
          className={css`
            font-size: 1.4rem;
            color: #333;
          `}
        >
          <Icon icon="folder-open" />
          <span style={{ marginLeft: '0.7rem' }}>Files</span>
        </h3>
      </div>
      <div
        className={css`
          margin-top: 1rem;
          margin-bottom: 1rem;
        `}
      >
        <div
          className={css`
            background: #000;
            border: 1px solid ${Color.borderGray()};
            padding: 0.5rem;
            height: 100px;
            overflow-y: auto;
            font-family: 'Courier New', Courier, monospace;
            color: #00ff00;
            font-size: 1.1rem;
          `}
        >
          {files.map((file, index) => (
            <div
              key={index}
              onClick={() => handleFileSelect(file)}
              className={css`
                padding: 0.2rem;
                cursor: pointer;
                &:hover {
                  background: #003300;
                }
              `}
            >
              {`> ${file.actualFileName || file.fileName}`}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  function handleFileSelect(file: { actualFileName: string }) {
    console.log('file', file);
  }
}
