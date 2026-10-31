import React, { useEffect, useMemo, useState } from 'react';
import { css, cx } from '@emotion/css';
import { ARENA } from './theme';

// An order answer (TOEFL iBT® Build a Sentence): the reply's frame with its
// fixed words and blanks, and the word tiles below. Tap a tile to put it in
// the next blank; tap a placed tile to take it back (the tiles after it
// move up). The answer is the tiles' indices in blank order ("3 0 4"),
// saved on every move; it is right only when every blank holds its tile.

const BLANK = /_{3,}/g;

export function frameParts(frame: string | null | undefined) {
  return String(frame || '').split(BLANK);
}

export function parseOrder(value: number | string | null | undefined) {
  if (value == null || value === '') return [];
  return String(value)
    .split(/[\s,]+/)
    .filter((part) => /^\d{1,2}$/.test(part))
    .map(Number);
}

// the sentence an order makes, as the review prints it
export function orderSentence(
  frame: string | null | undefined,
  tiles: string[],
  value: number | string | null | undefined
) {
  const order = parseOrder(value);
  let at = 0;
  return String(frame || '')
    .replace(BLANK, () => tiles[order[at++]] ?? '___')
    .replace(/\s+([.,?!])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function OrderAnswer({
  frame,
  tiles,
  value,
  finished,
  label,
  onCommit
}: {
  frame: string;
  tiles: string[];
  value: number | string | null;
  finished: boolean;
  label: string;
  onCommit: (value: string | null) => void;
}) {
  const parts = useMemo(() => frameParts(frame), [frame]);
  const blanks = parts.length - 1;
  const saved = useMemo(
    () => parseOrder(value).filter((i) => i < tiles.length),
    [value, tiles.length]
  );
  const [placed, setPlaced] = useState<number[]>(saved);
  // the answer sheet or a reload changed it: show the saved order
  useEffect(() => setPlaced(saved), [saved.join(' ')]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={wrapCls} role="group" aria-label={label}>
      <p className={frameCls}>
        {parts.map((part, i) => (
          <React.Fragment key={i}>
            {part}
            {i < blanks &&
              (placed[i] != null ? (
                <button
                  type="button"
                  className={cx(slotCls, filledCls)}
                  disabled={finished}
                  aria-label={`Take back "${tiles[placed[i]]}"`}
                  onClick={() => update(placed.filter((_, at) => at !== i))}
                >
                  {tiles[placed[i]]}
                </button>
              ) : (
                <span className={slotCls} aria-label={`blank ${i + 1}`} />
              ))}
          </React.Fragment>
        ))}
      </p>
      {!finished && (
        <div className={bankCls}>
          {tiles.map((tile, index) =>
            placed.includes(index) ? (
              <span key={index} className={cx(tileCls, usedCls)} aria-hidden>
                {tile}
              </span>
            ) : (
              <button
                key={index}
                type="button"
                className={tileCls}
                disabled={placed.length >= blanks}
                onClick={() => update([...placed, index])}
              >
                {tile}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );

  function update(next: number[]) {
    setPlaced(next);
    onCommit(next.length ? next.join(' ') : null);
  }
}

const wrapCls = css`
  margin: 0.8rem 0 0.4rem;
  font-family: system-ui, sans-serif;
`;

const frameCls = css`
  margin: 0 0 1rem;
  font-size: 1.5rem;
  line-height: 2.6;
`;

const slotCls = css`
  display: inline-block;
  min-width: 5.6rem;
  min-height: 2.2rem;
  margin: 0 0.3rem;
  padding: 0 0.6rem;
  border: none;
  border-bottom: 2px solid #111;
  background: transparent;
  font: inherit;
  line-height: 2.2rem;
  vertical-align: baseline;
  color: #111;
`;

const filledCls = css`
  cursor: pointer;
  background: ${ARENA.paper};
  &:disabled {
    cursor: default;
  }
`;

const bankCls = css`
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
`;

const tileCls = css`
  padding: 0.5rem 1rem;
  border: 1px solid #111;
  border-radius: 0.3rem;
  background: #fff;
  font: inherit;
  font-size: 1.4rem;
  color: #111;
  cursor: pointer;
  &:disabled {
    cursor: default;
    opacity: 0.6;
  }
`;

const usedCls = css`
  border-style: dashed;
  color: transparent;
  cursor: default;
`;
