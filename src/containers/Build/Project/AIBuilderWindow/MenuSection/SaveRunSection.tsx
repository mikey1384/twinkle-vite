import React from 'react';
import { css } from '@emotion/css';

export default function SaveRunSection() {
  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        padding-top: 8px;
        border-top: 1px solid #dee2e6;
      `}
    >
      <button
        onClick={handleSave}
        className={css`
          padding: 10px 20px;
          width: 100%;
          background-color: #0d6efd;
          color: #fff;
          border: none;
          border-radius: 20px;
          cursor: pointer;
          font-size: 1rem;
          margin-bottom: 8px;
          transition: background-color 0.3s;

          &:hover {
            background-color: #0b5ed7;
          }
        `}
      >
        Save
      </button>
      <button
        onClick={handleRun}
        className={css`
          padding: 10px 20px;
          width: 100%;
          background-color: #198754;
          color: #fff;
          border: none;
          border-radius: 20px;
          cursor: pointer;
          font-size: 1rem;
          transition: background-color 0.3s;

          &:hover {
            background-color: #157347;
          }
        `}
      >
        Run
      </button>
    </div>
  );

  function handleSave() {
    // Your save logic here
  }

  function handleRun() {
    // Your run logic here
  }
}
