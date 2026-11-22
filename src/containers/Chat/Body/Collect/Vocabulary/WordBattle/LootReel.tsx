import React, { useEffect, useMemo, useRef, useState } from 'react';
import { css, cx } from '@emotion/css';
import { LOOT_ICONS, LootIcon } from './art';
import { playBattleSound } from './battleSfx';

const ICON_PX = 96;
const STRIP_LENGTH = 26;
const SPIN_MS = 2100;

export function lootIconFor(kind: string): LootIcon {
  if (kind === 'xp') return 'xp';
  if (kind === 'energy_recharge') return 'battery';
  if (kind === 'black_ai_card') return 'card';
  return 'dust';
}

// The slot reveal: one reel spins past every kind of drop and lands on what
// the server already decided. A rare drop lands with a gold flash.
export default function LootReel({
  kind,
  instant,
  onLanded
}: {
  kind: string;
  instant?: boolean;
  onLanded: () => void;
}) {
  const target = lootIconFor(kind);
  const strip = useMemo(() => {
    const cycle: LootIcon[] = ['dust', 'xp', 'card', 'dust', 'battery', 'xp', 'dust', 'xp'];
    const icons: LootIcon[] = [];
    for (let i = 0; i < STRIP_LENGTH - 1; i++) icons.push(cycle[i % cycle.length]);
    // a near miss right before a plain landing makes the reel feel alive
    if (target === 'dust' || target === 'xp') icons[STRIP_LENGTH - 2] = 'card';
    icons.push(target);
    return icons;
  }, [target]);
  const [spun, setSpun] = useState(Boolean(instant));
  const [landed, setLanded] = useState(Boolean(instant));
  const onLandedRef = useRef(onLanded);
  onLandedRef.current = onLanded;
  const rare = target === 'battery' || target === 'card';

  useEffect(() => {
    if (instant) {
      onLandedRef.current();
      return;
    }
    const start = window.setTimeout(() => setSpun(true), 60);
    const ticks: number[] = [];
    for (let i = 0; i < 9; i++) {
      ticks.push(window.setTimeout(() => playBattleSound('reelTick'), 80 + i * i * 22));
    }
    const done = window.setTimeout(() => {
      setLanded(true);
      playBattleSound(rare ? 'rareDrop' : target === 'dust' ? 'nothing' : 'drop');
      onLandedRef.current();
    }, SPIN_MS + 120);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(done);
      ticks.forEach((id) => window.clearTimeout(id));
    };
  }, [instant, rare, target]);

  return (
    <div className={cx(reelFrameCls, landed && rare && rareCls)} data-testid="loot-reel">
      <div className={windowCls}>
        <div
          className={stripCls}
          style={{
            transform: `translateY(-${(spun ? STRIP_LENGTH - 1 : 0) * ICON_PX}px)`,
            transition: spun && !instant ? `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.72, 0.18, 1)` : 'none'
          }}
        >
          {strip.map((icon, i) => (
            <img
              key={i}
              src={LOOT_ICONS[icon]}
              alt=""
              draggable={false}
              className={iconCls}
              style={{ width: ICON_PX - 20, height: ICON_PX - 20 }}
            />
          ))}
        </div>
      </div>
      {landed && rare && <div className={sparkCls} aria-hidden />}
    </div>
  );
}

const reelFrameCls = css`
  position: relative;
  width: ${ICON_PX + 24}px;
  height: ${ICON_PX + 24}px;
  padding: 9px;
  background: #0f0b1a;
  border: 3px solid #ffffff;
  box-shadow: 0 0 0 3px #0f0b1a, inset 0 0 0 3px #2c2442;
  margin: 0 auto;
`;

const rareCls = css`
  border-color: #ffd34d;
  animation: reel-rare 0.9s steps(2) 3;
  @keyframes reel-rare {
    0% {
      box-shadow: 0 0 0 3px #0f0b1a, 0 0 0 9px #ffd34d;
    }
    100% {
      box-shadow: 0 0 0 3px #0f0b1a, 0 0 0 3px #ffd34d;
    }
  }
`;

const windowCls = css`
  width: ${ICON_PX}px;
  height: ${ICON_PX}px;
  overflow: hidden;
  background: #1d1630;
`;

const stripCls = css`
  display: flex;
  flex-direction: column;
`;

const iconCls = css`
  display: block;
  margin: 10px;
  image-rendering: pixelated;
  flex-shrink: 0;
`;

const sparkCls = css`
  position: absolute;
  inset: -26px;
  pointer-events: none;
  &::before,
  &::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    width: 4px;
    height: 4px;
    background: #ffd34d;
    box-shadow:
      -70px -40px 0 #ffd34d, -74px -40px 0 #ffd34d, -66px -40px 0 #ffd34d, -70px -44px 0 #ffd34d, -70px -36px 0 #ffd34d,
      66px -52px 0 #ffffff, 62px -52px 0 #ffffff, 70px -52px 0 #ffffff, 66px -56px 0 #ffffff, 66px -48px 0 #ffffff,
      74px 40px 0 #ffd34d, 70px 40px 0 #ffd34d, 78px 40px 0 #ffd34d, 74px 36px 0 #ffd34d, 74px 44px 0 #ffd34d,
      -62px 54px 0 #ffffff, -66px 54px 0 #ffffff, -58px 54px 0 #ffffff, -62px 50px 0 #ffffff, -62px 58px 0 #ffffff;
    animation: reel-spark 0.5s steps(2) infinite alternate;
  }
  &::after {
    transform: translate(10px, -70px) scale(1);
    animation-delay: 0.25s;
  }
  @keyframes reel-spark {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
`;
