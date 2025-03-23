import { css } from '@emotion/css';
import React from 'react';
import { Color } from '~/constants/css';
import WordLog from './WordLog';
import { cardLevelHash } from '~/constants/defaultValues';
import { useChatContext } from '~/contexts';

export default function Backdrop() {
  const { wordLogs, vocabHints } = useChatContext((v) => v.state);
  return (
    <div
      className={css`
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        background: ${Color.black()};
        color: #fff;
        z-index: 0;
        overflow: hidden;
      `}
    >
      <div
        className={css`
          flex: 3;
          overflow-y: auto;
          padding: 1rem;
          border-right: 1px solid ${Color.darkGray()};
        `}
      >
        {wordLogs.map((entry: any) => (
          <WordLog key={entry.id} entry={entry} />
        ))}
      </div>

      <div
        className={css`
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
        `}
      >
        <div
          className={css`
            display: flex;
            flex-direction: column;
            gap: 1rem;
          `}
        >
          {vocabHints.map((hint: any, index: number) => (
            <div
              key={index}
              className={css`
                padding: 0.75rem;
                background: ${Color.darkerGray()};
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                font-size: 1.1rem;
              `}
            >
              <span
                className={css`
                  color: ${Color[
                    cardLevelHash[hint.wordLevel]?.color || 'logoBlue'
                  ]()};
                  font-weight: bold;
                  margin-right: 0.5rem;
                  font-family: monospace;
                  letter-spacing: 2px;
                `}
              >
                {hint.partialWord}:
              </span>
              {hint.content}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
