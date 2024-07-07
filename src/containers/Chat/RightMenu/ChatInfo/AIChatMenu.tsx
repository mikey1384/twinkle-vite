import React from 'react';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';

export default function AIChatMenu() {
  return (
    <div
      className={css`
        border-top: 1px solid ${Color.borderGray()};
        padding: 1rem;
        background-color: #fff;
        font-family: 'Helvetica Neue', Arial, sans-serif;
        max-width: 300px;
        margin: 0 auto;
      `}
    >
      <div
        className={css`
          margin-bottom: 1.5rem;
        `}
      >
        <div
          className={css`
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
            border-bottom: 1px solid ${Color.borderGray()};
            padding-bottom: 0.5rem;
          `}
        >
          <h3
            className={css`
              font-size: 1.4rem;
              color: #333;
            `}
          >
            Things to remember
          </h3>
          <button
            className={css`
              background: none;
              border: none;
              color: #007bff;
              cursor: pointer;
              font-size: 1rem;
              &:hover {
                text-decoration: underline;
              }
            `}
            onClick={() => {
              // Implement your edit logic here
              alert('Edit "Things to remember"');
            }}
          >
            Edit
          </button>
        </div>
        <p
          className={css`
            font-size: 1rem;
            color: #666;
            line-height: 1.5;
          `}
        >
          AI remembers: [Mockup memory content]
        </p>
      </div>
      <div
        className={css`
          margin-bottom: 1.5rem;
        `}
      >
        <div
          className={css`
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
            border-bottom: 1px solid ${Color.borderGray()};
            padding-bottom: 0.5rem;
          `}
        >
          <h3
            className={css`
              font-size: 1.4rem;
              color: #333;
            `}
          >
            Memory
          </h3>
          <button
            className={css`
              background: none;
              border: none;
              color: #007bff;
              cursor: pointer;
              font-size: 1rem;
              &:hover {
                text-decoration: underline;
              }
            `}
            onClick={() => {
              // Implement your edit logic here
              alert('Edit "Memory"');
            }}
          >
            Edit
          </button>
        </div>
        <p
          className={css`
            font-size: 1rem;
            color: #666;
            line-height: 1.5;
          `}
        >
          Memories: [Mockup memory content]
        </p>
      </div>
      <div>
        <h3
          className={css`
            font-size: 1.4rem;
            margin-bottom: 0.5rem;
            color: #333;
            border-bottom: 1px solid ${Color.borderGray()};
            padding-bottom: 0.5rem;
          `}
        >
          History
        </h3>
        <ul
          className={css`
            list-style: none;
            padding: 0;
          `}
        >
          <li
            className={css`
              font-size: 1rem;
              color: #666;
              margin-bottom: 0.5rem;
              cursor: pointer;
              &:hover {
                color: #000;
              }
            `}
          >
            Chat 1: [Generated title]
          </li>
          <li
            className={css`
              font-size: 1rem;
              color: #666;
              margin-bottom: 0.5rem;
              cursor: pointer;
              &:hover {
                color: #000;
              }
            `}
          >
            Chat 2: [Generated title]
          </li>
          <li
            className={css`
              font-size: 1rem;
              color: #666;
              margin-bottom: 0.5rem;
              cursor: pointer;
              &:hover {
                color: #000;
              }
            `}
          >
            Chat 3: [Generated title]
          </li>
          {/* Add more mockup history items as needed */}
        </ul>
      </div>
    </div>
  );
}
