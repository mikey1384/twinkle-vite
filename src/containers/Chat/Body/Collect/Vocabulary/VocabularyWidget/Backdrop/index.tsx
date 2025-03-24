import { css, keyframes } from '@emotion/css';
import React, { useEffect, useState } from 'react';
import { Color } from '~/constants/css';
import WordLog from './WordLog';
import { cardLevelHash } from '~/constants/defaultValues';
import { useChatContext } from '~/contexts';

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

interface VocabHint {
  wordId: number;
  content: string;
  partialWord: string;
  wordLevel: number;
  isCrossedOff?: boolean;
}

export default function Backdrop() {
  const { wordLogs, vocabHints } = useChatContext((v) => v.state);
  const [visibleHints, setVisibleHints] = useState<VocabHint[]>(vocabHints);

  useEffect(() => {
    const newHints = vocabHints.filter(
      (hint: VocabHint) =>
        !visibleHints.some(
          (visibleHint: VocabHint) => visibleHint.wordId === hint.wordId
        )
    );

    if (newHints.length > 0) {
      setVisibleHints([...visibleHints, ...newHints]);
    }

    const updatedHints = visibleHints.map((visibleHint: VocabHint) => {
      const matchingHint = vocabHints.find(
        (hint: VocabHint) => hint.wordId === visibleHint.wordId
      );
      if (matchingHint) {
        return { ...visibleHint, isCrossedOff: matchingHint.isCrossedOff };
      }
      return visibleHint;
    });

    setVisibleHints(updatedHints);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vocabHints]);

  const handleAnimationEnd = (wordId: number) => {
    setVisibleHints((prev: VocabHint[]) =>
      prev.filter((hint: VocabHint) => hint.wordId !== wordId)
    );
  };

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
          {visibleHints.map((hint: VocabHint, index: number) => (
            <div
              key={hint.wordId || index}
              className={css`
                padding: 0.75rem;
                background: ${Color.darkerGray()};
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                font-size: 1.1rem;
                position: relative;
                ${hint.isCrossedOff
                  ? `animation: ${fadeOut} 1s ease-out 0.5s forwards;`
                  : ''}
              `}
              onAnimationEnd={
                hint.isCrossedOff
                  ? () => handleAnimationEnd(hint.wordId)
                  : undefined
              }
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
                  position: relative;
                  ${hint.isCrossedOff ? 'text-decoration: line-through;' : ''}
                `}
              >
                {hint.partialWord}:
              </span>
              <span
                className={css`
                  position: relative;
                  ${hint.isCrossedOff ? 'text-decoration: line-through;' : ''}
                `}
              >
                {hint.content}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
