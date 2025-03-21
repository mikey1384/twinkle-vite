import { css } from '@emotion/css';
import React from 'react';
import { Color } from '~/constants/css';
import WordLog from './WordLog';
import { useChatContext } from '~/contexts';

const exampleHints = [
  {
    word: 'dog',
    description: 'A four-legged animal that barks and is often kept as a pet'
  },
  { word: 'pen', description: 'Something you use to write on paper' },
  { word: 'moon', description: 'The natural satellite that orbits Earth' },
  {
    word: 'library',
    description: 'A place where books are kept and can be borrowed'
  },
  { word: 'sun', description: 'The star at the center of our solar system' }
];

const getMaskedWord = (word: string, numLettersToReveal = 2): string => {
  const letters = word.split('');
  const indices: number[] = [];

  for (let i = 0; i < letters.length; i++) {
    if (letters[i] !== ' ') indices.push(i);
  }

  const shuffledIndices = [...indices].sort(() => Math.random() - 0.5);
  const revealIndices = shuffledIndices.slice(
    0,
    Math.min(numLettersToReveal, indices.length)
  );

  return letters
    .map((letter: string, i: number) =>
      letter === ' ' ? ' ' : revealIndices.includes(i) ? letter : '_'
    )
    .join('');
};

export default function Backdrop() {
  const { wordLogs } = useChatContext((v) => v.state);
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
          {exampleHints.map((hint, index) => (
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
                  color: ${Color.logoBlue()};
                  font-weight: bold;
                  margin-right: 0.5rem;
                  font-family: monospace;
                  letter-spacing: 2px;
                `}
              >
                {getMaskedWord(hint.word)}:
              </span>
              {hint.description}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
