import React, { useEffect, useRef, useState } from 'react';
import { css, cx } from '@emotion/css';
import type { ArenaItem } from './types';
import useAnswerFlush from './useAnswerFlush';

// An essay answer (C1 / IELTS / TOEFL Writing, 내신 논술형): a lined answer
// sheet with the exam's own length count beside it (words, or 글자 수 for a
// Korean 논술). Saved a moment after typing stops and when the member
// leaves the box, so a reload loses nothing; the server keeps the text.
const SAVE_AFTER_MS = 2500;

export function countWords(text: string) {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export function countChars(text: string) {
  return text.replace(/[\r\n]/g, '').trim().length;
}

export default function EssayAnswer({
  no,
  task,
  value,
  finished,
  korean,
  onCommit
}: {
  no: number;
  task: ArenaItem['task'];
  value: string | null;
  finished: boolean;
  korean: boolean;
  onCommit: (value: string | null) => void;
}) {
  const saved = value ?? '';
  const [draft, setDraft] = useState(saved);
  const timerRef = useRef<number | null>(null);
  const lastSentRef = useRef(saved);
  // the latest draft for the unmount flush (state is stale in a cleanup)
  const draftRef = useRef(draft);
  draftRef.current = draft;
  useAnswerFlush(flush);
  useEffect(() => {
    // the server's copy changed (a reload): show it unless mid-edit
    if (saved !== lastSentRef.current) {
      lastSentRef.current = saved;
      setDraft(saved);
    }
  }, [saved]);
  useEffect(() => () => flush(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const byChars = !!(task?.minChars || task?.maxChars);
  const count = byChars ? countChars(draft) : countWords(draft);
  const min = byChars ? task?.minChars : task?.minWords;
  const max = byChars ? task?.maxChars : task?.maxWords;
  const unit = byChars ? '자' : korean ? '단어' : 'words';
  const outside =
    (min != null && count > 0 && count < min) || (max != null && count > max);

  return (
    <div className={wrapCls}>
      <textarea
        className={sheetCls}
        aria-label={`${no}번 답안`}
        value={draft}
        disabled={finished}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        placeholder={
          finished
            ? ''
            : korean
              ? '답안을 작성하시오.'
              : 'Write your answer here.'
        }
        onChange={(event) => {
          setDraft(event.target.value);
          schedule(event.target.value);
        }}
        onBlur={() => flush()}
      />
      <div className={cx(countCls, outside && countOutsideCls)}>
        {count} {unit}
        {(min != null || max != null) && (
          <span>
            {' '}
            ·{' '}
            {min != null && max != null
              ? `${min}–${max}`
              : min != null
                ? `${min}+`
                : `≤ ${max}`}{' '}
            {unit}
          </span>
        )}
      </div>
    </div>
  );

  function schedule(next: string) {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => send(next), SAVE_AFTER_MS);
  }

  function flush() {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    send(draftRef.current);
  }

  function send(next: string) {
    if (finished || next === lastSentRef.current) return;
    lastSentRef.current = next;
    onCommit(next.trim() ? next : null);
  }
}

const wrapCls = css`
  margin: 1rem 0 0.4rem;
`;

// ruled lines like the answer sheet's, in the paper's serif
const sheetCls = css`
  display: block;
  box-sizing: border-box;
  width: 100%;
  min-height: 26rem;
  padding: 0.4rem 1rem;
  border: 1px solid #111;
  border-radius: 0;
  background-color: #fff;
  background-image: repeating-linear-gradient(
    to bottom,
    transparent 0,
    transparent calc(2.4rem - 1px),
    #c9c3b6 calc(2.4rem - 1px),
    #c9c3b6 2.4rem
  );
  background-attachment: local;
  color: #111;
  font: inherit;
  font-size: 1.45rem;
  line-height: 2.4rem;
  resize: vertical;
  &:focus {
    outline: 2px solid #111;
    outline-offset: 1px;
  }
  &:disabled {
    color: #333;
    -webkit-text-fill-color: #333;
    opacity: 1;
  }
`;

const countCls = css`
  margin-top: 0.4rem;
  text-align: right;
  font-family: system-ui, sans-serif;
  font-size: 1.2rem;
  font-weight: 700;
  color: #555;
  font-variant-numeric: tabular-nums;
`;

const countOutsideCls = css`
  color: #b3261e;
`;
