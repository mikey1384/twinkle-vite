import React from 'react';
import ZeroPic from '~/components/ZeroPic';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';

export default function CallZero() {
  return (
    <div
      className={css`
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;
      `}
    >
      <div
        className={css`
          width: 80%;
        `}
      >
        <ZeroPic />
      </div>
      <div
        className={css`
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          width: 40px;
          background-color: #3498db;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          transition: background-color 0.3s ease;

          &:hover {
            background-color: #2980b9;
          }
        `}
      >
        <span
          className={css`
            transform: rotate(-270deg);
            white-space: nowrap;
            color: white;
            font-family: 'Roboto', sans-serif;
            font-size: 16px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 1px;
          `}
        >
          <Icon icon="phone-volume" />
          <span style={{ marginLeft: '0.7rem' }}>Call</span>
        </span>
      </div>
    </div>
  );
}
