import React, { useEffect, useRef, useState } from 'react';
import ListItem from './ListItem';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { NEON, flash, press, rgba } from '../../../ClassicArcade/theme';

export default function ChoiceList({
  answerIndex,
  gotWrong,
  isCompleted,
  listItems,
  onSelect,
  onShown,
  pendingChoiceIndex,
  questionLength = 0,
  selectedChoiceIndex,
  style
}: {
  answerIndex?: number;
  gotWrong: boolean;
  isCompleted?: boolean;
  listItems: string[];
  onSelect: (choiceIndex: number) => void;
  onShown?: () => void;
  pendingChoiceIndex: number | null;
  questionLength: number;
  selectedChoiceIndex: number;
  style: React.CSSProperties;
}) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    setTimeout(
      () => {
        setShown(true);
        onShown?.();
      },
      Math.max(1500, questionLength * 35)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shownRef = useRef(shown);

  useEffect(() => {
    shownRef.current = shown;
  }, [shown]);

  useEffect(() => {
    const listener = (e: any) => {
      if (!shownRef.current) {
        return;
      }
      // Typing a number in a text box (like Zero or Ciel's chat window) is
      // not an answer.
      if (
        e.target?.closest?.('input, textarea, select, [contenteditable="true"]')
      ) {
        return;
      }
      if (e.key === '1') {
        handleSelect(0);
      } else if (e.key === '2') {
        handleSelect(1);
      } else if (e.key === '3') {
        handleSelect(2);
      } else if (e.key === '4') {
        handleSelect(3);
      }
      return;
    };
    window.addEventListener('keydown', listener);
    return function cleanUp() {
      window.removeEventListener('keydown', listener);
    };
  }, [handleSelect]);

  return (
    <div
      className={`${gotWrong ? 'jiggle-jiggle-jiggle ' : ''}${css`
        display: ${shown ? 'flex' : 'none'};
        opacity: ${shown ? 1 : 0};
        transition: opacity 1s;
        flex-direction: column;
        width: 80%;
        gap: 1rem;
        nav {
          border-radius: 14px;
        }
        /* right pick: neon green, a one-shot pop */
        .correct {
          border: 2px solid ${NEON.green};
          background: linear-gradient(180deg, #13a86a 0%, #0b7a4c 100%);
          font-weight: bold;
          color: #fff;
          text-shadow: 0 1px 0 rgba(0, 0, 0, 0.35);
          box-shadow:
            0 4px 0 #064a2e,
            0 0 18px ${rgba(NEON.greenRgb, 0.75)},
            0 0 40px ${rgba(NEON.greenRgb, 0.3)};
          animation: ${press} 360ms ease-out;
        }
        /* wrong pick: a red flash (the list shakes via jiggle) */
        .wrong {
          color: #fff;
          border: 2px solid ${NEON.red};
          background: linear-gradient(180deg, #c8203d 0%, #92102a 100%);
          box-shadow:
            0 4px 0 #4f0716,
            0 0 18px ${rgba(NEON.redRgb, 0.75)};
        }
        .wrong::after {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: inherit;
          background: rgba(255, 190, 200, 0.9);
          opacity: 0;
          animation: ${flash} 420ms ease-out;
          pointer-events: none;
        }
        @media (max-width: ${mobileMaxWidth}) {
          width: 100%;
        }
      `}`}
      style={style}
    >
      {listItems.map((listItem, index) => {
        return (
          <ListItem
            key={index}
            answerIndex={answerIndex}
            isCompleted={isCompleted}
            selectedChoiceIndex={selectedChoiceIndex}
            isPending={pendingChoiceIndex === index}
            listItem={listItem}
            onSelect={handleSelect}
            index={index}
          />
        );
      })}
    </div>
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  function handleSelect(selectedIndex: number) {
    // Answered already; the server decides right or wrong for every pick.
    if (typeof answerIndex === 'number') return;
    onSelect(selectedIndex);
  }
}
