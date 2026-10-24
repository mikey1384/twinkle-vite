import React from 'react';
import { css, cx } from '@emotion/css';
import Icon from '~/components/Icon';
import { mobileMaxWidth } from '~/constants/css';
import { ARENA } from './theme';

// A multiple-choice question in Arena's look (Mikey 10-24: AI Story's
// questions too). Same behaviour as the site's MultipleChoiceQuestion, which
// other pages keep: pick one, change it until grading; once graded the right
// answer shows green and a wrong pick red.
export default function ArenaChoiceQuestion({
  number,
  question,
  choices,
  isGraded,
  selectedChoiceIndex,
  answerIndex,
  onSelectChoice,
  disabled = false,
  style
}: {
  number?: number;
  question: React.ReactNode;
  choices: string[];
  isGraded: boolean;
  selectedChoiceIndex?: number | null;
  answerIndex: number;
  onSelectChoice: (index: number) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}) {
  const picked =
    typeof selectedChoiceIndex === 'number' ? selectedChoiceIndex : null;
  const answer = Number(answerIndex);
  return (
    <section className={cardCls} style={style}>
      <header className={headCls}>
        {typeof number === 'number' && (
          <span className={numberCls}>{number}</span>
        )}
        <div className={questionCls}>{question}</div>
      </header>
      <div className={choicesCls}>
        {(choices || []).map((choice, index) => {
          const chosen = picked === index;
          const right = isGraded && index === answer;
          const wrong = isGraded && chosen && index !== answer;
          return (
            <button
              key={index}
              type="button"
              className={cx(
                choiceCls,
                chosen && !isGraded && chosenCls,
                right && rightCls,
                wrong && wrongCls
              )}
              disabled={disabled || isGraded}
              aria-pressed={chosen}
              onClick={() => onSelectChoice(index)}
            >
              <span className={letterCls}>
                {right ? (
                  <Icon icon="check" />
                ) : wrong ? (
                  <Icon icon="times" />
                ) : (
                  String.fromCharCode(65 + index)
                )}
              </span>
              <span className={choiceTextCls}>{choice}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

const cardCls = css`
  width: 100%;
  max-width: 72rem;
  margin: 0 auto;
  background: ${ARENA.paper};
  border: 3px solid ${ARENA.line};
  border-radius: 12px;
  box-shadow: 4px 4px 0 ${ARENA.line};
  color: ${ARENA.ink};
  overflow: hidden;
`;

const headCls = css`
  display: flex;
  gap: 1.2rem;
  align-items: flex-start;
  padding: 1.4rem 1.6rem 1.2rem;
  border-bottom: 3px solid ${ARENA.line};
  background: #fff;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 1.1rem 1.1rem 1rem;
  }
`;

const numberCls = css`
  flex: none;
  width: 3.2rem;
  height: 3.2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: ${ARENA.ink};
  color: #fff;
  font-size: 1.6rem;
  font-weight: 900;
`;

const questionCls = css`
  min-width: 0;
  font-size: 1.7rem;
  line-height: 1.45;
  b {
    font-weight: 800;
  }
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.55rem;
  }
`;

const choicesCls = css`
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 1.4rem 1.6rem 1.6rem;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 1rem 1rem 1.2rem;
    gap: 0.7rem;
  }
`;

const choiceCls = css`
  display: flex;
  align-items: center;
  gap: 1.2rem;
  width: 100%;
  padding: 1rem 1.2rem;
  text-align: left;
  border: 2px solid ${ARENA.line};
  border-radius: 10px;
  background: #fff;
  color: ${ARENA.ink};
  box-shadow: 2px 2px 0 ${ARENA.line};
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition:
    transform 0.1s,
    box-shadow 0.1s,
    background 0.12s;
  /* hover never repaints the chosen row (white-on-light was unreadable) */
  @media (hover: hover) and (pointer: fine) {
    &:hover:not(:disabled):not([aria-pressed='true']) {
      transform: translate(-1px, -1px);
      box-shadow: 3px 3px 0 ${ARENA.line};
      background: #f6f1e4;
    }
  }
  &:focus {
    outline: none;
  }
  &:focus-visible {
    outline: 3px solid ${ARENA.ink};
    outline-offset: 2px;
  }
  &:disabled {
    cursor: default;
  }
`;

// the pick reads like a highlighter mark: pale yellow, ink text, the letter
// inked in (Mikey 10-24: the solid ink block had poor contrast on hover)
const chosenCls = css`
  background: #fff1b8;
  color: ${ARENA.ink};
  box-shadow: 3px 3px 0 ${ARENA.line};
  font-weight: 600;
  > span:first-child {
    background: ${ARENA.ink};
    color: #fff;
  }
`;

const rightCls = css`
  background: #dff2e3;
  > span:first-child {
    background: ${ARENA.train};
    color: #fff;
  }
`;

const wrongCls = css`
  background: #fbe0dc;
  > span:first-child {
    background: ${ARENA.accent};
    color: #fff;
  }
`;

const letterCls = css`
  flex: none;
  width: 2.8rem;
  height: 2.8rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 2px solid ${ARENA.line};
  border-radius: 50%;
  background: ${ARENA.paper};
  font-size: 1.3rem;
  font-weight: 900;
`;

const choiceTextCls = css`
  min-width: 0;
  font-size: 1.5rem;
  line-height: 1.45;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.4rem;
  }
`;
