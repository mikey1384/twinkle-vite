import React from 'react';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';

export default function BackForwardButtons() {
  return (
    <div
      className={css`
        display: flex;
        align-items: center;
        height: 100%;
      `}
    >
      <div
        className={css`
          padding-left: 1.2rem;
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100%;
          &:hover {
            color: #007bff;
          }
        `}
      >
        <Icon icon="arrow-left" />
      </div>
      <div
        className={css`
          padding-right: 1.2rem;
          cursor: pointer;
          height: 100%;import Icon from '~/components/Icon';
          display: flex;
          justify-content: center;
          align-items: center;
          margin-left: 0.5rem;
          &:hover {
            color: #007bff;
          }
        `}
      >
        <Icon icon="arrow-right" />
      </div>
    </div>
  );
}
