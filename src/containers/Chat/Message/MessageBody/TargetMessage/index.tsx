import React from 'react';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import TextMessage from './TextMessage';
import WordleResult from './WordleResult';

export default function TargetMessage({
  message,
  displayedThemeColor
}: {
  message: any;
  displayedThemeColor: string;
}) {
  return (
    <div
      className={css`
        width: 85%;
        @media (max-width: ${mobileMaxWidth}) {
          width: 100%;
        }
      `}
    >
      {message.wordleResult ? (
        <WordleResult
          username={message.username}
          userId={message.userId}
          timeStamp={message.timeStamp}
          wordleResult={message.wordleResult}
        />
      ) : (
        <TextMessage
          displayedThemeColor={displayedThemeColor}
          message={message}
        />
      )}
    </div>
  );
}
