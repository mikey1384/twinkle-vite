import React from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import type { QuestWorld } from './types';
import PixelIcon from './PixelIcon';
import { GOLD, INK, PIXEL_FONT, button, frame } from './pixelUi';

export default function WorldMastery({
  world, busy, collecting, onCollect
}: {
  world: QuestWorld;
  busy: boolean;
  collecting: boolean;
  onCollect: () => void;
}) {
  const bonus = world.mastery;
  if (!bonus) return null;
  return (
    <section className={wrapCls} aria-label={`World ${world.id} all-S bonus`}>
      <div>
        <div className={titleCls}>
          <PixelIcon name={bonus.claimed ? 'check' : 'star'} scale={2} />
          {bonus.claimed ? 'ALL S · BONUS COLLECTED' : 'ALL S · ONE-TIME BONUS'}
        </div>
        <div className={rewardsCls}>
          <span>{bonus.xp.toLocaleString()} XP</span>
          <span>{bonus.coins.toLocaleString()} Coins</span>
        </div>
      </div>
      <div className={progressCls}>
        <div><b>{world.sMarbles} / {world.nodeCount}</b> levels at S</div>
        <div className={hintCls}>
          {bonus.claimed ? 'This world’s bonus is yours.' : 'Get S on every stop, fort and castle.'}
        </div>
      </div>
      {bonus.eligible && !bonus.claimed && (
        <button className={collectCls} disabled={busy} aria-busy={collecting} onClick={onCollect}>
          {collecting ? <><Icon icon="spinner" pulse /> Collecting…</> : 'Collect bonus'}
        </button>
      )}
    </section>
  );
}

const wrapCls = css`
  ${frame(GOLD, 2)}
  grid-area: mastery;
  color: ${INK};
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.6rem 1.6rem;
  padding: 0.8rem 1.2rem;
  min-width: 0;
`;
const titleCls = css`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-family: ${PIXEL_FONT};
  font-size: 1rem;
  line-height: 1.8;
`;
const rewardsCls = css`
  display: flex;
  flex-wrap: wrap;
  gap: 0.2rem 1.6rem;
  font-size: 1.8rem;
  line-height: 1.4;
  font-weight: 800;
  span { white-space: nowrap; }
`;
const progressCls = css`
  font-size: 1.3rem;
  line-height: 1.5;
`;
const hintCls = css`
  font-size: 1.1rem;
`;
const collectCls = css`
  ${button(GOLD, '#8a5200')}
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
  font-size: 1.3rem;
  font-weight: 800;
  min-height: 44px;
  padding: 0.6rem 1.2rem;
`;
