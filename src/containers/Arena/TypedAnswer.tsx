import React, { useEffect, useState } from 'react';
import { css, cx } from '@emotion/css';
import { ARENA } from './theme';

// A typed answer (수학 단답형, KMC integers, C1 Use of English words): a
// box like the answer sheet's, saved when the member leaves it or presses
// Enter, never on every keystroke. Integers take digits only (the OMR digit
// grid holds three, so 0-999 on 수능; other exams allow more).
export default function TypedAnswer({
  typed,
  value,
  finished,
  label,
  compact,
  prompt = '답',
  onCommit
}: {
  typed: 'integer' | 'number' | 'text';
  value: number | string | null;
  finished: boolean;
  label: string;
  compact?: boolean;
  // the box's printed label: 답 on Korean papers, Answer on English ones
  prompt?: string;
  onCommit: (value: string | null) => void;
}) {
  const saved = value == null ? '' : String(value);
  const [draft, setDraft] = useState(saved);
  // the other box (item or answer sheet) changed it: show the new value
  useEffect(() => setDraft(saved), [saved]);
  const integer = typed === 'integer';
  // a number: digits, a minus sign, a decimal point or one fraction bar
  const numeric = typed === 'number';
  return (
    <span className={cx(wrapCls, compact && compactWrapCls)}>
      {!compact && <span className={promptCls}>{prompt}</span>}
      <input
        className={cx(
          inputCls,
          (integer || numeric) && integerCls,
          compact && compactCls
        )}
        aria-label={label}
        value={draft}
        disabled={finished}
        inputMode={integer ? 'numeric' : numeric ? 'decimal' : 'text'}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        maxLength={integer ? 6 : numeric ? 12 : 48}
        placeholder={compact ? '' : integer ? '0–999' : ''}
        onChange={(event) => {
          const next = event.target.value;
          setDraft(
            integer
              ? next.replace(/[^\d-]/g, '')
              : numeric
                ? next.replace(/[^\d./-]/g, '')
                : next
          );
        }}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commit();
          }
        }}
      />
    </span>
  );

  function commit() {
    const next = draft.trim();
    if (next === saved.trim()) return;
    onCommit(next ? next : null);
  }
}

const wrapCls = css`
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
`;

const compactWrapCls = css`
  flex: 1;
`;

const promptCls = css`
  font-weight: 800;
  color: ${ARENA.ink};
`;

const inputCls = css`
  box-sizing: border-box;
  width: 16rem;
  padding: 0.5rem 0.8rem;
  border: 2px solid ${ARENA.ink};
  border-radius: 4px;
  background: #fff;
  color: ${ARENA.ink};
  font: inherit;
  font-size: 1.6rem;
  font-weight: 700;
  &:focus {
    outline: 3px solid ${ARENA.ink};
    outline-offset: 1px;
  }
  &:disabled {
    background: transparent;
    color: ${ARENA.inkSoft};
  }
`;

// an integer box reads like the sheet's digit columns
const integerCls = css`
  width: 9rem;
  text-align: center;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.3em;
`;

const compactCls = css`
  width: 100%;
  max-width: 9rem;
  padding: 0.2rem 0.4rem;
  font-size: 1.3rem;
  letter-spacing: 0.08em;
  border-width: 1.5px;
`;
