import React from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import skeletonBar from './Bar';

export default function SkeletonItem() {
  return (
    <div
      className={css`
        background: ${Color.whiteGray()};
        border: 1px solid ${Color.borderGray()};
        border-radius: 10px;
        padding: 1rem 1.25rem;
        margin-bottom: 1rem;
      `}
    >
      <div
        className={css`
          display: flex;
          align-items: center;
          justify-content: space-between;
        `}
      >
        <div
          className={skeletonBar({ height: 28, width: '28px', radius: 9999 })}
        />
        <div
          className={css`
            display: inline-flex;
            gap: 8px;
            align-items: center;
          `}
        >
          <div
            className={skeletonBar({ height: 14, width: '80px', radius: 4 })}
          />
          <div
            className={skeletonBar({ height: 14, width: '90px', radius: 4 })}
          />
        </div>
      </div>
      <div
        className={css`
          ${skeletonBar({ height: 22, width: '80%', radius: 6 })};
          margin-top: 10px;
        `}
      />
      <div
        className={css`
          ${skeletonBar({ height: 18, width: '95%', radius: 6 })};
          margin-top: 12px;
        `}
      />
      <div
        className={css`
          ${skeletonBar({ height: 18, width: '92%', radius: 6 })};
          margin-top: 8px;
        `}
      />
      <div
        className={css`
          ${skeletonBar({ height: 18, width: '96%', radius: 6 })};
          margin-top: 8px;
        `}
      />
      <div
        className={css`
          ${skeletonBar({ height: 18, width: '88%', radius: 6 })};
          margin-top: 8px;
        `}
      />
      <div
        className={css`
          ${skeletonBar({ height: 32, width: '180px', radius: 8 })};
          margin-top: 14px;
          align-self: center;
        `}
      />
    </div>
  );
}
