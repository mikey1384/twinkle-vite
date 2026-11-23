import React, { useEffect, useRef, useState } from 'react';
import { css, cx } from '@emotion/css';
import Icon from '~/components/Icon';
import { badgeStyle } from '~/components/WordMasterBadges';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { LOOT_ICONS } from './art';
import { playBattleSound } from './battleSfx';
import { dropTitle, LootDrop, LootSummary, pointsLabel, rarityOf, Rarity } from './loot';

const PIXEL_FONT = "'Press Start 2P', monospace";
// The first slot opens after this, the next ones after SLOT_MS each.
const FIRST_SLOT_MS = 450;
const SLOT_MS = 800;

const RARITY_COLOR: Record<Rarity, string> = {
  common: '#ffffff',
  rare: '#4aa8ff',
  epic: '#c27bff',
  legendary: '#ff9a2e'
};

function soundFor(drop: LootDrop) {
  if (drop.kind === 'points' && drop.tier === 'massive') return 'massiveDrop' as const;
  return rarityOf(drop) === 'common' ? ('drop' as const) : ('rareDrop' as const);
}

// The battle's loot window: what was always paid on one line (base points,
// and XP and Coins on a win), then every drop in its own slot, opened one by
// one with its rarity's flair. A tap anywhere opens the rest at once.
export default function LootWindow({
  summary,
  won,
  instant,
  onRevealed
}: {
  summary: LootSummary;
  won: boolean;
  instant?: boolean;
  onRevealed: () => void;
}) {
  const { drops } = summary;
  const [shown, setShown] = useState(instant ? drops.length : 0);
  const playedRef = useRef(instant ? drops.length : 0);
  const revealedRef = useRef(false);
  const onRevealedRef = useRef(onRevealed);
  onRevealedRef.current = onRevealed;

  useEffect(() => {
    if (shown > playedRef.current) {
      // A skip opens several at once: one sound, the best of them.
      const opened = drops.slice(playedRef.current, shown);
      playedRef.current = shown;
      const best = opened[opened.length - 1];
      if (best) playBattleSound(soundFor(best));
    }
    if (shown >= drops.length) {
      if (!revealedRef.current) {
        revealedRef.current = true;
        onRevealedRef.current();
      }
      return;
    }
    const timer = window.setTimeout(
      () => setShown((count) => count + 1),
      shown === 0 ? FIRST_SLOT_MS : SLOT_MS
    );
    return () => window.clearTimeout(timer);
  }, [drops, shown]);

  const skippable = shown < drops.length;
  return (
    <div
      className={cx(windowCls, skippable && skippableCls)}
      data-testid="battle-loot-window"
      onClick={skippable ? () => setShown(drops.length) : undefined}
      role={skippable ? 'button' : undefined}
      tabIndex={skippable ? 0 : undefined}
      aria-label={skippable ? 'Show all the loot' : undefined}
      onKeyDown={
        skippable
          ? (event) => {
              if (event.key === ' ' || event.key === 'Enter') {
                event.preventDefault();
                setShown(drops.length);
              }
            }
          : undefined
      }
    >
      <div className={titleCls}>{won ? 'LOOT' : 'FOR PLAYING'}</div>
      <div className={paidRowCls} data-testid="battle-reward-chips">
        {summary.basePoints > 0 && (
          <div className={badgeStyle('passionFruit', 0.85)}>
            <span className="label">{pointsLabel(summary.basePoints)}</span>
          </div>
        )}
        {summary.xp > 0 && (
          <div className={badgeStyle('limeGreen', 0.85)}>
            <Icon icon={['far', 'star']} />
            <span className="label">{addCommasToNumber(summary.xp)} XP</span>
          </div>
        )}
        {summary.coins > 0 && (
          <div className={badgeStyle('gold', 0.85)}>
            <Icon icon="coins" />
            <span className="label">{addCommasToNumber(summary.coins)}</span>
          </div>
        )}
      </div>
      {drops.length > 0 && (
        <div className={slotsCls}>
          {drops.map((drop, i) =>
            i < shown ? (
              <DropSlot key={i} drop={drop} />
            ) : (
              <div key={i} className={closedSlotCls} aria-hidden="true">
                ?
              </div>
            )
          )}
        </div>
      )}
      {won && drops.length === 0 && (
        <div className={noDropCls}>Nothing else dropped this time.</div>
      )}
      {skippable && (
        <div className={skipHintCls} aria-hidden="true">
          <span className={skipArrowCls}>▼</span> tap to skip
        </div>
      )}
    </div>
  );
}

function DropSlot({ drop }: { drop: LootDrop }) {
  const rarity = rarityOf(drop);
  const massive = drop.kind === 'points' && drop.tier === 'massive';
  const color = RARITY_COLOR[rarity];
  return (
    <div
      className={cx(slotCls, rarity !== 'common' && glowCls, massive && massiveCls)}
      style={{ borderColor: color, ['--glow' as any]: color }}
      data-testid={`loot-slot-${drop.kind}`}
      data-rarity={rarity}
    >
      {massive ? null : drop.kind === 'points' ? (
        <div className={cx(badgeStyle('passionFruit', 0.85), chipCls, rarity !== 'common' && bigChipCls)}>
          <span className="label">{pointsLabel(drop.points)}</span>
        </div>
      ) : (
        <img
          src={drop.kind === 'black_ai_card' ? LOOT_ICONS.card : LOOT_ICONS.battery}
          alt=""
          className={slotIconCls}
        />
      )}
      <span className={cx(slotTitleCls, massive && massiveTitleCls)} style={{ color }}>
        {dropTitle(drop)}
      </span>
    </div>
  );
}

const windowCls = css`
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: #0f0b1a;
  border: 3px solid #ffffff;
  box-shadow: 0 0 0 3px #0f0b1a, inset 0 0 0 3px #2c2442;
`;

const skippableCls = css`
  cursor: pointer;
  &:focus-visible {
    outline: 3px solid #ffd34d;
    outline-offset: 2px;
  }
`;

const titleCls = css`
  font-family: ${PIXEL_FONT};
  font-size: 11px;
  letter-spacing: 2px;
  color: #ffd34d;
`;

const paidRowCls = css`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
`;

const slotsCls = css`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const slotBase = `
  box-sizing: border-box;
  min-height: 52px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: #1d1630;
  border: 3px solid #ffffff;
`;

const slotCls = css`
  ${slotBase}
  animation: loot-slot-open 0.3s steps(3) 1;
  @keyframes loot-slot-open {
    0% {
      transform: scale(0.85);
      opacity: 0;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const closedSlotCls = css`
  ${slotBase}
  justify-content: center;
  border-color: #3a3150;
  color: #5e5478;
  font-family: ${PIXEL_FONT};
  font-size: 12px;
`;

const glowCls = css`
  box-shadow: 0 0 0 2px #0f0b1a, 0 0 12px var(--glow);
`;

// The massive drop: a bigger slot that pulses in gold-orange light.
const massiveCls = css`
  min-height: 68px;
  background: #2a1a0c;
  animation:
    loot-slot-open 0.3s steps(3) 1,
    loot-massive 0.7s steps(2) 6;
  @keyframes loot-massive {
    0% {
      box-shadow: 0 0 0 2px #0f0b1a, 0 0 6px var(--glow);
    }
    100% {
      box-shadow: 0 0 0 2px #0f0b1a, 0 0 26px var(--glow);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const chipCls = css`
  white-space: nowrap;
  flex-shrink: 0;
`;

const massiveTitleCls = css`
  width: 100%;
  text-align: center;
  font-size: 13px;
  @media (max-width: 480px) {
    font-size: 11px;
  }
`;

const bigChipCls = css`
  outline: 2px solid #ffffff;
  transform: scale(1.1);
`;

const slotIconCls = css`
  width: 36px;
  height: 36px;
  image-rendering: pixelated;
  flex-shrink: 0;
`;

const slotTitleCls = css`
  font-family: ${PIXEL_FONT};
  font-size: 10px;
  line-height: 1.6;
  overflow-wrap: anywhere;
`;

const noDropCls = css`
  font-family: ${PIXEL_FONT};
  font-size: 9px;
  color: #a99fc4;
`;

const skipHintCls = css`
  font-family: ${PIXEL_FONT};
  font-size: 9px;
  color: #a99fc4;
`;

const skipArrowCls = css`
  display: inline-block;
  color: #ffffff;
  animation: loot-skip-arrow 0.8s steps(2) infinite;
  @keyframes loot-skip-arrow {
    50% {
      transform: translateY(3px);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;
