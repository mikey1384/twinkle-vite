import React from 'react';
import { css, cx } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import type { QuestAnswer, QuestFormat, QuestQuestion } from './types';
import MultiTapQuestion from './MultiTapQuestion';

// The obstacle's question in its own type (Mikey 10-10: "obstacles have
// identities"). Fill the gap stays in MarbleRunScreen; this draws the rest
// with the screen's own choice styles (cls), so every type looks one game.
export const FORMAT_INFO: Record<QuestFormat, { name: string; how: string }> = {
  blank: { name: 'Fill the gap', how: 'Pick the word that fits.' },
  which: { name: 'Which way?', how: 'Pick the sentence that is right.' },
  crack: { name: 'Spot the crack', how: 'Tap the word that is wrong.' },
  fix: { name: 'Fix it', how: 'Pick what should replace the wrong part.' },
  stomp: { name: 'Stomp', how: 'Stomp every sentence that is wrong.' },
  momentum: {
    name: 'Momentum',
    how: 'Right or wrong? Three quick calls; all three must be right.'
  },
  build: {
    name: 'Build it',
    how: 'Put the pieces in order to build the right sentence.'
  }
};

// the types answered with several taps (MultiTapQuestion)
export const MULTI_TAP = ['stomp', 'momentum', 'build'];

// the stop modifiers' names on the HUD (and the map)
export const MODIFIER_INFO: Record<
  'example' | 'combo' | 'fog' | 'chaser',
  { name: string; how: string }
> = {
  example: {
    name: 'Rule first',
    how: 'A worked example shows the rule before the questions.'
  },
  combo: {
    name: 'Combo',
    how: 'Right answers in a row fill the meter: streak XP ×3.'
  },
  fog: { name: 'Fog', how: 'The choices come out of the fog one at a time.' },
  chaser: {
    name: 'Chaser',
    how: 'Slow or wrong answers let the chaser gain. Caught = try again.'
  }
};

// The words a quick reader trips on ("wrong" vs "right", "every", "all
// three") as bold coloured pills (Mikey 10-10: these gotchas must be easy
// to notice, players don't always read the instruction carefully).
const GOTCHA = /\b(wrong|right|every|all three)\b/gi;
export function GotchaText({ text }: { text: string }) {
  const parts = text.split(GOTCHA);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 ? (
          <span
            key={i}
            className={cx(
              gotchaCls,
              /wrong/i.test(part)
                ? gotchaWrongCls
                : /right/i.test(part)
                  ? gotchaRightCls
                  : gotchaAllCls
            )}
          >
            {part.toUpperCase()}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
}
const gotchaCls = css`
  display: inline-block;
  padding: 0 0.45rem;
  margin: 0 0.1rem;
  border-radius: 6px;
  font-weight: 900;
  color: #fff;
  letter-spacing: 0.03em;
`;
const gotchaWrongCls = css`
  background: #e0405e;
`;
const gotchaRightCls = css`
  background: #2fa55a;
`;
const gotchaAllCls = css`
  background: #6a4ad6;
`;

export interface ChoiceClasses {
  question: string;
  choices: string;
  choice: string;
  key: string;
  right: string;
  wrong: string;
}

// A boss reuses it with its own choice style (choiceExtra) and the picks
// already crossed out (keep picking until right).
export default function FormatQuestion({
  question,
  answer,
  disabled,
  cls,
  choiceExtra,
  crossed = [],
  revealed = 99,
  onPick,
  onRepeat
}: {
  question: QuestQuestion;
  answer?: QuestAnswer;
  disabled: boolean;
  cls: ChoiceClasses;
  choiceExtra?: string;
  crossed?: number[];
  // a several-tap answer already crossed out, entered again
  onRepeat?: () => void;
  // fog: only the first `revealed` choices are out of it yet
  revealed?: number;
  onPick: (index: number) => void;
}) {
  const format = question.format || 'blank';
  if (MULTI_TAP.includes(format)) {
    return (
      <MultiTapQuestion
        question={question}
        answer={answer}
        disabled={disabled}
        cls={cls}
        choiceExtra={choiceExtra}
        tried={crossed}
        revealed={revealed}
        onPick={onPick}
        onRepeat={onRepeat}
      />
    );
  }
  const isRight = (i: number) =>
    !!answer &&
    answer.correctIndex != null &&
    (answer.correct ? answer.correct.includes(i) : answer.correctIndex === i);
  // a counter right but too late was no wrong pick
  const isPickedWrong = (i: number) =>
    crossed.includes(i) ||
    (!!answer &&
      !answer.isCorrect &&
      !answer.late &&
      answer.selectedIndex === i);

  if (format === 'crack') {
    return (
      <>
        <div
          className={cx(cls.question, wallCls)}
          role="group"
          aria-label="Tap the word that is wrong"
        >
          {(question.tokens || []).map((word, i) => (
            <button
              key={i}
              className={cx(
                brickCls,
                answer && isRight(i) && cls.right,
                isPickedWrong(i) && cls.wrong
              )}
              disabled={disabled || crossed.includes(i)}
              onClick={() => onPick(i)}
            >
              {word}
            </button>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      {format === 'fix' && question.parts ? (
        <div className={cls.question}>
          {question.parts.before}
          <span className={jammedCls}>{question.parts.wrong}</span>
          {question.parts.after}
        </div>
      ) : format === 'which' ? null : (
        <div className={cls.question}>{question.question}</div>
      )}
      <div className={cx(cls.choices, format === 'which' && roadsCls)}>
        {question.choices.map((choice, i) => (
          <button
            key={i}
            className={cx(
              cls.choice,
              choiceExtra,
              format === 'which' && roadCls,
              isRight(i) && answer && cls.right,
              isPickedWrong(i) && cls.wrong,
              i >= revealed && foggedCls
            )}
            disabled={disabled || crossed.includes(i) || i >= revealed}
            onClick={() => onPick(i)}
          >
            <span className={cls.key}>{'ABCD'[i]}</span>
            {choice}
          </button>
        ))}
      </div>
    </>
  );
}

// fog: a choice still hidden in it
export const foggedCls = css`
  && {
    opacity: 0.08;
    filter: blur(2px);
  }
`;
// a sentence of tappable words, like bricks in a wall
const wallCls = css`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  align-items: center;
`;
const brickCls = css`
  padding: 0.5rem 0.9rem;
  border-radius: 8px;
  border: 2px solid #8a4a32;
  background: #d98663;
  color: #fff;
  font-size: inherit;
  font-weight: 800;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);
  box-shadow: 0 3px 0 #7a3a26;
  cursor: pointer;
  &:active {
    transform: translateY(2px);
    box-shadow: 0 1px 0 #7a3a26;
  }
  &:disabled {
    cursor: default;
  }
  @media (max-width: ${mobileMaxWidth}) {
    padding: 0.4rem 0.7rem;
  }
`;
// the jammed wrong part of a "fix it" sentence
const jammedCls = css`
  padding: 0 0.4rem;
  border-radius: 6px;
  background: rgba(214, 69, 69, 0.18);
  color: #c23030;
  text-decoration: line-through;
  text-decoration-thickness: 3px;
`;
// "which way?": two whole sentences, one per road, full width
const roadsCls = css`
  && {
    grid-template-columns: 1fr;
  }
`;
const roadCls = css`
  && {
    font-size: 1.6rem;
    font-weight: 700;
  }
`;
