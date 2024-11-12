import React from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import Icon from '~/components/Icon';

function FileSelector() {
  const placeholderFiles = ['main.cpp', 'utils.h', 'data.json', 'index.html'];

  return (
    <div
      className={css`
        border-top: 1px solid ${Color.borderGray()};
        padding: 1rem 0;
        width: 100%;
      `}
    >
      <h3
        className={css`
          font-size: 1.4rem;
          margin-bottom: 0.5rem;
          color: #333;
        `}
      >
        <Icon icon="folder-open" />
        <span style={{ marginLeft: '0.7rem' }}>Selected Files</span>
      </h3>
      <div
        className={css`
          background: #000;
          border: 1px solid ${Color.borderGray()};
          padding: 0.5rem;
          height: 120px;
          overflow-y: auto;
          font-family: 'Courier New', Courier, monospace;
          color: #00ff00;
          font-size: 1.1rem;
        `}
      >
        {placeholderFiles.map((file, index) => (
          <div
            key={index}
            className={css`
              padding: 0.2rem;
              cursor: pointer;
              &:hover {
                background: #003300;
              }
            `}
          >
            {`> ${file}`}
          </div>
        ))}
      </div>
    </div>
  );
}

export default FileSelector;
