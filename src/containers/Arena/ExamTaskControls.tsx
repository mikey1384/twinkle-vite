import React, { useState } from 'react';
import { css } from '@emotion/css';
import TypedAnswer from './TypedAnswer';
import type { ArenaItem } from './types';
import { paragraphMoves } from './examTasks';

export function TaskColumns({
  left,
  right
}: {
  left: React.ReactNode;
  right: React.ReactNode;
}) {
  return (
    <div className={columns}>
      <div className={pane}>{left}</div>
      <div className={pane}>{right}</div>
    </div>
  );
}

export function TaskText({ text }: { text: string }) {
  return (
    <div className={textCls}>
      {text.split('\n\n').map((part, index) => (
        <p key={index}>{part}</p>
      ))}
    </div>
  );
}

export function TaskAnswer({
  item,
  value,
  disabled,
  onMark
}: {
  item: ArenaItem;
  value: number | string | null;
  disabled: boolean;
  onMark: (answer: number | string | null) => void;
}) {
  return (
    <span className={answerCls} id={`exam-question-${item.no}`}>
      <span className={numberCls}>{item.no}</span>
      {item.typed ? (
        <TypedAnswer
          key={item.no}
          typed={item.typed}
          value={value}
          finished={disabled}
          label={`Question ${item.no} answer`}
          prompt=""
          onCommit={onMark}
        />
      ) : (
        <select
          aria-label={`Question ${item.no} answer`}
          value={value == null ? '' : value}
          disabled={disabled}
          onChange={(event) =>
            onMark(
              event.target.value === '' ? null : Number(event.target.value)
            )
          }
        >
          <option value="">—</option>
          {item.choices.map((choice, index) => (
            <option key={index} value={index}>
              {choice}
            </option>
          ))}
        </select>
      )}
    </span>
  );
}

export function GapPassage({
  text,
  gaps
}: {
  text: string;
  gaps: Record<string, React.ReactNode>;
}) {
  return (
    <div className={textCls}>
      {text.split('\n\n').map((paragraph, index) => (
        <div className={paragraphCls} key={index}>
          {paragraph.split(/(\[[A-Z0-9]+\])/).map((part, at) => (
            <React.Fragment key={at}>
              {gaps[part.slice(1, -1)] && /^\[/.test(part)
                ? gaps[part.slice(1, -1)]
                : part}
            </React.Fragment>
          ))}
        </div>
      ))}
    </div>
  );
}

// The same placement control supports mouse dragging and tap/keyboard use.
export function ParagraphPlacement({
  text,
  paragraphs,
  items,
  gapLabels,
  answers,
  disabled,
  onMark
}: {
  text: string;
  paragraphs: { label: string; text: string }[];
  items: ArenaItem[];
  gapLabels: Record<number, string>;
  answers: Record<number, number | string | null>;
  disabled: boolean;
  onMark: (no: number, value: number | string | null) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const place = (no: number, choice: number) => {
    if (disabled || !paragraphs[choice]) return;
    for (const move of paragraphMoves(items, answers, no, choice))
      onMark(move.no, move.answer);
    setSelected(null);
  };
  const gaps = Object.fromEntries(
    items.map((item) => {
      const answer = answers[item.no];
      const chosen = typeof answer === 'number' ? paragraphs[answer] : null;
      return [
        gapLabels[item.no],
        <div
          key={item.no}
          id={`exam-question-${item.no}`}
          className={gapCls}
          onDragOver={(event) => {
            if (!disabled) event.preventDefault();
          }}
          onDrop={(event) => {
            event.preventDefault();
            const value = event.dataTransfer.getData(
              'application/x-arena-paragraph'
            );
            if (/^\d+$/.test(value)) place(item.no, Number(value));
          }}
        >
          <button
            type="button"
            disabled={disabled || selected == null}
            aria-label={`Place selected paragraph in question ${item.no}`}
            onClick={() => selected != null && place(item.no, selected)}
          >
            <b>{item.no}</b>{' '}
            {chosen
              ? `${chosen.label} · ${chosen.text}`
              : selected == null
                ? 'Select or drag a paragraph here'
                : `Place paragraph ${paragraphs[selected].label} here`}
          </button>
          {chosen && !disabled && (
            <button
              type="button"
              className={removeCls}
              aria-label={`Remove paragraph from question ${item.no}`}
              onClick={() => onMark(item.no, null)}
            >
              Remove
            </button>
          )}
        </div>
      ];
    })
  );
  return (
    <TaskColumns
      left={<GapPassage text={text} gaps={gaps} />}
      right={
        <>
          {!disabled && (
            <p>
              Drag a paragraph into a gap, or select a paragraph and then its
              gap.
            </p>
          )}
          {paragraphs.map((paragraph, index) => {
            const placed = items.find((item) => answers[item.no] === index);
            return (
              <button
                key={paragraph.label}
                type="button"
                className={paragraphButtonCls}
                draggable={!disabled}
                disabled={disabled}
                aria-pressed={selected === index}
                onDragStart={(event) => {
                  event.dataTransfer.setData(
                    'application/x-arena-paragraph',
                    String(index)
                  );
                  event.dataTransfer.effectAllowed = 'move';
                }}
                onClick={() => setSelected(selected === index ? null : index)}
              >
                <b>
                  {paragraph.label}
                  {placed ? ` · Question ${placed.no}` : ''}
                </b>
                <span>{paragraph.text}</span>
              </button>
            );
          })}
        </>
      }
    />
  );
}

const columns = css`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 2.4rem;
  @media (max-width: 700px) {
    grid-template-columns: 1fr;
    gap: 1.4rem;
  }
`;
const pane = css`
  min-width: 0;
  max-height: 65vh;
  overflow: auto;
  padding: 0 1rem 1rem 0;
  overscroll-behavior: contain;
  @media (max-width: 700px) {
    max-height: 52vh;
  }
`;
const textCls = css`
  white-space: pre-wrap;
  line-height: 1.9;
  overflow-wrap: anywhere;
  p {
    margin: 0 0 1.4rem;
  }
  p:first-child {
    font-weight: 600;
  }
`;
const paragraphCls = css`
  margin-bottom: 1.4rem;
`;
const answerCls = css`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  max-width: 100%;
  margin: 0.3rem 0.2rem;
  vertical-align: middle;
  select {
    font: inherit;
    max-width: 100%;
    padding: 0.45rem;
    border: 1px solid #687d91;
    background: white;
    color: #172c40;
  }
  input {
    max-width: 100%;
  }
  > span:last-child {
    min-width: 0;
  }
`;
const numberCls = css`
  font-size: 1.2rem;
  font-weight: 700;
  color: #41556a;
`;
const gapCls = css`
  display: block;
  border: 1px dashed #647e96;
  background: #f5f8fb;
  padding: 0.8rem;
  margin: 1rem 0;
  button {
    font: inherit;
    line-height: 1.65;
    text-align: left;
    color: #172c40;
    border: 0;
    background: transparent;
    width: 100%;
    cursor: pointer;
  }
  button:disabled {
    opacity: 1;
    cursor: default;
  }
`;
const removeCls = css`
  && {
    text-decoration: underline;
    width: auto;
    font-size: 1.2rem;
    margin-top: 0.6rem;
  }
`;
const paragraphButtonCls = css`
  display: block;
  text-align: left;
  width: 100%;
  font: inherit;
  line-height: 1.7;
  border: 1px solid #a7b5c4;
  background: white;
  color: #172c40;
  padding: 1.2rem;
  margin-bottom: 1rem;
  cursor: grab;
  span {
    display: block;
    margin-top: 0.4rem;
  }
  [aria-pressed='true']& {
    border-color: #147cb4;
  }
  &[aria-pressed='true'] {
    outline: 3px solid #147cb4;
  }
  &:disabled {
    cursor: default;
    opacity: 1;
  }
`;
