import React, { useState } from 'react';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css, cx } from '@emotion/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import Icon from '~/components/Icon';
import FullTextReveal from '~/components/Texts/FullTextReveal';
import {
  PLATINUM_THEME,
  PROFILE_THEME_LADDER,
  PROFILE_THEME_XP,
  profileThemeLabel
} from '~/constants/profileThemes';

// Theme and status-color picker. `compact` is a row of swatches (status
// colors); `ladder` is the profile theme ladder: every theme by name with what
// it costs, and how far the member is from the next one. Locks follow the
// shared XP ladder (constants/profileThemes.ts; the server enforces it too).
export default function ColorSelector({
  colors,
  setColor,
  selectedColor,
  style,
  twinkleXP,
  variant = 'compact',
  newThemes = []
}: {
  colors: string[];
  setColor: (color: string) => void;
  selectedColor: string;
  style?: React.CSSProperties;
  twinkleXP: number;
  variant?: 'compact' | 'ladder';
  newThemes?: string[];
}) {
  const [hovered, setHovered] = useState('');
  const xp = Number(twinkleXP || 0);
  const ordered =
    variant === 'ladder'
      ? PROFILE_THEME_LADDER.map((t) => t.theme).filter((t) =>
          colors.includes(t)
        )
      : colors;

  if (variant === 'compact') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '0.6rem',
          width: '100%',
          ...style
        }}
      >
        {ordered.map((color) => {
          const unlocked = unlockedAt(color, xp);
          return (
            <div key={color} style={{ position: 'relative' }}>
              <button
                type="button"
                aria-label={`${profileThemeLabel(color)}${unlocked ? '' : `, unlocks at ${addCommasToNumber(PROFILE_THEME_XP[color] || 0)} XP`}`}
                aria-pressed={selectedColor === color}
                className={cx(
                  swatchClass,
                  selectedColor === color && selectedSwatchClass
                )}
                style={swatchStyle(color, unlocked)}
                onClick={unlocked ? () => setColor(color) : undefined}
                onMouseEnter={() => setHovered(color)}
                onMouseLeave={() => setHovered('')}
              >
                {!unlocked && (
                  <Icon
                    style={{ color: '#fff', fontSize: '1.1rem' }}
                    icon="lock"
                  />
                )}
              </button>
              {!unlocked && hovered === color && (
                <FullTextReveal
                  show
                  direction="left"
                  style={{
                    color: '#000',
                    fontSize: '1.3rem',
                    textAlign: 'center'
                  }}
                  text={`Requires ${addCommasToNumber(PROFILE_THEME_XP[color] || 0)} XP`}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  const next = PROFILE_THEME_LADDER.find(
    (t) => ordered.includes(t.theme) && xp < t.xp
  );
  const previousXP = next
    ? Math.max(
        0,
        ...PROFILE_THEME_LADDER.filter((t) => t.xp < next.xp).map((t) => t.xp)
      )
    : 0;
  const progress = next
    ? Math.min(1, Math.max(0, (xp - previousXP) / (next.xp - previousXP)))
    : 1;

  return (
    <div className={ladderClass} style={style}>
      <div
        className={ladderGridClass}
        role="radiogroup"
        aria-label="Profile theme"
      >
        {ordered.map((color) => {
          const unlocked = unlockedAt(color, xp);
          const cost = PROFILE_THEME_XP[color] || 0;
          const isNew = unlocked && newThemes.includes(color);
          return (
            <button
              key={color}
              type="button"
              role="radio"
              aria-checked={selectedColor === color}
              aria-disabled={!unlocked}
              className={cx(
                tileClass,
                selectedColor === color && selectedTileClass,
                !unlocked && lockedTileClass,
                color === PLATINUM_THEME && platinumTileClass
              )}
              onClick={unlocked ? () => setColor(color) : undefined}
            >
              <span
                className={tileSwatchClass}
                style={swatchStyle(color, unlocked)}
                aria-hidden="true"
              >
                {!unlocked && (
                  <Icon
                    icon="lock"
                    style={{ color: '#fff', fontSize: '1rem' }}
                  />
                )}
              </span>
              <span className={tileNameClass}>{profileThemeLabel(color)}</span>
              <span className={tileCostClass}>
                {isNew
                  ? 'New'
                  : cost === 0
                    ? 'Free'
                    : unlocked
                      ? 'Unlocked'
                      : `${shortXP(cost)} XP`}
              </span>
            </button>
          );
        })}
      </div>
      {next && (
        <div className={nextClass}>
          <div className={nextLineClass}>
            <span>
              Next: <b>{profileThemeLabel(next.theme)}</b>
              {next.theme === PLATINUM_THEME ? ' · your own cover photo' : ''}
            </span>
            <span className={nextNumbersClass}>
              {addCommasToNumber(xp)} / {addCommasToNumber(next.xp)} XP
            </span>
          </div>
          <div className={barClass} aria-hidden="true">
            <i style={{ transform: `scaleX(${progress})` }} />
          </div>
        </div>
      )}
    </div>
  );
}

// Status colors include shades that are not themes (ivory, darkGray): free.
function unlockedAt(color: string, xp: number) {
  return xp >= (PROFILE_THEME_XP[color] ?? 0);
}

function shortXP(xp: number) {
  if (xp >= 1_000_000) return `${xp / 1_000_000}M`;
  if (xp >= 1_000) return `${xp / 1_000}K`;
  return String(xp);
}

function swatchStyle(color: string, unlocked: boolean): React.CSSProperties {
  const fill =
    color === PLATINUM_THEME
      ? 'linear-gradient(115deg, #a9b0ba 0%, #fbfcfd 35%, #c9ced6 55%, #8e96a1 78%, #e9ecf0 100%)'
      : (Color as any)[color]?.() || color;
  return {
    background: fill,
    cursor: unlocked ? 'pointer' : 'default',
    opacity: unlocked ? 1 : 0.55
  };
}

const swatchClass = css`
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  border: 0.45rem solid #fff;
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.08),
    0 2px 6px rgba(0, 0, 0, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition:
    transform 160ms ease,
    box-shadow 160ms ease;
  &:focus-visible {
    outline: 3px solid rgba(65, 140, 235, 0.6);
    outline-offset: 2px;
  }
  @media (max-width: ${mobileMaxWidth}) {
    width: 2.4rem;
    height: 2.4rem;
    border-width: 0.35rem;
  }
`;
const selectedSwatchClass = css`
  border-width: 0;
  box-shadow:
    0 0 0 3px #fff,
    0 0 0 5px rgba(40, 45, 52, 0.55);
  transform: scale(1.06);
`;

const ladderClass = css`
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  width: 100%;
`;
const ladderGridClass = css`
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.6rem;
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.4rem;
  }
`;
const tileClass = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  min-width: 0;
  padding: 0.7rem 0.3rem 0.6rem;
  border: 1px solid rgba(40, 45, 52, 0.1);
  border-radius: 12px;
  background: #fff;
  color: #2b3038;
  cursor: pointer;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;
  &:hover:not([aria-disabled='true']) {
    border-color: rgba(40, 45, 52, 0.28);
    transform: translateY(-1px);
  }
  &:focus-visible {
    outline: 3px solid rgba(65, 140, 235, 0.6);
    outline-offset: 2px;
  }
`;
const selectedTileClass = css`
  border-color: rgba(40, 45, 52, 0.75);
  box-shadow: 0 0 0 2px rgba(40, 45, 52, 0.18);
`;
const lockedTileClass = css`
  cursor: default;
  background: #f6f7f9;
  color: #7a828e;
`;
const platinumTileClass = css`
  background: linear-gradient(160deg, #ffffff 0%, #eef0f3 100%);
`;
const tileSwatchClass = css`
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    inset 0 0 0 1px rgba(0, 0, 0, 0.08),
    0 1px 3px rgba(0, 0, 0, 0.12);
`;
const tileNameClass = css`
  font-size: 1.15rem;
  font-weight: 700;
  line-height: 1.2;
  text-align: center;
  overflow-wrap: anywhere;
`;
const tileCostClass = css`
  font-size: 1rem;
  font-weight: 600;
  color: inherit;
  opacity: 0.75;
  font-variant-numeric: tabular-nums;
`;
const nextClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  color: #3a4049;
  font-size: 1.2rem;
`;
const nextLineClass = css`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
`;
const nextNumbersClass = css`
  font-variant-numeric: tabular-nums;
  color: #6b7380;
`;
const barClass = css`
  height: 6px;
  border-radius: 999px;
  background: #e6e9ee;
  overflow: hidden;
  i {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, #8e96a1, #d5d9df);
    transform-origin: left center;
  }
`;
