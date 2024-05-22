import React from 'react';
import { css } from '@emotion/css';
import ListenSection from './ListenSection';
import { innerBorderRadius } from '~/constants/css';

export default function Listening({ difficulty }: { difficulty: number }) {
  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background-color: #f0f2f5;
        color: #333;
        height: 100%;
        border-top-left-radius: ${innerBorderRadius};
        border-top-right-radius: ${innerBorderRadius};
      `}
    >
      <ListenSection difficulty={difficulty} />
    </div>
  );
}
