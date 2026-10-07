import React from 'react';
import { css, cx } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { GOLD, INK, PIXEL_FONT, PLATE, frame } from './Quest/pixelUi';
import { NEON, rgba } from './ClassicArcade/theme';

export type NavLook = 'quest' | 'classic' | 'menu';
export interface NavTab {
  key: string;
  label: string;
}

// Grammarbles' own top bar, drawn in the game's look (Mikey 10-07: the site's
// filter bar didn't match the games). Quest gets pixel plates like its map
// chips, Classic and the game menu get arcade neon. Home leaves the page;
// Games goes back to the menu.
export default function GameNav({
  look,
  tabs = [],
  active,
  onTab,
  onHome,
  onGames,
  slot
}: {
  look: NavLook;
  tabs?: NavTab[];
  active?: string;
  onTab?: (key: string) => void;
  onHome: () => void;
  onGames?: () => void;
  // where a game may put its own status chips (see navSlot.ts)
  slot?: (el: HTMLDivElement | null) => void;
}) {
  const btn = look === 'quest' ? plateCls : neonCls;
  const on = look === 'quest' ? plateOnCls : neonOnCls;
  return (
    <nav className={barCls}>
      <button className={cx(btn, backCls)} onClick={onHome}>
        ◀ Home
      </button>
      {onGames && (
        <button className={cx(btn, backCls)} onClick={onGames}>
          ◀ Games
        </button>
      )}
      <div ref={slot} className={slotCls} />
      {tabs.length > 0 && (
        <div className={tabsCls}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={cx(btn, tab.key === active && on)}
              aria-current={tab.key === active ? 'page' : undefined}
              onClick={() => onTab?.(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}

const barCls = css`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.8rem;
  padding: 1.2rem 0 1.4rem;
  @media (max-width: ${mobileMaxWidth}) {
    gap: 0.5rem;
    padding: 0.8rem 0.8rem 1rem;
  }
  /* phones on their side: one slim row; the status chips scroll sideways */
  @media (max-height: 520px) and (orientation: landscape) {
    flex-wrap: nowrap;
    gap: 0.4rem;
    padding: 0.4rem 0.6rem 0.5rem;
  }
`;
const tabsCls = css`
  display: flex;
  gap: 0.8rem;
  @media (max-width: ${mobileMaxWidth}) {
    gap: 0.5rem;
  }
`;
const slotCls = css`
  flex: 1;
  display: flex;
  justify-content: flex-end;
  min-width: 0;
  &:empty {
    min-height: 0;
  }
  @media (max-width: ${mobileMaxWidth}) {
    /* phones: the chips get their own row, scrolling sideways */
    order: 3;
    flex-basis: 100%;
    justify-content: flex-start;
    flex-wrap: nowrap;
    overflow-x: auto;
  }
  @media (max-height: 520px) and (orientation: landscape) {
    order: 0;
    flex: 1 1 0;
    flex-basis: auto;
    min-width: 0;
    justify-content: flex-start;
    flex-wrap: nowrap;
    overflow-x: auto;
  }
`;
const backCls = css`
  opacity: 0.92;
`;

const plateCls = css`
  ${frame(PLATE, 2)}
  min-height: 4.4rem;
  padding: 0 1.4rem;
  font-family: ${PIXEL_FONT};
  font-size: 1.1rem;
  color: #fff3d0;
  white-space: nowrap;
  cursor: pointer;
  transition: transform 0.06s;
  &:active {
    transform: translateY(2px);
  }
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 0.95rem;
    padding: 0 0.9rem;
  }
  @media (max-height: 520px) and (orientation: landscape) {
    min-height: 3.4rem;
    padding: 0 0.7rem;
    font-size: 0.85rem;
  }
`;
const plateOnCls = css`
  ${frame(GOLD, 2)}
  color: ${INK};
`;

const neonCls = css`
  min-height: 4.4rem;
  padding: 0 1.4rem;
  border-radius: 12px;
  font-family: ${PIXEL_FONT};
  font-size: 1.05rem;
  letter-spacing: 0.04em;
  color: ${NEON.cyan};
  text-shadow: 0 0 6px ${rgba(NEON.cyanRgb, 0.7)};
  background: linear-gradient(
    180deg,
    rgba(28, 36, 110, 0.85) 0%,
    rgba(12, 14, 56, 0.92) 100%
  );
  border: 2px solid ${rgba(NEON.cyanRgb, 0.55)};
  white-space: nowrap;
  cursor: pointer;
  transition: transform 0.06s;
  &:active {
    transform: translateY(2px);
  }
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 0.9rem;
    padding: 0 0.9rem;
  }
  @media (max-height: 520px) and (orientation: landscape) {
    min-height: 3.4rem;
    padding: 0 0.7rem;
    font-size: 0.85rem;
  }
`;
const neonOnCls = css`
  color: ${NEON.navy};
  text-shadow: none;
  background: ${NEON.cyan};
  border-color: ${NEON.cyan};
  box-shadow: 0 0 14px ${rgba(NEON.cyanRgb, 0.7)};
`;
