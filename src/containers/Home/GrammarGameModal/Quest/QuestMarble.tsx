import React from 'react';
import { css, cx } from '@emotion/css';
import { discRows, pixelSvg, PIXEL_FONT } from './pixelUi';
import type { MarbleLook } from './marbleLooks';

// Quest's plain marbles (Mikey 10-07: Quest must be a Grammarbles game too).
// In a run, each question is a marble slot (Mikey 11-15): a right answer is
// a green marble with a check, a miss a gray one with a cross, and every
// marble inside a run of GOLD_STREAK right answers in a row turns gold. The
// streak itself shows beside the marbles (StreakBadge), never as a recolour
// of a right answer: kids read red as "wrong". A forgiven miss is the clear
// marble with a check. An unplayed slot shows the empty one; played map
// nodes show Classic's lettered marble (spriteUri).

export type { MarbleLook };

export default function QuestMarble({
  look,
  size = 22,
  label,
  className,
  title
}: {
  look: MarbleLook;
  size?: number;
  label?: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cx(baseCls, look === 'dull' && dullCls, className)}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(10, size * 0.45),
        backgroundImage: `url("${questMarbleUri(look, size)}")`,
        color: LABEL[look]
      }}
    >
      {label}
    </span>
  );
}

// Pixel marbles to match the marble run (10-07): ink rim, banded light from
// the top left and a white glint, like marbleSprite but without a letter.
// Big marbles use 2x2 screen pixels per art pixel so they stay chunky.
// m = the check or cross drawn on an answered marble.
const PALETTES: Record<MarbleLook, Record<string, string>> = {
  empty: {
    k: '#9aa3b5',
    f: '#f4f6fa',
    l: '#ffffff',
    s: '#e1e6ee',
    g: '#ffffff'
  },
  locked: {
    k: '#5b6270',
    l: '#e2e5ea',
    f: '#c3c8d1',
    s: '#a5abb6',
    d: '#8a909c',
    g: '#f4f6fa'
  },
  clear: {
    k: '#22314d',
    l: '#ffffff',
    f: '#cfeafd',
    s: '#93c8ef',
    d: '#6fa9d8',
    g: '#ffffff',
    m: '#1f4e7a'
  },
  // a right answer: green (Mikey 11-15), deep enough for the white check
  shiny: {
    k: '#123a22',
    l: '#8fe3a8',
    f: '#279e50',
    s: '#1f8443',
    d: '#16612f',
    g: '#ffffff',
    m: '#ffffff'
  },
  gold: {
    k: '#4a2f00',
    l: '#fff1a8',
    f: '#ffcb32',
    s: '#e0a000',
    d: '#a87200',
    g: '#ffffff',
    m: '#5a3a00'
  },
  dull: {
    k: '#3a3f4d',
    l: '#d6d9de',
    f: '#a7adb6',
    s: '#8a909a',
    d: '#6f747d',
    g: '#eef0f3',
    m: '#3a3f4d'
  }
};

const CHECK = [
  '......m',
  '.....mm',
  'm...mm.',
  'mm.mm..',
  '.mmm...',
  '..m....'
];
const CROSS = [
  'mm..mm',
  '.mmmm.',
  '..mm..',
  '..mm..',
  '.mmmm.',
  'mm..mm'
];
const MARK: Partial<Record<MarbleLook, string[]>> = {
  clear: CHECK,
  shiny: CHECK,
  gold: CHECK,
  dull: CROSS
};

const LABEL: Record<MarbleLook, string> = {
  empty: '#7b8496',
  locked: '#5b6270',
  clear: '#1f4e7a',
  shiny: '#ffffff',
  gold: '#5a3a00',
  dull: '#ffffff'
};

const uriCache = new Map<string, string>();
export function questMarbleUri(look: MarbleLook, size: number) {
  const art = Math.max(8, size >= 16 ? Math.round(size / 2) : Math.round(size));
  const key = `${look}|${art}`;
  let uri = uriCache.get(key);
  if (!uri) {
    const rows = discRows(art, { sphere: look !== 'empty', dotted: look === 'empty' });
    const mark = MARK[look];
    uri = pixelSvg(mark && art >= 10 ? withMark(rows, mark) : rows, PALETTES[look]);
    uriCache.set(key, uri);
  }
  return uri;
}

// the mark drawn over the middle of the disc (a pixel low when it can't
// sit exactly, clear of the top-left glint)
function withMark(rows: string[], mark: string[]) {
  const top = Math.ceil((rows.length - mark.length) / 2);
  const left = Math.floor((rows[0].length - mark[0].length) / 2);
  return rows.map((row, y) => {
    const line = mark[y - top];
    if (!line) return row;
    return row.split('').map((ch, x) => line[x - left] === 'm' ? 'm' : ch).join('');
  });
}

const baseCls = css`
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  font-family: ${PIXEL_FONT};
  line-height: 1;
  background-size: 100% 100%;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  vertical-align: middle;
`;

const dullCls = css`
  opacity: 0.85;
`;
