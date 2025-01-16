import { css } from '@emotion/css';
import React from 'react';
import { Color } from '~/constants/css';
import WordRegisterStatus from './WordRegisterStatus';
import { useChatContext } from '~/contexts';

export default function Backdrop() {
  const wordLogs = useChatContext((v) => v.state.wordLogs);
  return (
    <div
      className={css`
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        flex-direction: column;
        background: ${Color.black()};
        color: #fff;
        z-index: 0;
        overflow-y: auto;
        padding: 1rem 0;
      `}
    >
      {wordLogs.map((entry: any, index: any) => (
        <WordRegisterStatus key={index} entry={entry} />
      ))}
    </div>
  );
}
