import React, { useState } from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import Icon from '~/components/Icon';
import SwitchButton from '~/components/Buttons/SwitchButton';

function FileSelector() {
  const [autoSelect, setAutoSelect] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  // Placeholder for all available files (this would come from props in real implementation)
  const availableFiles = [
    'main.cpp',
    'utils.h',
    'data.json',
    'index.html',
    'styles.css',
    'app.js'
  ];

  const handleFileSelect = (file: string) => {
    setSelectedFiles((prev) =>
      prev.includes(file) ? prev.filter((f) => f !== file) : [...prev, file]
    );
  };

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
        <SwitchButton
          checked={autoSelect}
          onChange={() => {
            setAutoSelect(!autoSelect);
            if (!autoSelect) {
              setSelectedFiles([]); // Clear selections when switching to auto
            }
          }}
          small
          label="Auto-select"
          labelStyle={{ fontSize: '1rem' }}
        />
      </div>
      {!autoSelect && (
        <div
          className={css`
            margin-top: 1rem;
          `}
        >
          <h4
            className={css`
              font-size: 1.1rem;
              color: #666;
              margin-bottom: 0.3rem;
            `}
          >
            Available Files:
          </h4>
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
            {availableFiles.map((file, index) => (
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
                {`> ${file}${
                  selectedFiles.includes(file) ? ' [SELECTED]' : ''
                }`}
              </div>
            ))}
          </div>
        </div>
      )}
      <div>
        <h4
          className={css`
            font-size: 1.1rem;
            color: #666;
            margin-bottom: 0.3rem;
          `}
        >
          {autoSelect ? 'Auto-selected Files:' : 'Selected Files:'}
        </h4>
        <div
          className={css`
            background: #000;
            border: 1px solid ${Color.borderGray()};
            padding: 0.5rem;
            height: 60px;
            overflow-y: auto;
            font-family: 'Courier New', Courier, monospace;
            color: #00ff00;
            font-size: 1.1rem;
          `}
        >
          {selectedFiles.length === 0 ? (
            <div
              className={css`
                opacity: 0.7;
              `}
            >
              {autoSelect
                ? '> AI will automatically select relevant files'
                : '> No files selected'}
            </div>
          ) : (
            selectedFiles.map((file, index) => (
              <div key={index}>{`> ${file}`}</div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default FileSelector;
