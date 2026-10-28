import React from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import type { QuestWorld } from './types';
import PixelIcon from './PixelIcon';
import { GOLD, INK, PIXEL_FONT, button, frame } from './pixelUi';
import { WORLD_MASTERY_ART } from './worldMasteryArt';

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
      <figure className={artCls}>
        <img
          src={WORLD_MASTERY_ART[world.key]}
          alt=""
          width={480}
          height={320}
          decoding="async"
        />
        <figcaption>{world.name}</figcaption>
      </figure>
      <div className={summaryCls}>
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
  display: grid;
  grid-template-columns: 18rem minmax(0, 1fr) auto auto;
  grid-template-areas: 'art summary progress collect';
  align-items: center;
  gap: 0.6rem 1.6rem;
  padding: 0.6rem 1.2rem 0.6rem 0.6rem;
  min-width: 0;
  @media (max-width: 850px) {
    grid-template-columns: 12rem minmax(0, 1fr);
    grid-template-areas:
      'art summary'
      'progress progress'
      'collect collect';
    gap: 0.8rem 1.2rem;
    padding: 0.8rem;
  }
`;
const artCls = css`
  grid-area: art;
  position: relative;
  margin: 0;
  overflow: hidden;
  border: 2px solid ${INK};
  background: ${INK};
  img {
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: 3 / 2;
  }
  figcaption {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 0.3rem 0.4rem;
    background: ${INK};
    color: #fff1a8;
    text-align: center;
    font-size: 1.1rem;
    line-height: 1.2;
    font-weight: 800;
  }
`;
const summaryCls = css`
  grid-area: summary;
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
  grid-area: progress;
  min-width: 0;
  font-size: 1.3rem;
  line-height: 1.5;
`;
const hintCls = css`
  font-size: 1.1rem;
`;
const collectCls = css`
  ${button(GOLD, '#8a5200')}
  grid-area: collect;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
  font-size: 1.3rem;
  font-weight: 800;
  min-height: 44px;
  padding: 0.6rem 1.2rem;
`;
