import React, { useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavSlotContext } from '../navSlot';
import { css, cx } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { WORLD_IMAGES, WORLD_THUMBS, nodePositions } from './layout';
import type { QuestNode, QuestState, QuestWorld } from './types';
import { isQuestMuted, playQuestSound, setQuestMuted } from './sfx';
import MusicToggle from './MusicToggle';
import { playMusic, stopMusic, OVERWORLD_TRACK } from './MarbleRun/music';
import QuestMarble, { MARBLE_NAMES, tierLook } from './QuestMarble';
import PixelIcon from './PixelIcon';
import {
  GOLD,
  INK,
  PARCHMENT,
  PIXEL_FONT,
  PLATE,
  STONE,
  TAG,
  WOOD,
  button,
  discRows,
  frame,
  inkShadow,
  pixelSvg
} from './pixelUi';

export default function WorldMap({
  state,
  world,
  selectedNodeId,
  onSelectWorld,
  onSelectNode,
  onPlayNode,
  onPlayNemesis,
  starting
}: {
  state: QuestState;
  world: QuestWorld;
  selectedNodeId: string | null;
  onSelectWorld: (id: number) => void;
  onSelectNode: (id: string) => void;
  onPlayNode: (node: QuestNode) => void;
  onPlayNemesis: () => void;
  starting: boolean;
}) {
  const positions = nodePositions(world.key, world.nodes.length);
  const selected =
    world.nodes.find((n) => n.id === selectedNodeId) ||
    world.nodes.find((n) => n.unlocked && !n.cleared) ||
    world.nodes[0];
  // display only: the node the player is up to pulses gold on the map
  const current = world.nodes.find((n) => n.unlocked && !n.cleared);
  const nemesisDue = state.nemesis.filter((n) => n.due);
  const [muted, setMuted] = useState(isQuestMuted);
  // phones scroll the wide map sideways: keep the picked stop in view
  const mapAreaRef = useRef<HTMLDivElement>(null);
  const selectedIndex = selected ? world.nodes.indexOf(selected) : -1;
  useEffect(() => {
    const area = mapAreaRef.current;
    const map = area?.firstElementChild as HTMLElement | null;
    if (!area || !map || area.scrollWidth <= area.clientWidth) return;
    const x = ((positions[selectedIndex]?.[0] ?? 50) / 100) * map.offsetWidth;
    area.scrollTo({ left: x - area.clientWidth / 2, behavior: 'smooth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world.id, selectedIndex]);

  // the map has its own overworld theme (world themes play in the levels);
  // leaving the map fades it out
  useEffect(() => {
    playMusic(OVERWORLD_TRACK);
    return () => stopMusic(0.6);
  }, []);

  function handleToggleSound() {
    const next = !muted;
    setQuestMuted(next);
    setMuted(next);
    if (!next) playQuestSound('select');
  }

  // the status chips ride in Grammarbles' top bar when it has room for them
  const navSlot = useContext(NavSlotContext);
  const chips = (
    <div className={chipsCls}>
      <span className={chipCls}>
        <QuestMarble look="gold" size={16} />
        <span className={chipNumCls}>
          {world.goldMarbles} / {world.points}
        </span>{' '}
        gold
      </span>
      <button
        className={cx(chipCls, nemesisCls)}
        disabled={!nemesisDue.length || starting}
        onClick={onPlayNemesis}
        title={
          state.nemesis.length
            ? state.nemesis.map((n) => n.nameEn).join(', ')
            : 'Points you keep missing come here'
        }
      >
        <PixelIcon name="ghost" />
        {state.nemesis.length
          ? `${nemesisDue.length ? `${nemesisDue.length} due` : `${state.nemesis.length} resting`}`
          : 'No nemesis'}
      </button>
      <span className={chipCls}>
        <PixelIcon name="book" />
        Rule Book{' '}
        <span className={chipNumCls}>
          {state.ruleBook.seen} / {state.ruleBook.total}
        </span>
      </span>
      <button
        className={cx(chipCls, soundCls)}
        onClick={handleToggleSound}
        aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
      >
        <PixelIcon name={muted ? 'soundOff' : 'soundOn'} />
      </button>
      <MusicToggle className={cx(chipCls, soundCls)} />
    </div>
  );

  return (
    <div className={cx(wrapCls, navSlot && noChipsRowCls)}>
      {navSlot ? createPortal(chips, navSlot) : chips}
      {/* the map fills the space left, keeping its painting's shape */}
      <div className={mapAreaCls} ref={mapAreaRef}>
        <div
          className={mapCls}
          style={{ backgroundImage: `url(${WORLD_IMAGES[world.key]})` }}
        >
          <div className={titleCls}>
            <div className={tierCls}>
              World {world.id} · {world.tier}
            </div>
            <div className={nameCls}>{world.name}</div>
          </div>
          {world.nodes.map((node, i) => {
            const [x, y] = positions[i];
            const big = node.kind !== 'stop';
            const at = { left: `${x}%`, top: `${y}%` };
            return (
              <React.Fragment key={node.id}>
                {/* effects sit beside the node so its shadow stays static */}
                {current?.id === node.id && (
                  <span
                    className={cx(pulseCls, big && bigPulseCls)}
                    style={at}
                    aria-hidden
                  />
                )}
                <button
                  className={cx(
                    nodeCls,
                    big && bigNodeCls,
                    big && node.unlocked && !node.cleared && bossNodeCls,
                    !big && node.unlocked && !node.cleared && goldNodeCls,
                    !node.unlocked && lockedCls,
                    !node.unlocked && 'gq-locked',
                    node.cleared && clearedCls,
                    node.cleared && 'gq-cleared',
                    selected?.id === node.id && selectedCls
                  )}
                  style={at}
                  onClick={() => onSelectNode(node.id)}
                  aria-label={node.name}
                >
                  {node.kind === 'stop' ? (
                    <span className={nodeNumCls}>{node.index}</span>
                  ) : (
                    <PixelIcon
                      name={node.kind === 'fort' ? 'tower' : 'crown'}
                      scale={2}
                      className={cx(nodeIconCls, !node.unlocked && greyIconCls)}
                    />
                  )}
                  {node.cleared && (
                    <PixelIcon name="flag" scale={2} className={flagCls} />
                  )}
                  {node.kind === 'stop' && node.unlocked && node.skills && (
                    <span className={nodeMarblesCls}>
                      {node.skills.map((skill) => (
                        <QuestMarble
                          key={skill.code}
                          look={tierLook(skill.stars)}
                          size={12}
                        />
                      ))}
                    </span>
                  )}
                </button>
                {selected?.id === node.id && (
                  <span
                    className={cx(pointerAnchorCls, big && bigPointerCls)}
                    style={at}
                    aria-hidden
                  >
                    <PixelIcon name="arrow" scale={3} className={pointerCls} />
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
      <div className={sideCls}>
        {selected && (
          <div className={panelCls}>
            <div className={panelBodyCls}>
              <div className={panelLabelCls}>
                {selected.kind === 'stop'
                  ? `Stop ${selected.index}`
                  : selected.kind === 'fort'
                    ? 'Fort · mini-boss'
                    : 'Castle · world boss'}
              </div>
              <div className={panelTitleCls}>{selected.name}</div>
              {selected.skills ? (
                <div className={skillListCls}>
                  {selected.skills.map((s) => (
                    <span key={s.code} className={skillChipCls}>
                      <QuestMarble
                        look={tierLook(s.stars)}
                        size={20}
                        title={`${MARBLE_NAMES[s.stars] || ''} marble`}
                      />{' '}
                      {s.nameEn}
                    </span>
                  ))}
                </div>
              ) : (
                <div className={panelTextCls}>
                  {selected.kind === 'fort'
                    ? 'Mixes every stop since the last fort.'
                    : 'Mixes the whole world. Beat it to open the next one.'}
                </div>
              )}
              <div className={panelTextCls}>
                {selected.unlocked
                  ? `${selected.bestScore != null ? `Best ${selected.bestScore}%. ` : ''}Right answers polish each point's marble: clear, shiny, then gold.`
                  : 'Clear the stop before this one to open it.'}
              </div>
            </div>
            <button
              className={playCls}
              disabled={!selected.unlocked || starting}
              onClick={() => onPlayNode(selected)}
            >
              {starting
                ? 'Starting…'
                : selected.cleared
                  ? 'Play again'
                  : 'Play'}
            </button>
          </div>
        )}
        <div className={stripCls}>
          {state.worlds.map((w) => (
            <button
              key={w.id}
              className={cx(
                worldTabCls,
                !w.unlocked && worldTabLockedCls,
                !w.unlocked && 'gq-world-locked',
                w.id === world.id && worldTabActiveCls,
                w.id === world.id && 'gq-world-active'
              )}
              disabled={!w.unlocked}
              onClick={() => onSelectWorld(w.id)}
            >
              <div className={worldThumbCls}>
                {/* locked worlds show their painting fogged over, not a grey box */}
                <span
                  className={cx(paintCls, !w.unlocked && paintLockedCls)}
                  style={{ backgroundImage: `url(${WORLD_THUMBS[w.key]})` }}
                />
                {!w.unlocked && (
                  <>
                    <span className={fogCls} />
                    <PixelIcon name="lock" scale={3} className={lockCls} />
                  </>
                )}
              </div>
              <div className={worldTabNameCls}>
                {w.id} · {w.name}
              </div>
              <div className={worldTabMetaCls}>
                {w.tier}
                {w.unlocked ? ` · ${w.goldMarbles}/${w.points} gold` : ''}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// map node discs: gold coin (up next), green (cleared), stone (locked),
// purple (a boss still standing)
const disc = (n: number, p: Record<string, string>) =>
  `url("${pixelSvg(discRows(n), p)}")`;
const GOLD_DISC = {
  k: INK,
  l: '#fff1a8',
  f: '#ffcb32',
  s: '#d18b00',
  g: '#ffffff'
};
const GREEN_DISC = {
  k: INK,
  l: '#9ff0b8',
  f: '#3cc16a',
  s: '#1f8a45',
  g: '#e9ffef'
};
const STONE_DISC = {
  k: '#3a3f4d',
  l: '#c9ced8',
  f: '#9aa1ae',
  s: '#6b7180',
  g: '#dfe3ea'
};
const BOSS_DISC = {
  k: INK,
  l: '#c9a8ff',
  f: '#8b5cf6',
  s: '#5b3aa8',
  g: '#f1e8ff'
};
const RING = `url("${pixelSvg(discRows(16), { k: '#ffe066' })}")`;

// One screen (Mikey 10-07): status chips on top, then the map filling what
// is left beside a column with the picked stop and the worlds. On phones the
// map sits above a compact stop panel and a sideways world strip.
const wrapCls = css`
  flex: 1;
  min-height: 0;
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 30rem;
  grid-template-rows: auto minmax(0, 1fr);
  grid-template-areas:
    'chips chips'
    'map side';
  gap: 1rem 1.2rem;
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 1fr) auto;
    grid-template-areas:
      'chips'
      'map'
      'side';
    gap: 0.6rem;
  }
`;
const noChipsRowCls = css`
  grid-template-rows: minmax(0, 1fr);
  grid-template-areas: 'map side';
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-rows: minmax(0, 1fr) auto;
    grid-template-areas:
      'map'
      'side';
  }
`;
// the map is as big as fits both ways, keeping the painting's shape
const mapAreaCls = css`
  grid-area: map;
  min-height: 0;
  container-type: size;
  display: flex;
  align-items: center;
  justify-content: center;
  @media (max-width: ${mobileMaxWidth}) {
    justify-content: flex-start;
    overflow-x: auto;
    overflow-y: hidden;
  }
`;
const sideCls = css`
  grid-area: side;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  @media (max-width: ${mobileMaxWidth}) {
    gap: 0.6rem;
  }
`;

// SMW-style status bar above the painting
const chipsCls = css`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.6rem;
  grid-area: chips;
  @media (max-width: ${mobileMaxWidth}) {
    flex-wrap: nowrap;
    justify-content: flex-start;
    gap: 0.4rem;
  }
`;

const chipCls = css`
  ${frame(PLATE, 2)}
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  min-height: 4.4rem;
  padding: 0 0.9rem;
  font-size: 1.3rem;
  font-weight: 800;
  color: #fff3d0;
  white-space: nowrap;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.2rem;
    padding: 0 0.6rem;
  }
`;

const chipNumCls = css`
  font-family: ${PIXEL_FONT};
  font-size: 1.2rem;
  font-weight: normal;
  color: #ffd84a;
  ${inkShadow(1)}
`;

const soundCls = css`
  min-width: 4.4rem;
  justify-content: center;
  cursor: pointer;
`;

const nemesisCls = css`
  color: #ffc2cf;
  cursor: pointer;
  transition: transform 0.06s;
  &:active:not(:disabled) {
    transform: translateY(2px);
  }
  &:disabled {
    cursor: default;
    color: #b9b3c6;
  }
  &:disabled img {
    opacity: 0.6;
  }
`;

const mapCls = css`
  ${frame(WOOD, 4, false)}
  position: relative;
  width: min(100cqw, 100cqh * 16 / 9);
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  background-color: #8fc8f0;
  @media (max-width: ${mobileMaxWidth}) {
    ${frame(WOOD, 3, false)}
    /* phones: the whole wide painting at the full height left, scrolled
       sideways like a game map (nodes stay on the painted path) */
    flex: none;
    height: 100cqh;
    width: auto;
  }
`;

// a wooden signboard hung from the top edge
const titleCls = css`
  ${frame(WOOD, 3)}
  position: absolute;
  left: 1.4rem;
  top: 1.6rem;
  max-width: 60%;
  padding: 0.5rem 1rem 0.7rem;
  filter: drop-shadow(0 4px 0 rgba(26, 20, 38, 0.35));
  &::before,
  &::after {
    content: '';
    position: absolute;
    top: -2.8rem;
    width: 6px;
    height: 2.4rem;
    background: ${INK};
    box-shadow: inset 2px 0 0 #8a5a2b;
  }
  &::before {
    left: 1rem;
  }
  &::after {
    right: 1rem;
  }
  @media (max-width: ${mobileMaxWidth}) {
    left: 0.8rem;
    top: 1.2rem;
    max-width: 70%;
  }
`;

const tierCls = css`
  font-family: ${PIXEL_FONT};
  font-size: 0.8rem;
  line-height: 1.6;
  text-transform: uppercase;
  color: #ffe7a8;
`;

const nameCls = css`
  margin-top: 0.3rem;
  font-family: ${PIXEL_FONT};
  font-size: 1.6rem;
  line-height: 1.4;
  color: #fff;
  ${inkShadow(2)}
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.2rem;
  }
`;

const nodeCls = css`
  position: absolute;
  transform: translate(-50%, -50%);
  width: 3.6rem;
  height: 3.6rem;
  padding: 0;
  border: none;
  background: ${disc(12, GREEN_DISC)} center / 100% 100% no-repeat;
  image-rendering: pixelated;
  filter: drop-shadow(0 3px 0 rgba(26, 20, 38, 0.45));
  cursor: pointer;
  transition: transform 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  &::before {
    /* a bigger tap target than the drawn disc */
    content: '';
    position: absolute;
    inset: -0.6rem;
  }
  &:hover {
    transform: translate(-50%, -50%) scale(1.08);
  }
  @media (max-width: ${mobileMaxWidth}) {
    width: 3rem;
    height: 3rem;
    &::before {
      inset: -0.7rem;
    }
  }
`;

const bigNodeCls = css`
  width: 4.5rem;
  height: 4.5rem;
  @media (max-width: ${mobileMaxWidth}) {
    width: 3.6rem;
    height: 3.6rem;
  }
`;

const goldNodeCls = css`
  background-image: ${disc(12, GOLD_DISC)};
`;

const bossNodeCls = css`
  background-image: ${disc(15, BOSS_DISC)};
`;

const lockedCls = css`
  background-image: ${disc(12, STONE_DISC)};
  color: #4a4f5c;
`;

const clearedCls = css`
  background-image: ${disc(12, GREEN_DISC)};
  color: #fff;
`;

const selectedCls = css`
  z-index: 2;
`;

const nodeNumCls = css`
  position: relative;
  font-family: ${PIXEL_FONT};
  font-size: 1.2rem;
  line-height: 1;
  color: ${INK};
  .gq-cleared & {
    color: #fff;
    ${inkShadow(1)}
  }
  .gq-locked & {
    color: #4a4f5c;
  }
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1rem;
  }
`;

const nodeIconCls = css`
  position: relative;
`;

const greyIconCls = css`
  filter: grayscale(1) brightness(0.8);
`;

const flagCls = css`
  position: absolute;
  right: -0.6rem;
  top: -1.2rem;
`;

// the node you're up to: a gold pixel ring that keeps rippling out
// (transform/opacity only)
const pulseCls = css`
  position: absolute;
  width: 4.8rem;
  height: 4.8rem;
  margin: -2.4rem 0 0 -2.4rem;
  background: ${RING} center / 100% 100% no-repeat;
  pointer-events: none;
  animation: questNodePulse 1.4s ease-out infinite;
  @keyframes questNodePulse {
    from {
      transform: scale(0.75);
      opacity: 0.95;
    }
    to {
      transform: scale(1.3);
      opacity: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: 0.8;
  }
  @media (max-width: ${mobileMaxWidth}) {
    width: 4.2rem;
    height: 4.2rem;
    margin: -2.1rem 0 0 -2.1rem;
  }
`;

const bigPulseCls = css`
  width: 5.8rem;
  height: 5.8rem;
  margin: -2.9rem 0 0 -2.9rem;
  @media (max-width: ${mobileMaxWidth}) {
    width: 4.8rem;
    height: 4.8rem;
    margin: -2.4rem 0 0 -2.4rem;
  }
`;

// the selected node gets a bobbing pointer above it
const pointerAnchorCls = css`
  position: absolute;
  z-index: 3;
  width: 0;
  height: 0;
  pointer-events: none;
  img {
    position: absolute;
    left: -10.5px;
    bottom: 2.2rem;
  }
  @media (max-width: ${mobileMaxWidth}) {
    img {
      bottom: 1.9rem;
    }
  }
`;

const bigPointerCls = css`
  img {
    bottom: 2.7rem;
  }
  @media (max-width: ${mobileMaxWidth}) {
    img {
      bottom: 2.2rem;
    }
  }
`;

const pointerCls = css`
  animation: questPointerBob 0.9s ease-in-out infinite alternate;
  @keyframes questPointerBob {
    from {
      transform: translateY(-3px);
    }
    to {
      transform: translateY(3px);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const nodeMarblesCls = css`
  ${frame(PLATE, 1)}
  position: absolute;
  left: 50%;
  top: 100%;
  transform: translateX(-50%);
  margin-top: 0.2rem;
  display: flex;
  gap: 1px;
  padding: 0 1px;
`;

const panelCls = css`
  ${frame(PARCHMENT, 4)}
  flex: none;
  max-height: 55%;
  overflow-y: auto;
  padding: 0.8rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 1rem;
  filter: drop-shadow(0 5px 0 rgba(26, 20, 38, 0.3));
  @media (max-width: ${mobileMaxWidth}) {
    ${frame(PARCHMENT, 3)}
    /* phones: one compact row, the stop beside its Play button */
    flex-direction: row;
    align-items: center;
    max-height: 12rem;
    padding: 0.5rem 0.6rem;
  }
`;

const panelBodyCls = css`
  flex: 1;
  min-width: 0;
`;

const panelLabelCls = css`
  font-family: ${PIXEL_FONT};
  font-size: 0.8rem;
  line-height: 1.6;
  text-transform: uppercase;
  color: #8a5a2b;
`;

const panelTitleCls = css`
  font-family: ${PIXEL_FONT};
  font-size: 1.6rem;
  line-height: 1.5;
  color: ${INK};
  margin: 0.4rem 0 0.7rem;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.3rem;
  }
`;

const skillListCls = css`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.6rem;
  @media (max-width: ${mobileMaxWidth}) {
    flex-wrap: nowrap;
    overflow-x: auto;
    margin-bottom: 0;
    font-size: 1.1rem;
  }
`;

const skillChipCls = css`
  ${frame(TAG, 1)}
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  padding: 0.2rem 0.6rem 0.2rem 0.3rem;
  color: #3b2a1a;
  font-size: 1.25rem;
  font-weight: 800;
`;

const panelTextCls = css`
  font-size: 1.3rem;
  font-weight: 700;
  line-height: 1.45;
  color: #5b4026;
  margin-bottom: 0.3rem;
  @media (max-width: ${mobileMaxWidth}) {
    display: none;
  }
`;

const playCls = css`
  ${button(GOLD, '#8a5200')}
  flex-shrink: 0;
  min-width: 14rem;
  min-height: 5.2rem;
  margin-bottom: 4px;
  padding: 0.6rem 1.6rem;
  font-size: 1.6rem;
  text-transform: uppercase;
  @media (max-width: ${mobileMaxWidth}) {
    min-width: 9rem;
    min-height: 4.4rem;
    padding: 0.4rem 1rem;
    font-size: 1.3rem;
  }
`;

// worlds: a scrolling list beside the map; a sideways strip on phones
const stripCls = css`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-content: start;
  gap: 0.6rem;
  padding: 0.2rem 0.4rem 0.6rem 0.2rem;
  @media (max-width: ${mobileMaxWidth}) {
    flex: none;
    overflow-y: hidden;
    overflow-x: auto;
    grid-auto-flow: column;
    grid-auto-columns: 10.5rem;
    grid-template-columns: none;
    padding-bottom: 0.4rem;
  }
`;

const worldTabCls = css`
  ${frame(WOOD, 2)}
  padding: 0;
  text-align: left;
  display: grid;
  grid-template-columns: 7.5rem minmax(0, 1fr);
  grid-template-rows: auto auto;
  align-content: center;
  > :first-child {
    grid-row: span 2;
  }
  @media (max-width: ${mobileMaxWidth}) {
    display: block;
  }
  cursor: pointer;
  filter: drop-shadow(0 3px 0 rgba(26, 20, 38, 0.3));
  transition: transform 0.1s;
  &:hover:not(:disabled) {
    transform: translateY(-2px);
  }
  &:disabled {
    cursor: default;
  }
`;

const worldTabLockedCls = css`
  ${frame(STONE, 2)}
`;

const worldTabActiveCls = css`
  ${frame(GOLD, 2)}
`;

const worldThumbCls = css`
  position: relative;
  height: 100%;
  min-height: 4.6rem;
  overflow: hidden;
  border-right: 3px solid ${INK};
  @media (max-width: ${mobileMaxWidth}) {
    height: 3.2rem;
    min-height: 0;
    border-right: 0;
    border-bottom: 3px solid ${INK};
  }
  display: flex;
  align-items: center;
  justify-content: center;
`;

const paintCls = css`
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-color: #2b3245;
`;

const paintLockedCls = css`
  filter: grayscale(0.85) brightness(0.55) blur(1px);
  transform: scale(1.05);
`;

const fogCls = css`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(214, 222, 236, 0.15) 0%,
    rgba(214, 222, 236, 0.45) 70%,
    rgba(214, 222, 236, 0.6) 100%
  );
`;

const lockCls = css`
  position: relative;
  filter: drop-shadow(0 3px 0 rgba(26, 20, 38, 0.5));
`;

const worldTabNameCls = css`
  padding: 0.5rem 0.5rem 0.1rem;
  font-family: ${PIXEL_FONT};
  font-size: 1rem;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 0.8rem;
    padding: 0.4rem 0.4rem 0;
  }
  line-height: 1.6;
  color: #fff3d0;
  ${inkShadow(1)}
  .gq-world-active & {
    color: ${INK};
    text-shadow: none;
  }
  .gq-world-locked & {
    color: #c9ced8;
  }
`;

const worldTabMetaCls = css`
  padding: 0 0.5rem 0.4rem;
  font-size: 1.1rem;
  font-weight: 700;
  color: #f1d9b5;
  .gq-world-active & {
    color: #5b3a00;
  }
  .gq-world-locked & {
    color: #aab0bd;
  }
`;
