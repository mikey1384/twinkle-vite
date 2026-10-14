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
import { WORLD_IMAGES, WORLD_THUMBS, nodePositions } from './layout';
import { mapHeightPerGapPx } from './worldPaths';
import { MOUSE_DISCS, mouseDiscSizes } from './stopSpacing';
import type { QuestNode, QuestState, QuestWorld } from './types';
import AudioToggles from './AudioToggles';
import GoalsChip from './GoalsChip';
import { musicForWorldMap, playMusic, stopMusic } from './MarbleRun/music';
import PixelIcon from './PixelIcon';
import Icon from '~/components/Icon';
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
  startingNodeId,
  startingNemesis = false,
  starting
}: {
  state: QuestState;
  world: QuestWorld;
  selectedNodeId: string | null;
  onSelectWorld: (id: number) => void;
  onSelectNode: (id: string) => void;
  onPlayNode: (node: QuestNode) => void;
  onPlayNemesis: () => void;
  startingNodeId?: string | null;
  startingNemesis?: boolean;
  starting: boolean;
}) {
  // a crowded world's map is drawn big enough for every stop to keep a whole
  // tap box (the map area scrolls to the rest; Mikey 10-11). A mouse gets
  // the layout that keeps forts and castles clear of every other marble
  // (worldPaths.ts); it goes with the mouse sizes (FINE_POINTER below). A
  // narrow window (styles.css: an 8px root font) has smaller discs and its
  // own mouse layout, made for them (r31 review SF-1)
  const mouse = useMediaMatch(FINE_POINTER_QUERY);
  const narrow = useMediaMatch(`(max-width: ${mobileMaxWidth})`);
  const mouseFit = mouse ? (narrow ? 'narrow' : 'wide') : undefined;
  const bigStopsKey = world.nodes
    .flatMap((n, i) => (n.kind === 'stop' ? [] : [i]))
    .join(',');
  const bigStops = useMemo(
    () => (bigStopsKey ? bigStopsKey.split(',').map(Number) : []),
    [bigStopsKey]
  );
  const positions = nodePositions(
    world.key,
    world.nodes.length,
    mouseFit ? bigStops : undefined,
    mouseFit
  );
  const perGapPx = useMemo(
    () => mapHeightPerGapPx(world.key, world.nodes.length, bigStops, mouseFit),
    [world.key, world.nodes.length, bigStops, mouseFit]
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
    // a map not laid out yet (mounted hidden) measures 0×0: sizes and tap
    // boxes are never worked out from that (r31 review N-2)
    const measure = () => {
      if (map.clientWidth > 0 && map.clientHeight > 0)
        setMapSize([map.clientWidth, map.clientHeight]);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(map);
    return () => observer.disconnect();
  }, []);
  // (a layout's positions are kept, so they change only with the layout)
  const hitLimits = useMemo(
    () => (mapSize ? stopHitLimits(positions, mapSize) : []),
    [positions, mapSize]
  );
  // on a mouse each disc is drawn as big as the drawn map lets it be with
  // no two overlapping (mouseDiscSizes; its tap box keeps its size), up to
  // the window's design sizes (MOUSE_DISCS: 36/45px, 24/28.8px narrow);
  // `k` scales its number, icon, flag and pulse ring to match
  const mouseDiscs = useMemo(() => {
    if (!mouseFit || !mapSize) return null;
    const design = MOUSE_DISCS[mouseFit];
    const sizes = mouseDiscSizes(positions, bigStops, mapSize, design);
    return {
      ...sizes,
      stopK: sizes.stop / design.stop,
      bossK: sizes.boss / design.boss
    };
  }, [mouseFit, positions, bigStops, mapSize]);

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
  // the pixel font arrives after the first paint (font-display: swap), and
  // the bubble and the stop's title are measured again in it
  const [fontsTick, setFontsTick] = useState(0);
  useEffect(() => {
    const fonts = document.fonts;
    if (!fonts) return;
    let live = true;
    const remeasure = () => live && setFontsTick((tick) => tick + 1);
    fonts.ready.then(remeasure);
    fonts.addEventListener?.('loadingdone', remeasure);
    return () => {
      live = false;
      fonts.removeEventListener?.('loadingdone', remeasure);
    };
  }, []);
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
  }, [
    selected?.id,
    selected?.unlocked,
    world.key,
    hitLimits,
    bubbleLabel,
    fontsTick
  ]);
  const spot = bubbleAt && bubbleAt.id === selected?.id ? bubbleAt : null;

  // A map bigger than its area scrolls the picked stop (and its PLAY bubble)
  // into view, but only when the stop isn't wholly in view already: a stop
  // the player can see never moves, so a second tap or click on it (or on
  // its bubble) always lands (r28 review: on desktop the map slid away
  // under the mouse between the pick and the Play click). A stop the player
  // didn't pick (the one a world opens on) also brings its whole bubble into
  // view: nobody's finger is on it, and its PLAY was cut by the area's edge
  // (r29 review: "▶ PLA" on first open). Once the player has panned the
  // map by hand (dragged it, or scrolled it with a wheel or the keys), a
  // re-placed bubble (a font arriving) never moves it again: only a new pick
  // may, and only to bring that stop into view (r30 review N-4: a late font
  // slid a hand-panned map back). The tap that picks a stop is not a pan
  // (r30b review SF-2: it counted as one, so after a rotation the map never
  // scrolled back and the picked stop sat off-screen). A new map size (a
  // rotation, a resized window) makes the old offset meaningless: the
  // picked stop and its bubble come back into view, panned or not.
  const pickedByPlayer = useRef<string | null>(null);
  const pickedInWorld = useRef(world.id);
  const mapTouched = useRef(false);
  const placedFor = useRef('');
  const placedSize = useRef('');
  const resizedSincePick = useRef(false);
  useEffect(() => {
    const area = mapAreaRef.current;
    if (!area) return;
    const panned = () => (mapTouched.current = true);
    // a drag (a finger, or a mouse on the scrollbar) pans the map if it
    // ends with the map scrolled from where the press found it
    let pressedAt: [number, number] | null = null;
    const press = () => (pressedAt = [area.scrollLeft, area.scrollTop]);
    const release = () => {
      if (
        pressedAt &&
        (Math.abs(area.scrollLeft - pressedAt[0]) > 1 ||
          Math.abs(area.scrollTop - pressedAt[1]) > 1)
      )
        panned();
      pressedAt = null;
    };
    const SCROLL_KEYS = new Set([
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'PageUp',
      'PageDown',
      'Home',
      'End',
      ' '
    ]);
    // (Space on a stop or the bubble presses it, it doesn't scroll)
    const key = (e: Event) => {
      const { key: name, target } = e as KeyboardEvent;
      if (name === ' ' && (target as HTMLElement).closest?.('button')) return;
      if (SCROLL_KEYS.has(name)) panned();
    };
    const listeners: [string, EventListener][] = [
      ['pointerdown', press],
      ['touchstart', press],
      ['pointerup', release],
      ['touchend', release],
      ['wheel', panned],
      ['keydown', key]
    ];
    for (const [type, fn] of listeners)
      area.addEventListener(type, fn, { passive: true });
    return () => {
      for (const [type, fn] of listeners) area.removeEventListener(type, fn);
    };
  }, []);
  useEffect(() => {
    if (pickedInWorld.current !== world.id) {
      pickedInWorld.current = world.id;
      pickedByPlayer.current = null;
      mapTouched.current = false;
    }
    const size = mapSize ? mapSize.join('x') : '';
    if (size !== placedSize.current) {
      if (placedSize.current) {
        mapTouched.current = false;
        resizedSincePick.current = true;
      }
      placedSize.current = size;
    }
    const pick = `${world.id}:${selected?.id}`;
    if (placedFor.current !== pick) resizedSincePick.current = false;
    if (mapTouched.current && placedFor.current === pick) return;
    placedFor.current = pick;
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
    const own = stopBoxOf(stop);
    const frame = area.getBoundingClientRect();
    const view = {
      l: frame.left + area.clientLeft,
      t: frame.top + area.clientTop,
      r: frame.left + area.clientLeft + area.clientWidth,
      b: frame.top + area.clientTop + area.clientHeight
    };
    // the stop and its bubble (with room for its bob)
    const box = { ...own };
    const bubble = spot && bubbleRef.current?.getBoundingClientRect();
    if (bubble) {
      box.l = Math.min(box.l, bubble.left - BUBBLE_CLEAR);
      box.t = Math.min(box.t, bubble.top - BUBBLE_CLEAR);
      box.r = Math.max(box.r, bubble.right + BUBBLE_CLEAR);
      box.b = Math.max(box.b, bubble.bottom + BUBBLE_CLEAR);
    }
    // (a stop just picked by hand shows at least itself; after a resize
    // its bubble too: no finger or mouse is on it any more)
    const mustShow =
      (pickedByPlayer.current === selected?.id && !resizedSincePick.current) ||
      !bubble
        ? own
        : box;
    if (
      mustShow.l >= view.l - 0.5 &&
      mustShow.t >= view.t - 0.5 &&
      mustShow.r <= view.r + 0.5 &&
      mustShow.b <= view.b + 0.5
    )
      return;
    // centred
    area.scrollTo({
      left: wide
        ? area.scrollLeft + (box.l + box.r) / 2 - (view.l + view.r) / 2
        : undefined,
      top: tall
        ? area.scrollTop + (box.t + box.b) / 2 - (view.t + view.b) / 2
        : undefined,
      behavior: 'smooth'
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world.id, selectedIndex, mapSize, spot]);

  // The phone panel keeps one height for every stop (r29), so a long stop
  // name can't grow it: a name too long for one line drops to a smaller
  // pixel size and wraps to two lines; one longer still ends in "…" and a
  // button over it opens it in full over the panel, the panel staying the
  // same size (r29 review N-3). The fit is worked out afresh for every
  // stop (and size, and font load), always from the plain closed title: a
  // new stop starts closed and unmeasured, then is measured one line, then
  // two (r30 review: measured with the last stop's name still open, a cut
  // name got no button).
  const titleRef = useRef<HTMLDivElement>(null);
  const titleKey = `${selected?.id}|${mapSize?.[0]}|${fontsTick}`;
  const [titleFit, setTitleFit] = useState({
    key: '',
    small: false,
    cut: false,
    done: false
  });
  const fit =
    titleFit.key === titleKey
      ? titleFit
      : { key: titleKey, small: false, cut: false, done: false };
  const [openTitleKey, setOpenTitleKey] = useState<string | null>(null);
  const titleOpen = fit.cut && openTitleKey === titleKey;
  const { small: titleSmall, done: titleDone } = fit;
  useLayoutEffect(() => {
    const title = titleRef.current;
    if (titleDone || !title) return;
    const overflows = titleSmall
      ? title.scrollHeight > title.clientHeight + 1
      : title.scrollWidth > title.clientWidth + 1;
    setTitleFit({
      key: titleKey,
      small: titleSmall || overflows,
      cut: titleSmall && overflows,
      done: titleSmall || !overflows
    });
  }, [titleKey, titleSmall, titleDone]);

  // Taps and clicks on the map are worked out here, from where the pointer
  // is: inside the PLAY bubble plays, inside a stop's tap box picks it (or,
  // already picked, plays it). The stops and the bubble take no pointer
  // events themselves (they stay buttons for the keyboard and screen
  // readers), so a browser's touch adjustment has nothing to snap to: it
  // weighs how much of the finger's area each tap target covers, and sent a
  // tap 2-3px inside a neighbour's box at its corner to the picked stop,
  // whatever size its button was (r30 review N-1). The boxes never overlap
  // (stopHitLimits), so a point is in one stop's box at most.
  type MapTarget = number | 'play' | null;
  const TAP_SLOP = 10;
  function targetAt(x: number, y: number): MapTarget {
    const map = mapRef.current;
    if (!map) return null;
    const inside = (r: DOMRect) =>
      x >= r.left && x < r.right && y >= r.top && y < r.bottom;
    const bubble = bubbleRef.current;
    if (bubble && !bubble.disabled && inside(bubble.getBoundingClientRect()))
      return 'play';
    for (const stop of map.querySelectorAll<HTMLElement>('[data-stop]'))
      if (inside(stop.getBoundingClientRect()))
        return Number(stop.dataset.stop);
    return null;
  }
  function tapNode(node: QuestNode) {
    if (selected?.id === node.id && node.unlocked && !starting)
      return onPlayNode(node);
    pickedByPlayer.current = node.id;
    onSelectNode(node.id);
  }
  // the target under the press, and where it was then (before the bubble's
  // pressed look moves it)
  const pressed = useRef<{
    target: MapTarget;
    x: number;
    y: number;
    mouse: boolean;
    rect: DOMRect | null;
  } | null>(null);
  function targetRect(target: MapTarget) {
    if (target === 'play')
      return bubbleRef.current?.getBoundingClientRect() || null;
    if (target === null) return null;
    return (
      mapRef.current
        ?.querySelector<HTMLElement>(`[data-stop="${target}"]`)
        ?.getBoundingClientRect() || null
    );
  }
  const [pressedPlay, setPressedPlay] = useState(false);
  const [hovered, setHovered] = useState<MapTarget>(null);
  const mapPointer = {
    onPointerDown: (e: React.PointerEvent) => {
      const target = targetAt(e.clientX, e.clientY);
      pressed.current = {
        target,
        x: e.clientX,
        y: e.clientY,
        mouse: e.pointerType !== 'touch',
        rect: targetRect(target)
      };
      setPressedPlay(target === 'play');
    },
    onPointerUp: () => setPressedPlay(false),
    onPointerCancel: () => setPressedPlay(false),
    onPointerMove: (e: React.PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const target = targetAt(e.clientX, e.clientY);
      if (target !== hovered) setHovered(target);
    },
    onPointerLeave: () => {
      setPressedPlay(false);
      setHovered(null);
    },
    onClick: (e: React.MouseEvent) => {
      // a stop's or the bubble's own click (the keyboard) is handled there
      if ((e.target as HTMLElement).closest('button')) return;
      const press = pressed.current;
      pressed.current = null;
      const moved = press
        ? Math.hypot(e.clientX - press.x, e.clientY - press.y)
        : Infinity;
      let target: MapTarget;
      if (press?.mouse) {
        // a mouse drag is never a click (r30b review SF-1: the stops take
        // no pointer events, so the browser clicks the map after any drag,
        // and a drag that ended on the picked stop started its run). It
        // counts only as a click on what it pressed, released on that same
        // target (where it was at the press: the bubble sinks when
        // pressed) within the tap slop, like a button.
        const r = press.rect;
        const releasedOn =
          !!r &&
          e.clientX >= r.left &&
          e.clientX < r.right &&
          e.clientY >= r.top &&
          e.clientY < r.bottom;
        if (moved >= TAP_SLOP || !releasedOn) return;
        target = press.target;
      } else {
        // a finger that moves pans the map, and the browser sends no click;
        // a tap the browser moved a little (touch adjustment) keeps its
        // pressed target
        target =
          press && moved < TAP_SLOP
            ? press.target
            : targetAt(e.clientX, e.clientY);
      }
      if (target === 'play') {
        if (selected?.unlocked && !starting) onPlayNode(selected);
      } else if (target !== null && world.nodes[target]) {
        tapNode(world.nodes[target]);
      }
    }
  };

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
        aria-busy={startingNemesis}
        onClick={onPlayNemesis}
        title={
          state.nemesis.length
            ? state.nemesis.map((n) => n.nameEn).join(', ')
            : 'Points you keep missing come here'
        }
      >
        {startingNemesis ? <Icon icon="spinner" pulse /> : <PixelIcon name="ghost" />}
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
          {...mapPointer}
          // the hovered stop's best grade (the stops take no pointer
          // events, so their own tooltips never showed; r30b review N-1)
          title={
            typeof hovered === 'number' && world.nodes[hovered]?.grade
              ? `Best grade ${world.nodes[hovered].grade}`
              : undefined
          }
          style={
            {
              cursor: hovered !== null ? 'pointer' : undefined,
              backgroundImage: `url(${WORLD_IMAGES[world.key]})`,
              '--map-per-tap': perGapPx.tap,
              '--map-per-big': perGapPx.big,
              '--map-per-edge': perGapPx.edge,
              '--map-per-big-edge': perGapPx.bigEdge,
              ...(mouseDiscs && {
                '--mouse-stop-art': `${mouseDiscs.stop}px`,
                '--mouse-boss-art': `${mouseDiscs.boss}px`,
                '--mouse-stop-k': mouseDiscs.stopK,
                '--mouse-boss-k': mouseDiscs.bossK
              })
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
                    node.unlocked && node.grade && 'gq-graded',
                    !node.unlocked && lockedCls,
                    !node.unlocked && 'gq-locked',
                    selected?.id === node.id && selectedCls,
                    hovered === i && hoveredNodeCls
                  )}
                  style={
                    {
                      // the button is the stop's tap box: its corner sits
                      // the box's reach up and left of the stop's point
                      left: `calc(${x}% - var(--reach-l))`,
                      top: `calc(${y}% - var(--reach-t))`,
                      ...(done
                        ? { '--disc-art': `url(${spriteUri(node.grade)})` }
                        : null),
                      ...(mouseDiscs && {
                        '--hover-zoom': mouseDiscs.hover[i]
                      }),
                      ...hit
                    } as React.CSSProperties
                  }
                  // a tap picks the stop; a tap on the picked stop plays it
                  // (Mikey 10-07: a player tapped the stop and "nothing
                  // happened" — the Play button was off to the side)
                  // the keyboard's (and a screen reader's) click; a pointer's
                  // lands on the map (mapPointer)
                  onClick={() => tapNode(node)}
                  aria-label={
                    node.grade
                      ? `${node.name}, best grade ${node.grade}`
                      : node.name
                  }
                >
                  {/* the disc art, centred on the stop's point; it takes no
                      taps (the button is the tap box) and zooms on hover */}
                  <span className={discArtCls}>
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
                  </span>
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
                            spot && TAIL_SIDE[spot.side],
                            // a game button's lift and press (it takes no
                            // pointer events; the ▶ ring stays put)
                            spot?.side !== 'on' &&
                              !starting &&
                              (pressedPlay
                                ? bubblePressedCls
                                : hovered === 'play' && bubbleHoverCls)
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
                          aria-busy={startingNodeId === node.id}
                          onClick={() => onPlayNode(node)}
                          aria-label={`Play ${node.name}`}
                        >
                          {startingNodeId === node.id ? <Icon icon="spinner" pulse /> : spot?.side === 'on' ? (
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
              aria-busy={startingNodeId === selected.id}
              onClick={() => onPlayNode(selected)}
            >
              {startingNodeId === selected.id
                ? 'Starting…'
                : selected.freeRematch
                  ? selected.kind === 'stop'
                    ? 'Free replay'
                    : 'Free rematch'
                  : selected.cleared
                    ? 'Play again'
                    : 'Play'}
              {startingNodeId === selected.id && <Icon icon="spinner" pulse style={{ marginLeft: '0.7rem' }} />}
            </button>
            <div className={panelBodyCls}>
              <div className={panelLabelCls}>
                {selected.kind === 'stop'
                  ? `Stop ${selected.index}`
                  : selected.kind === 'fort'
                    ? 'Fort · mini-boss'
                    : 'Castle · world boss'}
              </div>
              <div
                ref={titleRef}
                className={cx(
                  panelTitleCls,
                  fit.small && smallTitleCls,
                  titleOpen && titleOpenCls
                )}
                title={selected.name}
              >
                {selected.name}
                {fit.cut && (
                  // over the whole name: opens it in full, and closes it
                  <button
                    type="button"
                    className={titleToggleCls}
                    aria-expanded={titleOpen}
                    aria-label={
                      titleOpen
                        ? 'Hide the full name'
                        : `Show the full name: ${selected.name}`
                    }
                    onClick={() => setOpenTitleKey(titleOpen ? null : titleKey)}
                  />
                )}
              </div>
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
// fine pointer with no touch screen it is 28px. So is --big-need there,
// in the mouse layout's own units: a pair with a fort or castle in it
// counts as 28px apart once its smallest mouse discs (26px stops, 34px
// forts and castles) clear each other with a pixel of air (roomAround in
// stopSpacing.ts; decided 10-12: on a mouse no two marbles overlap, r29
// review SF-2; in a narrow window, its 24px and 28.8px design discs, on
// its own mouse layout, r31 review SF-1). Each disc is then drawn as big as the map's gaps allow
// (mouseDiscSizes), up to its usual size, so the desktop map stays whole
// unless even the smallest discs can't fit. There a scrolling map shows a
// styled scrollbar (macOS hides the default one until you scroll).
const FINE_POINTER_QUERY = '(pointer: fine) and (not (any-pointer: coarse))';
const FINE_POINTER = `@media ${FINE_POINTER_QUERY}`;
// whether a media query applies, kept up to date (FINE_POINTER_QUERY: the
// mouse layout and disc sizes go with the mouse sizes in CSS)
function useMediaMatch(query: string) {
  const list = () =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia(query)
      : null;
  const [matches, setMatches] = useState(() => !!list()?.matches);
  useEffect(() => {
    const media = list();
    if (!media) return;
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
    // list() reads only the query
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);
  return matches;
}
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
// a drawn stop's tap box (its button, as stopHitLimits cut it) and its
// disc and tap box together, in viewport px
function stopBoxOf(stop: HTMLElement) {
  // the button is the tap box; its first child is the disc art, measured
  // unscaled (it zooms under a hovering mouse)
  const r = stop.getBoundingClientRect();
  const art = stop.firstElementChild as HTMLElement;
  const a = art.getBoundingClientRect();
  const cx = (a.left + a.right) / 2;
  const cy = (a.top + a.bottom) / 2;
  const halfW = art.offsetWidth / 2;
  const halfH = art.offsetHeight / 2;
  const tap = { l: r.left, t: r.top, r: r.right, b: r.bottom };
  return {
    l: Math.min(tap.l, cx - halfW),
    t: Math.min(tap.t, cy - halfH),
    r: Math.max(tap.r, cx + halfW),
    b: Math.max(tap.b, cy + halfH),
    cx,
    cy,
    tap
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
    const box = stopBoxOf(stop);
    return {
      l: box.l - ox,
      t: box.t - oy,
      r: box.r - ox,
      b: box.b - oy,
      cx: box.cx - ox,
      cy: box.cy - oy,
      tap: box.tap
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
  // the stop's own tap box exactly, never its disc: on a mouse a disc is
  // wider than its box, and a Play box that size reached into the next
  // stop's box, so a click meant to pick it started this run (r29 review)
  if (!clear)
    return {
      side: 'on',
      dx: own.tap.l - ox - own.cx,
      dy: own.tap.t - oy - own.cy,
      tail: 0,
      width: own.tap.r - own.tap.l,
      height: own.tap.b - own.tap.t
    };
  const { side, x, y } = clear;
  const along = side === 'above' || side === 'below';
  const tail = along
    ? Math.max(14, Math.min(width - 14, own.cx - x))
    : Math.max(12, Math.min(height - 12, own.cy - y));
  return { side, dx: x - own.cx, dy: y - own.cy, tail };
}

// A stop's button IS its tap box (r30 review N-1): --hit-pad past its disc
// on every side, cut back on a side where the gap to a neighbour is shorter
// (inside the disc too, where two discs nearly touch). Nothing of a stop
// that takes taps lies outside its box, so no part of one stop sits over
// another's box and a browser's touch adjustment has only the boxes to
// snap to (a ::before box beside a disc-sized button let Chromium send a
// tap 2px inside a neighbour to the picked stop). --reach-* is how far the
// box reaches from the stop's point on each side.
const reach = (side: string) =>
  `min(var(--disc) / 2 + var(--hit-pad), var(--hit-${side}, 999px))`;

// --disc sizes the tap box; --art is the disc as drawn: the same, but on a
// mouse as big as the map's gaps allow (mouseDiscSizes, set on the map),
// with its number, icon and flag scaled to match (--art-k)
const nodeCls = css`
  --hit-pad: 6px;
  --disc: 3.6rem;
  --art: var(--disc);
  --art-k: 1;
  --reach-t: ${reach('t')};
  --reach-r: ${reach('r')};
  --reach-b: ${reach('b')};
  --reach-l: ${reach('l')};
  position: absolute;
  width: calc(var(--reach-l) + var(--reach-r));
  height: calc(var(--reach-t) + var(--reach-b));
  padding: 0;
  border: none;
  /* the disc's picture, drawn by its art span (discArtCls); the classes
     below and a cleared node's marble set it */
  --disc-art: ${disc(12, OPEN_DISC)};
  background: none;
  image-rendering: pixelated;
  filter: drop-shadow(0 3px 0 rgba(26, 20, 38, 0.45));
  /* the map takes the pointer and works out which box it is in (see
     mapPointer); the button is for the keyboard and screen readers */
  pointer-events: none;
  @media (max-width: ${mobileMaxWidth}) {
    /* 24px disc + 10px all round = a 44px tap box */
    --hit-pad: 10px;
    --disc: 3rem;
  }
  ${FINE_POINTER} {
    --art: var(--mouse-stop-art, var(--disc));
    --art-k: var(--mouse-stop-k, 1);
  }
`;

// the stop under a mouse (mapPointer): its disc art zooms, its box (the
// button) never does, so hit areas are the same hovered or not; on a
// mouse it zooms only as far as keeps its neighbours a pixel clear
// (--hover-zoom, mouseDiscSizes)
const hoveredNodeCls = css`
  @media (hover: hover) {
    > span {
      transform: scale(var(--hover-zoom, 1.08));
    }
  }
`;

const bigNodeCls = css`
  --disc: 4.5rem;
  @media (max-width: ${mobileMaxWidth}) {
    --disc: 3.6rem;
  }
  ${FINE_POINTER} {
    --art: var(--mouse-boss-art, var(--disc));
    --art-k: var(--mouse-boss-k, 1);
  }
`;

// a node's disc art: its picture (--disc-art) with its number or icon,
// centred on the stop's point inside (or, on a mouse, past) its tap box
const discArtCls = css`
  position: absolute;
  left: var(--reach-l);
  top: var(--reach-t);
  width: var(--art);
  height: var(--art);
  margin: calc(var(--art) / -2) 0 0 calc(var(--art) / -2);
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--disc-art) center / 100% 100% no-repeat;
  transition: transform 0.15s;
  > * {
    scale: var(--art-k);
  }
`;
const openNodeCls = css`
  --disc-art: ${disc(12, OPEN_DISC)};
`;
// big (boss) discs use the 15-row art, stops the 12-row
const GRADE_NODE: Record<string, string> = Object.fromEntries(
  Object.entries(GRADE_DISCS).map(([grade, p]) => [
    grade,
    css`
      --disc-art: ${disc(12, p)};
      &.gq-big {
        --disc-art: ${disc(15, p)};
      }
      color: #fff;
    `
  ])
);

const bossNodeCls = css`
  --disc-art: ${disc(15, BOSS_DISC)};
`;

const lockedCls = css`
  --disc-art: ${disc(12, STONE_DISC)};
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

// it scales with the disc (--art-k) from its corner, so it stays pinned
// to the same place on a smaller marble
const flagCls = css`
  position: absolute;
  right: calc(-0.6rem * var(--art-k, 1));
  top: calc(-1.2rem * var(--art-k, 1));
  transform-origin: 100% 0;
`;

// the node you're up to: a gold pixel ring that keeps rippling out
// (transform/opacity only). --ring is its size around a disc drawn at its
// design size; on a mouse it scales with the drawn marble (--mouse-*-k,
// mouseDiscSizes), so a crowded world's smaller marbles get a smaller ring
// (r31 review N-4)
const pulseCls = css`
  --ring: 4.8rem;
  --ring-size: calc(var(--ring) * var(--ring-k, 1));
  position: absolute;
  width: var(--ring-size);
  height: var(--ring-size);
  margin: calc(var(--ring-size) / -2) 0 0 calc(var(--ring-size) / -2);
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
    --ring: 4.2rem;
  }
  ${FINE_POINTER} {
    --ring-k: var(--mouse-stop-k, 1);
  }
`;

const bigPulseCls = css`
  --ring: 5.8rem;
  @media (max-width: ${mobileMaxWidth}) {
    --ring: 4.8rem;
  }
  ${FINE_POINTER} {
    --ring-k: var(--mouse-boss-k, 1);
  }
`;

// the selected node gets a bobbing pointer above it
// the PLAY bubble above the picked stop: a gold game button with a tail
const playAnchorCls = css`
  position: absolute;
  z-index: 4;
  width: 0;
  height: 0;
  /* takes no clicks: its line box is taller than the bubble and swallowed
     clicks on the next stop's tap box (r30); the map handles them */
  pointer-events: none;
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
  /* the map takes the pointer (mapPointer) */
  pointer-events: none;
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
const bubbleHoverCls = css`
  && {
    transform: translateY(-1px);
  }
`;
// pressed like every game button (button()'s :active): it sinks onto its
// shadow, so the shadow goes
const bubblePressedCls = css`
  && {
    transform: translateY(4px);
    filter: none;
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
    /* and it never lifts or sinks (a game button's press shifts it 4px,
       into the next stop's box) */
    &&&:hover:not(:disabled),
    &&&:active:not(:disabled) {
      transform: none;
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
  /* the stop's full name opens over it (titleOpenCls) */
  position: relative;
  /* phones: as tall as the panel row, its text centred, so the opened
     name has the panel's whole height */
  @media (max-width: ${mobileMaxWidth}) {
    align-self: stretch;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
`;

const panelLabelCls = css`
  font-family: ${PIXEL_FONT};
  font-size: 0.8rem;
  line-height: 1.6;
  text-transform: uppercase;
  color: #8a5a2b;
`;

const panelTitleCls = css`
  position: relative;
  /* its name toggle's focus ring, round the title (titleToggleCls) */
  &:has(> button:focus-visible) {
    outline: 2px solid ${INK};
    outline-offset: 2px;
  }
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
// too long for one line (measured, see titleFit): a smaller pixel size, up
// to two lines, in the panel's fixed height
const smallTitleCls = css`
  @media (max-width: ${mobileMaxWidth}) {
    && {
      margin: 0;
      font-size: 10px;
      line-height: 1.2;
      white-space: normal;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }
  }
`;
// the see-through button over a cut name (and over the opened name)
const titleToggleCls = css`
  position: absolute;
  inset: 0;
  width: 100%;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  &:focus-visible {
    /* inside the title, which clips what overflows it */
    outline: 2px solid ${INK};
    outline-offset: -2px;
  }
  /* where it can, the ring goes round the title instead, clear of its
     letters (r30b review N-2: the inset ring crossed the glyph tops) */
  @supports selector(:has(*)) {
    &:focus-visible {
      outline: none;
    }
  }
`;
// a cut name, tapped: shown whole over the panel's text (same panel size)
const titleOpenCls = css`
  @media (max-width: ${mobileMaxWidth}) {
    &&& {
      position: absolute;
      inset: 0;
      z-index: 1;
      margin: 0;
      display: block;
      -webkit-line-clamp: unset;
      overflow-y: auto;
      background: ${PARCHMENT.f};
    }
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
