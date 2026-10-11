import React, {
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { createPortal } from 'react-dom';
import { NavSlotContext } from '../navSlot';
import { FORMAT_INFO, GotchaText, MODIFIER_INFO } from './FormatQuestion';
import { css, cx } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import {
  WORLD_IMAGES,
  WORLD_THUMBS,
  mapHeightPerGapPx,
  nodePositions
} from './layout';
import type { QuestNode, QuestState, QuestWorld } from './types';
import AudioToggles from './AudioToggles';
import GoalsChip from './GoalsChip';
import { musicForWorldMap, playMusic, stopMusic } from './MarbleRun/music';
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
  pixelSvg,
  spriteUri
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
  // a crowded world's map is drawn big enough for every stop to keep a whole
  // tap box (the map area scrolls to the rest; Mikey 10-11)
  const bigStopsKey = world.nodes
    .flatMap((n, i) => (n.kind === 'stop' ? [] : [i]))
    .join(',');
  const perGapPx = useMemo(
    () =>
      mapHeightPerGapPx(
        world.key,
        world.nodes.length,
        bigStopsKey ? bigStopsKey.split(',').map(Number) : []
      ),
    [world.key, world.nodes.length, bigStopsKey]
  );
  const selected =
    world.nodes.find((n) => n.id === selectedNodeId) ||
    world.nodes.find((n) => n.unlocked && !n.cleared) ||
    world.nodes[0];
  // display only: the node the player is up to pulses gold on the map
  const current = world.nodes.find((n) => n.unlocked && !n.cleared);
  const nemesisDue = state.nemesis.filter((n) => n.due);
  // phones scroll the wide map sideways, and a crowded world's map scrolls
  // both ways: keep the picked stop in view
  const mapAreaRef = useRef<HTMLDivElement>(null);
  const selectedIndex = selected ? world.nodes.indexOf(selected) : -1;

  // each stop's tap box is as big as its size allows (44px on a phone), but
  // never reaches over a neighbour's: two stops close together split the gap
  // between them, so a tap always picks the nearer one (Mikey 10-11)
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapSize, setMapSize] = useState<[number, number] | null>(null);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const measure = () => setMapSize([map.clientWidth, map.clientHeight]);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(map);
    return () => observer.disconnect();
  }, []);
  const hitLimits = useMemo(
    () => (mapSize ? stopHitLimits(positions, mapSize) : []),
    // positions follow the world
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [world.key, world.nodes.length, mapSize]
  );

  // the picked stop's PLAY bubble goes on whichever side of it has room, so
  // it never covers another stop or its tap box (Mikey 10-11: it sat over
  // the next stops on crowded worlds)
  const bubbleRef = useRef<HTMLButtonElement>(null);
  const [bubbleAt, setBubbleAt] = useState<
    (BubbleSpot & { id: string }) | null
  >(null);
  const bubbleLabel = starting
    ? '…'
    : selected?.freeRematch
      ? '▶ FREE'
      : '▶ PLAY';
  // its full size, as drawn beside a stop (an 'on' bubble is the stop's)
  const bubbleSize = useRef<[number, number]>([0, 0]);
  useLayoutEffect(() => {
    const map = mapRef.current;
    const bubble = bubbleRef.current;
    if (!map || !bubble || !selected || selectedIndex < 0) return;
    if (bubble.textContent !== '▶')
      bubbleSize.current = [bubble.offsetWidth, bubble.offsetHeight];
    const spot = placeBubble(map, selectedIndex, ...bubbleSize.current);
    setBubbleAt(spot ? { ...spot, id: selected.id } : null);
    // the bubble moves with the picked stop, the map's size and its label
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id, selected?.unlocked, world.key, hitLimits, bubbleLabel]);
  const spot = bubbleAt && bubbleAt.id === selected?.id ? bubbleAt : null;

  // A map bigger than its area scrolls the picked stop (and its PLAY bubble)
  // into view, but only when the stop isn't wholly in view already: a stop
  // the player can see never moves, so a second tap or click on it (or on
  // its bubble) always lands (r28 review: on desktop the map slid away
  // under the mouse between the pick and the Play click).
  useEffect(() => {
    const area = mapAreaRef.current;
    const map = mapRef.current;
    if (!area || !map || selectedIndex < 0) return;
    const wide = area.scrollWidth > area.clientWidth;
    const tall = area.scrollHeight > area.clientHeight;
    if (!wide && !tall) return;
    const stop = map.querySelector<HTMLElement>(
      `[data-stop="${selectedIndex}"]`
    );
    if (!stop) return;
    const own = tapBoxOf(stop);
    const frame = area.getBoundingClientRect();
    const view = {
      l: frame.left + area.clientLeft,
      t: frame.top + area.clientTop,
      r: frame.left + area.clientLeft + area.clientWidth,
      b: frame.top + area.clientTop + area.clientHeight
    };
    if (
      own.l >= view.l - 0.5 &&
      own.t >= view.t - 0.5 &&
      own.r <= view.r + 0.5 &&
      own.b <= view.b + 0.5
    )
      return;
    // the stop and its bubble, centred
    const box = { ...own };
    const bubble = spot && bubbleRef.current?.getBoundingClientRect();
    if (bubble) {
      box.l = Math.min(box.l, bubble.left);
      box.t = Math.min(box.t, bubble.top);
      box.r = Math.max(box.r, bubble.right);
      box.b = Math.max(box.b, bubble.bottom);
    }
    area.scrollTo({
      left: wide
        ? area.scrollLeft + (box.l + box.r) / 2 - (view.l + view.r) / 2
        : undefined,
      top: tall
        ? area.scrollTop + (box.t + box.b) / 2 - (view.t + view.b) / 2
        : undefined,
      behavior: 'smooth'
    });
  }, [world.id, selectedIndex, mapSize, spot]);

  // Each map plays its world's own map song (not the level theme), including
  // when browsing unlocked worlds without leaving this screen.
  useEffect(() => {
    playMusic(musicForWorldMap(world.id));
    return () => stopMusic(0.6);
  }, [world.id]);

  // the status chips ride in Grammarbles' top bar when it has room for them
  const navSlot = useContext(NavSlotContext);
  const chips = (
    <div className={chipsCls}>
      <span className={chipCls}>
        <img className={chipMarbleCls} src={spriteUri('S')} alt="" />
        <span className={chipNumCls}>
          {world.sMarbles} / {world.nodeCount}
        </span>
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
      <GoalsChip />
      <AudioToggles className={audioFirstCls} />
    </div>
  );

  return (
    <div className={cx(wrapCls, navSlot && noChipsRowCls)}>
      {navSlot ? createPortal(chips, navSlot) : chips}
      {/* the map fills the space left, keeping its painting's shape */}
      <div className={mapAreaCls} ref={mapAreaRef}>
        <div
          className={mapCls}
          ref={mapRef}
          style={
            {
              backgroundImage: `url(${WORLD_IMAGES[world.key]})`,
              '--map-per-tap': perGapPx.tap,
              '--map-per-big': perGapPx.big,
              '--map-per-edge': perGapPx.edge,
              '--map-per-big-edge': perGapPx.bigEdge
            } as React.CSSProperties
          }
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
            const hit = hitLimits[i];
            // a cleared node becomes its letter marble (Mikey 10-07); forts
            // and castles keep their bigger size
            const done = node.cleared && node.grade;
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
                  data-stop={i}
                  className={cx(
                    nodeCls,
                    big && bigNodeCls,
                    big && 'gq-big',
                    // the disc takes its best letter's colour (Mikey 10-07:
                    // the colours already mean S–F); unplayed stays plain
                    node.unlocked &&
                      !node.grade &&
                      (big ? bossNodeCls : openNodeCls),
                    node.unlocked && node.grade && GRADE_NODE[node.grade],
                    done && marbleNodeCls,
                    node.unlocked && node.grade && 'gq-graded',
                    !node.unlocked && lockedCls,
                    !node.unlocked && 'gq-locked',
                    selected?.id === node.id && selectedCls
                  )}
                  style={{
                    ...at,
                    ...(done
                      ? { backgroundImage: `url(${spriteUri(node.grade)})` }
                      : null),
                    ...hit
                  }}
                  // a tap picks the stop; a tap on the picked stop plays it
                  // (Mikey 10-07: a player tapped the stop and "nothing
                  // happened" — the Play button was off to the side)
                  onClick={() =>
                    selected?.id === node.id && node.unlocked && !starting
                      ? onPlayNode(node)
                      : onSelectNode(node.id)
                  }
                  aria-label={
                    node.grade
                      ? `${node.name}, best grade ${node.grade}`
                      : node.name
                  }
                  title={node.grade ? `Best grade ${node.grade}` : undefined}
                >
                  {!done &&
                    (node.kind === 'stop' ? (
                      <span className={nodeNumCls}>{node.index}</span>
                    ) : (
                      <PixelIcon
                        name={node.kind === 'fort' ? 'tower' : 'crown'}
                        scale={2}
                        className={cx(
                          nodeIconCls,
                          !node.unlocked && greyIconCls
                        )}
                      />
                    ))}
                  {node.cleared && !done && (
                    <PixelIcon name="flag" scale={2} className={flagCls} />
                  )}
                </button>
                {selected?.id === node.id &&
                  (node.unlocked ? (
                    // the picked stop says PLAY right where the finger is, on
                    // the side with room (placeBubble)
                    <span
                      className={cx(
                        playAnchorCls,
                        big && bigPlayAnchorCls,
                        spot && placedAnchorCls
                      )}
                      style={at}
                    >
                      <span
                        className={playCenterCls}
                        style={
                          spot
                            ? { left: spot.dx, top: spot.dy, bottom: 'auto' }
                            : undefined
                        }
                      >
                        <button
                          ref={bubbleRef}
                          className={cx(
                            playBubbleCls,
                            spot && TAIL_SIDE[spot.side]
                          )}
                          style={
                            spot
                              ? ({
                                  '--tail': `${spot.tail}px`,
                                  width: spot.width,
                                  height: spot.height
                                } as React.CSSProperties)
                              : undefined
                          }
                          disabled={starting}
                          onClick={() => onPlayNode(node)}
                          aria-label={`Play ${node.name}`}
                        >
                          {spot?.side === 'on' ? (
                            // over the stop's own box: a small ▶ in its
                            // corner, the stop's disc or marble showing
                            <span className={onBadgeCls}>▶</span>
                          ) : (
                            bubbleLabel
                          )}
                        </button>
                      </span>
                    </span>
                  ) : (
                    <span
                      className={cx(pointerAnchorCls, big && bigPointerCls)}
                      style={at}
                      aria-hidden
                    >
                      <PixelIcon
                        name="arrow"
                        scale={3}
                        className={pointerCls}
                      />
                    </span>
                  ))}
              </React.Fragment>
            );
          })}
        </div>
      </div>
      <div className={sideCls}>
        {selected && (
          <div className={panelCls}>
            <button
              className={playCls}
              disabled={!selected.unlocked || starting}
              onClick={() => onPlayNode(selected)}
            >
              {starting
                ? 'Starting…'
                : selected.freeRematch
                  ? selected.kind === 'stop'
                    ? 'Free replay'
                    : 'Free rematch'
                  : selected.cleared
                    ? 'Play again'
                    : 'Play'}
            </button>
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
              <div className={cx(panelTextCls, selected.grade && bestLineCls)}>
                {selected.grade && (
                  <img
                    className={bestMarbleCls}
                    src={spriteUri(selected.grade)}
                    alt={selected.grade}
                  />
                )}
                {/* what the best score is, said plainly (Mikey 10-07: the old
                    lines didn't match how the game works) */}
                {!selected.unlocked
                  ? 'Clear the stop before this one to open it.'
                  : selected.bestScore == null
                    ? selected.kind === 'stop'
                      ? 'Get 5 right answers to clear this stop. Fewer misses, better grade.'
                      : 'Beat the boss: deal 490 damage, graded on speed. Watch its attacks; land counters for big hits.'
                    : selected.kind === 'stop'
                      ? `Best: ${selected.grade}, ${selected.bestScore}% of answers right.`
                      : `Best: ${selected.grade}, ${selected.bestScore}% of the boss's 700 points.`}
              </div>
              {selected.unlocked && (selected.teaches || selected.modifier) && (
                // the stop's identity: a new question type to learn, or its twist
                <div className={panelTextCls}>
                  {selected.teaches && (
                    <div>
                      <b>New: {FORMAT_INFO[selected.teaches].name}.</b>{' '}
                      <GotchaText text={FORMAT_INFO[selected.teaches].how} />
                    </div>
                  )}
                  {selected.modifier && (
                    <div>
                      <b>Twist: {MODIFIER_INFO[selected.modifier].name}.</b>{' '}
                      {MODIFIER_INFO[selected.modifier].how}
                    </div>
                  )}
                </div>
              )}
              {selected.cleared && (
                <div className={panelTextCls}>
                  {selected.grade !== 'S'
                    ? 'Play again to improve your grade. Your best grade is kept.'
                    : 'Your best grade is kept on every replay.'}
                </div>
              )}
              {/* Mikey 10-08: today's goals count only newer nodes, and
                  the bar moves on a step each day you play */}
              {selected.unlocked &&
                (selected.countsForGoals === false ? (
                  <div className={panelTextCls}>
                    Too far back to count for today&apos;s goals. Play a newer
                    stop or boss.
                  </div>
                ) : (
                  selected.countsForGoals && (
                    <div className={panelTextCls}>
                      Counts for today&apos;s goals.
                    </div>
                  )
                ))}
              {selected.freeRematch && (
                // a miss here was the question's fault (an upheld challenge,
                // a check, or a chaser that caught you only through one):
                // a full-pay rematch (Mikey 10-08, 10-11)
                <div className={cx(panelTextCls, rematchCls)}>
                  A question here was at fault, so this{' '}
                  {selected.kind === 'stop' ? 'replay' : 'rematch'} pays in full
                  and doesn&apos;t use one of today&apos;s runs.
                </div>
              )}
            </div>
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
              title={`${w.id} · ${w.name}`}
              aria-label={`World ${w.id}: ${w.name}`}
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
                {w.unlocked ? ` · ${w.sMarbles}/${w.nodeCount} S` : ''}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// map node discs: a played node wears its best letter's colour (Classic's
// S–F colours); open but unplayed is parchment, a boss not yet fought purple,
// locked stone
const disc = (n: number, p: Record<string, string>) =>
  `url("${pixelSvg(discRows(n), p)}")`;
const GOLD_DISC = {
  k: INK,
  l: '#fff1a8',
  f: '#ffcb32',
  s: '#d18b00',
  g: '#ffffff'
};
const OPEN_DISC = {
  k: INK,
  l: '#ffffff',
  f: '#f6ecd2',
  s: '#d9c79c',
  g: '#ffffff'
};
// Classic's grade colours (MarbleRun/marble.ts GRADE), lit and shaded
const GRADE_DISCS: Record<string, Record<string, string>> = {
  S: GOLD_DISC,
  A: { k: INK, l: '#ff8fcb', f: '#df3296', s: '#a3206c', g: '#ffe3f2' },
  B: { k: INK, l: '#ffc070', f: '#ff8c00', s: '#c06400', g: '#fff1dc' },
  C: { k: INK, l: '#ffb3d9', f: '#ff69b4', s: '#d1408a', g: '#fff0f7' },
  D: { k: INK, l: '#a9d4ff', f: '#418ceb', s: '#2a62b0', g: '#eaf4ff' },
  F: { k: INK, l: '#a7adb6', f: '#7d838d', s: '#5a5f68', g: '#e4e6ea' }
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
// the map is as big as fits both ways, keeping the painting's shape, but
// never smaller than its stops need: a crowded world's closest two stops
// stay a whole tap box apart (--tap-need), a fort's or castle's disc stays
// clear of its neighbour (--big-need: its disc and a little air), and every
// stop sits half its tap box inside the map's edges (--edge-need,
// --big-edge-need: half its disc plus its tap pad), so no disc or tap box
// is ever cut by the edge; the --map-per-* factors come from the world's
// layout. The area scrolls to the rest. The map centres itself with auto
// margins, so a map bigger than the area still scrolls to every edge.
//
// --tap-need follows the pointer (r28 review): a finger needs 44px on an
// upright phone and 40px elsewhere (Mikey 10-11: crowded maps zoom and
// scroll so every stop gets a whole box); a mouse needs far less, so on a
// fine pointer with no touch screen it is 28px, and so is a fort's or
// castle's gap (its disc may touch a neighbour's there; the boxes still
// split the gap), so the desktop map stays whole unless even that can't
// fit. There a scrolling map shows a styled scrollbar (macOS hides the
// default one until you scroll).
const FINE_POINTER = '@media (pointer: fine) and (not (any-pointer: coarse))';
const mapAreaCls = css`
  --tap-need: 40px;
  --big-need: calc(4.5rem + 4px);
  --edge-need: calc(1.8rem + 6px);
  --big-edge-need: calc(2.25rem + 6px);
  grid-area: map;
  min-height: 0;
  container-type: size;
  display: flex;
  overflow: auto;
  overscroll-behavior: contain;
  @media (max-width: ${mobileMaxWidth}) {
    --big-need: calc(3.6rem + 4px);
    --edge-need: calc(1.5rem + 10px);
    --big-edge-need: calc(1.8rem + 10px);
  }
  @media (max-width: ${mobileMaxWidth}) and (orientation: portrait) {
    --tap-need: 44px;
  }
  ${FINE_POINTER} {
    --tap-need: 28px;
    --big-need: 28px;
    &::-webkit-scrollbar {
      width: 12px;
      height: 12px;
    }
    &::-webkit-scrollbar-track {
      background: rgba(26, 20, 38, 0.25);
    }
    &::-webkit-scrollbar-thumb {
      background: #b06a35;
      border: 2px solid ${INK};
    }
    &::-webkit-scrollbar-corner {
      background: transparent;
    }
    @supports not selector(::-webkit-scrollbar) {
      scrollbar-color: #b06a35 rgba(26, 20, 38, 0.25);
    }
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
  @media (max-height: 520px) and (orientation: landscape) {
    flex-wrap: nowrap;
    gap: 0.3rem;
  }
`;

// the sound and music switches: last on a wide screen; first where the
// chip row scrolls sideways (phones, held upright or on their side), so
// they show without a swipe (Mikey 10-11)
const audioFirstCls = css`
  @media (max-width: ${mobileMaxWidth}),
    (max-height: 520px) and (orientation: landscape) {
    order: -1;
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
    min-height: 44px;
    font-size: 1.2rem;
    padding: 0 0.6rem;
  }
  @media (max-height: 520px) and (orientation: landscape) {
    min-height: 40px;
    padding: 0 0.5rem;
    font-size: 1.1rem;
  }
`;

const chipNumCls = css`
  font-family: ${PIXEL_FONT};
  font-size: 1.2rem;
  font-weight: normal;
  color: #ffd84a;
  ${inkShadow(1)}
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

// the frame's two borders (12px each on desktop, 9px on a phone) and a
// pixel of slack for rounding
const MAP_MIN_HEIGHT = `calc(max(${[
  'var(--tap-need) * var(--map-per-tap, 0)',
  'var(--big-need) * var(--map-per-big, 0)',
  'var(--edge-need) * var(--map-per-edge, 0)',
  'var(--big-edge-need) * var(--map-per-big-edge, 0)'
].join(', ')}) + 26px)`;
const mapCls = css`
  ${frame(WOOD, 4, false)}
  position: relative;
  flex: none;
  margin: auto;
  width: max(min(100cqw, 100cqh * 16 / 9), ${MAP_MIN_HEIGHT} * 16 / 9);
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  background-color: #8fc8f0;
  @media (max-width: ${mobileMaxWidth}) {
    ${frame(WOOD, 3, false)}
    /* phones: the whole wide painting at the full height left, scrolled
       sideways like a game map (nodes stay on the painted path) */
    margin: auto 0;
    height: max(100cqh, ${MAP_MIN_HEIGHT});
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

// How far each stop's tap box may reach from its centre toward each side
// (px) before it would cross a neighbour's: for each pair of stops close
// enough to touch, the axis they are further apart on is split down the
// middle, so the two boxes can't overlap. Sides with no close neighbour
// stay unset (the full reach).
const NEAR = 64;
function stopHitLimits(
  positions: [number, number][],
  [width, height]: [number, number]
) {
  const px = positions.map(([x, y]) => [(x / 100) * width, (y / 100) * height]);
  const limits = px.map(() => ({ t: NEAR, r: NEAR, b: NEAR, l: NEAR }));
  for (let i = 0; i < px.length; i++) {
    for (let j = i + 1; j < px.length; j++) {
      const dx = px[j][0] - px[i][0];
      const dy = px[j][1] - px[i][1];
      if (Math.abs(dx) >= NEAR || Math.abs(dy) >= NEAR) continue;
      if (Math.abs(dx) >= Math.abs(dy)) {
        const half = Math.abs(dx) / 2;
        const [left, right] = dx >= 0 ? [i, j] : [j, i];
        limits[left].r = Math.min(limits[left].r, half);
        limits[right].l = Math.min(limits[right].l, half);
      } else {
        const half = Math.abs(dy) / 2;
        const [top, bottom] = dy >= 0 ? [i, j] : [j, i];
        limits[top].b = Math.min(limits[top].b, half);
        limits[bottom].t = Math.min(limits[bottom].t, half);
      }
    }
  }
  return limits.map(
    (l) =>
      ({
        '--hit-t': `${l.t.toFixed(1)}px`,
        '--hit-r': `${l.r.toFixed(1)}px`,
        '--hit-b': `${l.b.toFixed(1)}px`,
        '--hit-l': `${l.l.toFixed(1)}px`
      }) as React.CSSProperties
  );
}

// Where the picked stop's PLAY bubble goes: beside the stop on the first
// side (above, below, right, left; centred, then slid along) where it stays
// inside the map and touches no other stop's disc or tap box, with room for
// its bob. Read from the drawn stops, so it follows their real sizes.
// Offsets are from the stop's centre to the bubble's top-left corner; `tail`
// is where its pointer sits along the edge facing the stop. Where stops
// crowd it on every side, the bubble becomes a ▶ button over the stop's own
// tap box (side 'on', its size): it covers only the stop it plays.
export interface BubbleSpot {
  side: 'above' | 'below' | 'left' | 'right' | 'on';
  dx: number;
  dy: number;
  tail: number;
  width?: number;
  height?: number;
}
const BUBBLE_GAP = 6;
// the bubble's bob (questPlayBob) and a hair of air
const BUBBLE_CLEAR = 3;
interface Box {
  l: number;
  t: number;
  r: number;
  b: number;
}
// a drawn stop's tap box and disc together, in viewport px
function tapBoxOf(stop: HTMLElement) {
  const r = stop.getBoundingClientRect();
  const hit = getComputedStyle(stop, '::before');
  return {
    l: r.left + Math.min(0, parseFloat(hit.left) || 0),
    t: r.top + Math.min(0, parseFloat(hit.top) || 0),
    r: r.right - Math.min(0, parseFloat(hit.right) || 0),
    b: r.bottom - Math.min(0, parseFloat(hit.bottom) || 0),
    cx: (r.left + r.right) / 2,
    cy: (r.top + r.bottom) / 2
  };
}
function placeBubble(
  map: HTMLElement,
  index: number,
  width: number,
  height: number
): BubbleSpot | null {
  const stops = Array.from(
    map.querySelectorAll<HTMLElement>('[data-stop]')
  ).sort((a, b) => Number(a.dataset.stop) - Number(b.dataset.stop));
  if (!stops[index] || !width || !height) return null;
  const frame = map.getBoundingClientRect();
  const ox = frame.left + map.clientLeft;
  const oy = frame.top + map.clientTop;
  const boxes = stops.map((stop) => {
    const box = tapBoxOf(stop);
    return {
      l: box.l - ox,
      t: box.t - oy,
      r: box.r - ox,
      b: box.b - oy,
      cx: box.cx - ox,
      cy: box.cy - oy
    };
  });
  const own = boxes[index];
  const covered = (box: Box) =>
    boxes.reduce(
      (sum, other, i) =>
        i === index
          ? sum
          : sum +
            Math.max(
              0,
              Math.min(box.r, other.r + BUBBLE_CLEAR) -
                Math.max(box.l, other.l - BUBBLE_CLEAR)
            ) *
              Math.max(
                0,
                Math.min(box.b, other.b + BUBBLE_CLEAR) -
                  Math.max(box.t, other.t - BUBBLE_CLEAR)
              ),
      0
    );
  const slides = (size: number) => [
    0,
    -size / 4,
    size / 4,
    -size / 2 + 14,
    size / 2 - 14
  ];
  const spots: { side: BubbleSpot['side']; x: number; y: number }[] = [];
  for (const side of ['above', 'below'] as const)
    for (const slide of slides(width))
      spots.push({
        side,
        x: own.cx - width / 2 + slide,
        y: side === 'above' ? own.t - BUBBLE_GAP - height : own.b + BUBBLE_GAP
      });
  for (const side of ['right', 'left'] as const)
    for (const slide of slides(height))
      spots.push({
        side,
        x: side === 'right' ? own.r + BUBBLE_GAP : own.l - BUBBLE_GAP - width,
        y: own.cy - height / 2 + slide
      });
  const clear = spots.find((spot) => {
    const box = { l: spot.x, t: spot.y, r: spot.x + width, b: spot.y + height };
    return (
      box.l >= 0 &&
      box.t >= BUBBLE_CLEAR &&
      box.r <= map.clientWidth &&
      box.b <= map.clientHeight - BUBBLE_CLEAR &&
      covered(box) === 0
    );
  });
  if (!clear)
    return {
      side: 'on',
      dx: own.l - own.cx,
      dy: own.t - own.cy,
      tail: 0,
      width: own.r - own.l,
      height: own.b - own.t
    };
  const { side, x, y } = clear;
  const along = side === 'above' || side === 'below';
  const tail = along
    ? Math.max(14, Math.min(width - 14, own.cx - x))
    : Math.max(12, Math.min(height - 12, own.cy - y));
  return { side, dx: x - own.cx, dy: y - own.cy, tail };
}

// a stop's tap box: --hit-pad past its disc on every side, cut back on a
// side where the gap to a neighbour is shorter (inside the disc too, where
// two discs nearly touch: the box, not the disc, takes the tap)
const hitSide = (side: string) =>
  `calc(50% - min(50% + var(--hit-pad), var(--hit-${side}, 999px)))`;

const nodeCls = css`
  --hit-pad: 6px;
  position: absolute;
  transform: translate(-50%, -50%);
  width: 3.6rem;
  height: 3.6rem;
  padding: 0;
  border: none;
  background: ${disc(12, OPEN_DISC)} center / 100% 100% no-repeat;
  image-rendering: pixelated;
  filter: drop-shadow(0 3px 0 rgba(26, 20, 38, 0.45));
  cursor: pointer;
  transition: transform 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  /* only the tap box takes taps, so neighbours' boxes never overlap */
  pointer-events: none;
  &::before {
    /* a bigger tap target than the drawn disc */
    content: '';
    position: absolute;
    inset: ${hitSide('t')} ${hitSide('r')} ${hitSide('b')} ${hitSide('l')};
    pointer-events: auto;
  }
  &:hover {
    transform: translate(-50%, -50%) scale(1.08);
  }
  @media (max-width: ${mobileMaxWidth}) {
    /* 24px disc + 10px all round = a 44px tap box */
    --hit-pad: 10px;
    width: 3rem;
    height: 3rem;
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

// the node drawn as Classic's letter marble (its image set inline)
const marbleNodeCls = css`
  && {
    background-size: 100% 100%;
    background-repeat: no-repeat;
  }
`;
const openNodeCls = css`
  background-image: ${disc(12, OPEN_DISC)};
`;
// big (boss) discs use the 15-row art, stops the 12-row
const GRADE_NODE: Record<string, string> = Object.fromEntries(
  Object.entries(GRADE_DISCS).map(([grade, p]) => [
    grade,
    css`
      background-image: ${disc(12, p)};
      &.gq-big {
        background-image: ${disc(15, p)};
      }
      color: #fff;
    `
  ])
);

const bossNodeCls = css`
  background-image: ${disc(15, BOSS_DISC)};
`;

const lockedCls = css`
  background-image: ${disc(12, STONE_DISC)};
  color: #4a4f5c;
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
  .gq-graded & {
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
// the PLAY bubble above the picked stop: a gold game button with a tail
const playAnchorCls = css`
  position: absolute;
  z-index: 4;
  width: 0;
  height: 0;
  > span {
    position: absolute;
    left: 50%;
    bottom: 2.4rem;
    transform: translateX(-50%);
  }
  @media (max-width: ${mobileMaxWidth}) {
    > span {
      bottom: 2rem;
    }
  }
`;
// centers the bubble (its own transform stays free for the press)
const playCenterCls = css`
  display: block;
`;
// placed beside the stop (placeBubble): its offsets come inline
const placedAnchorCls = css`
  && > span {
    transform: none;
  }
`;
const bigPlayAnchorCls = css`
  > span {
    bottom: 3rem;
  }
  @media (max-width: ${mobileMaxWidth}) {
    > span {
      bottom: 2.5rem;
    }
  }
`;
const playBubbleCls = css`
  ${button(GOLD, '#8a5200')}
  padding: 0.4rem 1rem;
  font-family: ${PIXEL_FONT};
  font-size: 1.1rem;
  white-space: nowrap;
  animation: questPlayBob 0.9s ease-in-out infinite alternate;
  /* its pointer, on the edge that faces the stop (--tail: how far along) */
  &::after {
    content: '';
    position: absolute;
    left: var(--tail, 50%);
    bottom: -9px;
    margin-left: -6px;
    border: 6px solid transparent;
    border-top-color: ${INK};
    border-bottom: 0;
  }
  @keyframes questPlayBob {
    from {
      translate: 0 -2px;
    }
    to {
      translate: 0 2px;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
  /* px on phones (8px rem): a 44px thumb target */
  @media (max-width: ${mobileMaxWidth}) {
    min-height: 44px;
    font-size: 0.95rem;
    padding: 0.35rem 0.8rem;
  }
`;
const TAIL_SIDE: Record<BubbleSpot['side'], string> = {
  above: '',
  // crowded on every side: the stop's own tap box becomes its Play button
  // (it stays put, so it never bobs into a neighbour's): a see-through gold
  // ring with a small ▶ in its corner, so the stop's disc or marble still
  // shows (r28 review: a solid ▶ square hid the marble)
  on: css`
    && {
      min-height: 0;
      padding: 0;
      border: 2px solid #ffcb32;
      border-image: none;
      background: rgba(255, 203, 50, 0.16);
      box-shadow:
        0 0 0 2px ${INK},
        inset 0 0 0 1px ${INK};
      filter: none;
      animation: none;
    }
    &&::after {
      display: none;
    }
  `,
  below: css`
    &&::after {
      bottom: auto;
      top: -9px;
      border: 6px solid transparent;
      border-bottom-color: ${INK};
      border-top: 0;
    }
  `,
  right: css`
    &&::after {
      left: -9px;
      top: var(--tail);
      bottom: auto;
      margin: -6px 0 0;
      border: 6px solid transparent;
      border-right-color: ${INK};
      border-left: 0;
    }
  `,
  left: css`
    &&::after {
      left: auto;
      right: -9px;
      top: var(--tail);
      bottom: auto;
      margin: -6px 0 0;
      border: 6px solid transparent;
      border-left-color: ${INK};
      border-right: 0;
    }
  `
};
// the ▶ in the corner of a stop's own Play box
const onBadgeCls = css`
  ${frame(GOLD, 1)}
  position: absolute;
  top: -1px;
  right: -1px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  font-size: 9px;
  line-height: 1;
  color: ${INK};
  pointer-events: none;
`;
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

const chipMarbleCls = css`
  width: 18px;
  height: 18px;
  image-rendering: pixelated;
`;
const rematchCls = css`
  font-weight: 700;
  color: #a3194a;
`;
const bestLineCls = css`
  display: flex;
  align-items: center;
  gap: 0.6rem;
`;
const bestMarbleCls = css`
  flex: none;
  width: 32px;
  height: 32px;
  image-rendering: pixelated;
`;

const panelCls = css`
  ${frame(PARCHMENT, 4)}
  flex: none;
  max-height: 55%;
  /* phones on their side: the stop panel gets the column's height */
  @media (max-height: 520px) and (orientation: landscape) {
    flex: 1;
    min-height: 0;
    max-height: none;
  }
  overflow-y: auto;
  padding: 0.8rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 1rem;
  filter: drop-shadow(0 5px 0 rgba(26, 20, 38, 0.3));
  @media (max-width: ${mobileMaxWidth}) {
    ${frame(PARCHMENT, 3)}
    /* phones: one compact row, the stop beside its Play button; one height
       for every stop and boss (the title keeps to one line, and a boss with
       no skill row keeps its room), so picking a stop never resizes the map
       above and slides the stops under the finger (r29) */
    flex-direction: row;
    align-items: center;
    min-height: 10.7rem;
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
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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
  /* phones: one line (the row scrolls sideways), so the panel's height holds */
  @media (max-width: ${mobileMaxWidth}) {
    white-space: nowrap;
  }
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
  @media (max-height: 520px) and (orientation: landscape) {
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
    min-height: 44px;
    padding: 0.4rem 1rem;
    font-size: 1.3rem;
  }
`;

// worlds: a scrolling list beside the map; a sideways strip on phones
// (held upright or on their side)
const stripCls = css`
  flex: 1;
  @media (max-height: 520px) and (orientation: landscape) {
    flex: none;
    overflow-y: hidden;
    overflow-x: auto;
    grid-auto-flow: column;
    grid-auto-columns: 6.4rem;
    grid-template-columns: none;
  }
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
  @media (max-width: ${mobileMaxWidth}),
    (max-height: 520px) and (orientation: landscape) {
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
  @media (max-width: ${mobileMaxWidth}),
    (max-height: 520px) and (orientation: landscape) {
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
  /* phones on their side: the strip shows the paintings only */
  @media (max-height: 520px) and (orientation: landscape) {
    display: none;
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
  /* phones on their side: the strip shows the paintings only */
  @media (max-height: 520px) and (orientation: landscape) {
    display: none;
  }
`;
