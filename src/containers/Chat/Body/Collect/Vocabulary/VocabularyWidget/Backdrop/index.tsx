import { css } from '@emotion/css';
import React from 'react';
import { Color } from '~/constants/css';
import WordRegisterStatus from './WordRegisterStatus';

const mockWordLogs = [
  {
    word: 'ephemeral',
    level: 5,
    xp: 50,
    coins: 25,
    timestamp: '12:45'
  },
  {
    word: 'ubiquitous',
    level: 4,
    xp: 40,
    coins: 20,
    timestamp: '12:44'
  },
  {
    word: 'serendipity',
    level: 3,
    xp: 30,
    coins: 15,
    timestamp: '12:43'
  },
  {
    word: 'mundane',
    level: 2,
    xp: 20,
    coins: 10,
    timestamp: '12:42'
  },
  {
    word: 'cat',
    level: 1,
    xp: 10,
    coins: 5,
    timestamp: '12:41'
  }
] as const;

export default function Backdrop() {
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
      {mockWordLogs.map((entry, index) => (
        <WordRegisterStatus key={index} entry={entry} />
      ))}
    </div>
  );
}
