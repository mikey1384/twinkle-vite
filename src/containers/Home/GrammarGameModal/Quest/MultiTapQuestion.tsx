import React, { useEffect, useState } from 'react';
import { css, cx, keyframes } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import type { QuestAnswer, QuestQuestion } from './types';
import { GotchaText, foggedCls, type ChoiceClasses } from './FormatQuestion';

// The several-tap question types (Mikey 10-10): each sends one number once
// the taps are done, and the server grades it.
//   stomp    — mark every wrong sentence; done when as many are marked as
//              there are wrong ones (a bit mask of the marked sentences)
//   momentum — three sentences one after another, a quick Right/Wrong call
//              on each (a bit mask of the ones called right)
//   build    — tap the chunks in order (the tapped order in base n)
// Keyboard: 1–4 mark (stomp); 1 or ← Right, 2 or → Wrong (momentum); 1–6
// place a chunk and Backspace takes the last one back (build).

export function encodeOrder(sequence: number[], n: number) {
  return sequence.reduce((value, p) => value * n + p, 0);
}
export function decodeOrder(value: number, n: number) {
  const sequence: number[] = [];
  for (let i = 0; i < n; i++) {
    sequence.unshift(value % n);
    value = Math.floor(value / n);
  }
  return sequence;
}
const bit = (mask: number, i: number) => !!(mask & (1 << i));

// The learner's own answer, shown beside the key once the question settles
// (a several-tap answer is a whole set of taps, so the key alone would erase
// it): a miss's taps, or at a boss the last wrong try before the right one.
// None when a counter's clock ran out.
export function ownAnswer(answer: QuestAnswer | undefined, tried: number[]) {
  if (!answer || answer.correctIndex == null) return null;
  if (answer.isCorrect) return tried.length ? tried[tried.length - 1] : null;
  return answer.selectedIndex >= 0 ? answer.selectedIndex : null;
}
const capitalized = (text: string) =>
  text ? text.charAt(0).toUpperCase() + text.slice(1) : text;

export default function MultiTapQuestion({
  question,
  answer,
  disabled,
  cls,
  choiceExtra,
  tried = [],
  revealed = 99,
  onPick,
  onRepeat
}: {
  question: QuestQuestion;
  answer?: QuestAnswer;
  disabled: boolean;
  cls: ChoiceClasses;
  choiceExtra?: string;
  // a boss's wrong tries so far: each one starts the taps over, and the
  // same answer again starts them over without sending it (the boss
  // already crossed it out)
  tried?: number[];
  // fog: stomp's sentences come out one at a time
  revealed?: number;
  onPick: (index: number) => void;
  onRepeat?: () => void;
}) {
  // a fresh set of taps for each question, and again after a wrong try
  const [marks, setMarks] = useState<number[]>([]);
  const attempt = tried.length;
  useEffect(() => setMarks([]), [question.position, attempt]);
  function submit(value: number) {
    if (tried.includes(value)) {
      setMarks([]);
      onRepeat?.();
      return;
    }
    onPick(value);
  }
  const format = question.format;
  const settled = !!answer && answer.correctIndex != null;
  const own = ownAnswer(answer, tried);
  // a right answer's earlier try is told apart from the learner's miss
  const who = answer?.isCorrect ? 'Your last try' : 'You';
  const n =
    format === 'build' ? question.tokens?.length || 0 : question.choices.length;

  function tap(i: number) {
    if (disabled || settled) return;
    if (format === 'stomp' && i >= revealed) return;
    if (format === 'stomp') {
      const next = marks.includes(i)
        ? marks.filter((m) => m !== i)
        : [...marks, i];
      setMarks(next);
      if (next.length === (question.targets || n - 1))
        submit(next.reduce((mask, m) => mask | (1 << m), 0));
    } else if (format === 'momentum') {
      // marks: one entry per sentence called, 1 = right, 0 = wrong
      const next = [...marks, i];
      setMarks(next);
      if (next.length === n)
        submit(
          next.reduce((mask, call, k) => (call ? mask | (1 << k) : mask), 0)
        );
    } else if (format === 'build') {
      if (marks.includes(i)) return;
      const next = [...marks, i];
      setMarks(next);
      if (next.length === n) submit(encodeOrder(next, n));
    }
  }

  useEffect(() => {
    if (disabled || settled) return;
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && /INPUT|TEXTAREA/.test(target.tagName)) return;
      const digit = '123456'.indexOf(e.key);
      if (format === 'momentum') {
        if (e.key === '1' || e.key === 'ArrowLeft') tap(1);
        else if (e.key === '2' || e.key === 'ArrowRight') tap(0);
        else return;
      } else if (format === 'build' && e.key === 'Backspace') {
        setMarks((m) => m.slice(0, -1));
      } else if (digit >= 0 && digit < n) tap(digit);
      else return;
      e.preventDefault();
    }
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  });

  if (format === 'stomp') {
    const wrongMask = settled ? Number(answer!.correctIndex) : 0;
    return (
      <>
        <div className={cls.question}>
          <GotchaText
            text={`Stomp the ${question.targets || n - 1} wrong ones`}
          />{' '}
          ·{' '}
          <span className={countCls}>
            {marks.length}/{question.targets || n - 1}
          </span>
        </div>
        <div className={cx(cls.choices, stackCls)}>
          {question.choices.map((sentence, i) => {
            // the learner stomped a right one or left a wrong one standing
            const off = own != null && bit(own, i) !== bit(wrongMask, i);
            return (
              <button
                key={i}
                className={cx(
                  cls.choice,
                  choiceExtra,
                  sentenceCls,
                  marks.includes(i) && !settled && stompedCls,
                  settled && !bit(wrongMask, i) && cls.right,
                  settled && bit(wrongMask, i) && stompedCls,
                  off && !answer!.isCorrect && cls.wrong,
                  i >= revealed && foggedCls
                )}
                disabled={disabled || settled || i >= revealed}
                onClick={() => tap(i)}
              >
                <span className={cls.key}>{i + 1}</span>
                <span>
                  {sentence}
                  {off && (
                    <span className={ownTagCls}>
                      {who} {bit(own!, i) ? 'stomped it' : 'left it standing'}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </>
    );
  }

  if (format === 'momentum') {
    const at = Math.min(marks.length, n - 1);
    const rightMask = settled ? Number(answer!.correctIndex) : 0;
    if (settled) {
      return (
        <div className={cx(cls.choices, stackCls)}>
          {question.choices.map((sentence, i) => {
            // ✓/✗ is the key; the colour is the learner's call on it (a
            // miss's wrong call red), or the key's when there was no call
            const truth = bit(rightMask, i);
            const off = own != null && bit(own, i) !== truth;
            const green = answer!.isCorrect || (own == null ? truth : !off);
            return (
              <div
                key={i}
                className={cx(
                  cls.choice,
                  choiceExtra,
                  sentenceCls,
                  green ? cls.right : cls.wrong
                )}
              >
                <span className={cls.key}>{truth ? '✓' : '✗'}</span>
                <span>
                  {sentence}
                  {/* a miss shows every call; a right one only its
                      last try's wrong call */}
                  {own != null && (off || !answer!.isCorrect) && (
                    <span className={ownTagCls}>
                      {who} said {bit(own, i) ? 'Right' : 'Wrong'}
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return (
      <>
        <div className={callsCls} aria-hidden>
          {question.choices.map((_, i) => (
            <span
              key={i}
              className={cx(
                callDotCls,
                i < marks.length && callDoneCls,
                i === marks.length && callNowCls
              )}
            />
          ))}
        </div>
        <div className={cx(cls.question, slideCls)} key={at} aria-live="polite">
          {question.choices[at]}
        </div>
        <div className={cls.choices}>
          <button
            className={cx(cls.choice, choiceExtra)}
            disabled={disabled}
            onClick={() => tap(1)}
          >
            <span className={cls.key}>1</span>Right
          </button>
          <button
            className={cx(cls.choice, choiceExtra)}
            disabled={disabled}
            onClick={() => tap(0)}
          >
            <span className={cls.key}>2</span>Wrong
          </button>
        </div>
      </>
    );
  }

  // build
  const tokens = question.tokens || [];
  const placed = settled ? decodeOrder(Number(answer!.correctIndex), n) : marks;
  const sentenceOf = (order: number[]) =>
    order
      .map((p, k) => (k === 0 ? capitalized(tokens[p]) : tokens[p]))
      .join(' ') + (question.end || '');
  const ownBuilt =
    settled && own != null && own !== Number(answer!.correctIndex)
      ? sentenceOf(decodeOrder(own, n))
      : null;
  return (
    <>
      {ownBuilt && (
        <div className={ownLineCls}>
          <span className={ownLabelCls}>
            {answer!.isCorrect ? 'Your last try:' : 'You built:'}
          </span>{' '}
          {ownBuilt}
        </div>
      )}
      <div
        className={cx(
          cls.question,
          lineCls,
          settled && answer!.isCorrect && builtCls
        )}
      >
        {ownBuilt && <span className={ownLabelCls}>Right:</span>}
        {placed.length ? (
          placed.map((p, k) => (
            <button
              key={k}
              className={cx(chunkCls, placedCls)}
              disabled={disabled || settled}
              // take this chunk (and the ones after it) back
              onClick={() => setMarks(marks.slice(0, k))}
            >
              {/* the pieces don't show the sentence's capital: whichever
                  piece goes first takes it */}
              {k === 0 ? capitalized(tokens[p]) : tokens[p]}
            </button>
          ))
        ) : (
          <span className={hintCls}>Tap the pieces in order…</span>
        )}
        {question.end && <span className={endCls}>{question.end}</span>}
      </div>
      {!settled && (
        <div className={trayCls}>
          {tokens.map((chunk, i) => (
            <button
              key={i}
              className={cx(chunkCls, marks.includes(i) && usedCls)}
              disabled={disabled || marks.includes(i)}
              onClick={() => tap(i)}
            >
              <span className={chunkKeyCls}>{i + 1}</span>
              {chunk}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

// the learner's own call on a settled sentence, beside the key
const ownTagCls = css`
  display: inline-block;
  margin-left: 0.6rem;
  padding: 0 0.45rem;
  border-radius: 6px;
  background: rgba(26, 20, 38, 0.35);
  font-size: 1.1rem;
  font-weight: 800;
  white-space: nowrap;
  text-decoration: none;
`;
// Build it: what the learner built, above the right order
const ownLineCls = css`
  margin: 0.2rem 0 0.4rem;
  padding: 0.2rem 0 0.2rem 0.7rem;
  border-left: 4px solid #f0607f;
  font-size: 1.4rem;
  font-weight: 700;
  line-height: 1.35;
  overflow-wrap: anywhere;
  @media (max-height: 480px) {
    font-size: 1.2rem;
    margin-bottom: 0.2rem;
  }
`;
const ownLabelCls = css`
  font-size: 1.2rem;
  font-weight: 800;
  opacity: 0.75;
`;
const countCls = css`
  font-weight: 900;
`;
const stackCls = css`
  && {
    grid-template-columns: 1fr;
  }
  @media (max-height: 480px) {
    && {
      gap: 0.4rem;
    }
  }
`;
const sentenceCls = css`
  && {
    font-size: 1.5rem;
    font-weight: 700;
    text-align: left;
  }
  // phones on their side: a timed attack's sentences fit without scrolling
  @media (max-height: 480px) {
    && {
      font-size: 1.3rem;
      padding-top: 0.45rem;
      padding-bottom: 0.45rem;
      line-height: 1.25;
    }
  }
`;
const stompedCls = css`
  && {
    text-decoration: line-through;
    text-decoration-thickness: 3px;
    opacity: 0.75;
    filter: saturate(0.6);
  }
`;
const callsCls = css`
  display: flex;
  gap: 0.6rem;
  justify-content: center;
`;
const callDotCls = css`
  width: 1.2rem;
  height: 1.2rem;
  border-radius: 50%;
  background: rgba(127, 127, 160, 0.35);
`;
const callDoneCls = css`
  background: #7fd3ff;
`;
const callNowCls = css`
  background: #ffd24a;
`;
// each new sentence slides in, like the next gate on the ice
const slideIn = keyframes`
  from {
    transform: translateX(2rem);
    opacity: 0;
  }
  to {
    transform: none;
    opacity: 1;
  }
`;
const slideCls = css`
  animation: ${slideIn} 0.25s ease-out;
`;
const lineCls = css`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  align-items: center;
  min-height: 3.6rem;
  padding: 0.6rem;
  border-radius: 10px;
  border: 2px dashed rgba(127, 127, 160, 0.5);
`;
const builtCls = css`
  border-style: solid;
  border-color: #4bd17a;
`;
const hintCls = css`
  opacity: 0.6;
  font-size: 1.4rem;
`;
// Build it's end mark: fixed after the slots, never a piece to place
const endCls = css`
  align-self: flex-end;
  font-weight: 700;
  font-size: 1.2em;
  line-height: 1;
  margin-left: -2px;
`;

const trayCls = css`
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  justify-content: center;
`;
const chunkCls = css`
  padding: 0.6rem 1rem;
  border-radius: 10px;
  border: 2px solid #3f7f2f;
  background: #73cf57;
  color: #183a10;
  font-size: 1.5rem;
  font-weight: 800;
  box-shadow: 0 3px 0 #3f7f2f;
  cursor: pointer;
  &:active {
    transform: translateY(2px);
    box-shadow: 0 1px 0 #3f7f2f;
  }
  &:disabled {
    cursor: default;
  }
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.3rem;
    padding: 0.5rem 0.8rem;
  }
`;
const placedCls = css`
  background: #b4ec94;
`;
const usedCls = css`
  opacity: 0.3;
`;
const chunkKeyCls = css`
  margin-right: 0.5rem;
  opacity: 0.55;
  font-size: 1.1rem;
`;
