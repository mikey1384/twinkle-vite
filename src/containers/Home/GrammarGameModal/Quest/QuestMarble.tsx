import React from 'react';
import { css, cx } from '@emotion/css';
import { discRows, pixelSvg, PIXEL_FONT } from './pixelUi';

// Quest's marbles (Mikey 10-07: Quest must be a Grammarbles game too). Every
// grammar point is a marble you polish: clear (seen), shiny (solid), gold
// (mastered). In a run, each question is a marble slot: a right answer fills
// it, brighter as the combo grows; a miss leaves a dull one.

export type MarbleLook =
  'empty' | 'clear' | 'shiny' | 'hot' | 'gold' | 'dull' | 'locked';

export function tierLook(tier: number | null | undefined): MarbleLook {
  return tier === 3
    ? 'gold'
    : tier === 2
      ? 'shiny'
      : tier === 1
        ? 'clear'
        : 'empty';
}

// A run's answer: right answers glow brighter with the combo.
export function answerLook(isCorrect: boolean, combo: number): MarbleLook {
  if (!isCorrect) return 'dull';
  return combo >= 5 ? 'gold' : combo >= 3 ? 'hot' : 'shiny';
}

export const MARBLE_NAMES: Record<number, string> = {
  0: 'not started',
  1: 'clear',
  2: 'shiny',
  3: 'gold'
};

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
        backgroundImage: `url("${marbleUri(look, size)}")`,
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
    g: '#ffffff'
  },
  shiny: {
    k: '#22314d',
    l: '#a9d4ff',
    f: '#418ceb',
    s: '#2f6fd1',
    d: '#244f9a',
    g: '#ffffff'
  },
  hot: {
    k: '#22314d',
    l: '#ffa6d6',
    f: '#df3296',
    s: '#b0216f',
    d: '#7f1650',
    g: '#ffffff'
  },
  gold: {
    k: '#4a2f00',
    l: '#fff1a8',
    f: '#ffcb32',
    s: '#e0a000',
    d: '#a87200',
    g: '#ffffff'
  },
  dull: {
    k: '#3a3f4d',
    l: '#d6d9de',
    f: '#a7adb6',
    s: '#8a909a',
    d: '#6f747d',
    g: '#eef0f3'
  }
};

const LABEL: Record<MarbleLook, string> = {
  empty: '#7b8496',
  locked: '#5b6270',
  clear: '#1f4e7a',
  shiny: '#ffffff',
  hot: '#ffffff',
  gold: '#5a3a00',
  dull: '#ffffff'
};

const uriCache = new Map<string, string>();
function marbleUri(look: MarbleLook, size: number) {
  const art = Math.max(8, size >= 16 ? Math.round(size / 2) : Math.round(size));
  const key = `${look}|${art}`;
  let uri = uriCache.get(key);
  if (!uri) {
    uri = pixelSvg(
      discRows(art, { sphere: look !== 'empty', dotted: look === 'empty' }),
      PALETTES[look]
    );
    uriCache.set(key, uri);
  }
  return uri;
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
