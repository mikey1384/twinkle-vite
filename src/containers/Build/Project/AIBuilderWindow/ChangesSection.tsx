import React from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';

export default function ChangesSection() {
  const handleRunButtonClick = () => {
    // Implement the logic to run the code
  };

  return (
    <div
      className={css`
        flex: 1;
        border-left: 1px solid #dee2e6;
        padding: 16px;
        display: flex;
        flex-direction: column;
        background-color: #ffffff;
      `}
    >
      <div
        className={css`
          flex: 1;
          overflow-y: auto;
        `}
      >
        <h3
          className={css`
            margin-top: 0;
            color: #343a40;
          `}
        >
          Changes Since Last Run
        </h3>
        <p
          className={css`
            color: #495057;
          `}
        >
          List of changes goes here...
        </p>
      </div>
      <div
        className={css`
          width: 100%;
          margin-top: 16px;
        `}
      >
        <button
          onClick={handleRunButtonClick}
          disabled={false}
          className={css`
            width: 100%;
            padding: 12px 0;
            background-color: #198754;
            color: #fff;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1.1rem;
            transition: background-color 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;

            &:disabled {
              background-color: #6c757d;
              cursor: not-allowed;
            }

            &:hover:enabled {
              background-color: #157347;
            }
          `}
        >
          <Icon icon="play" />
          <span
            className={css`
              margin-left: 0.5rem;
            `}
          >
            Run
          </span>
        </button>
      </div>
    </div>
  );
}
