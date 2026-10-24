import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { css, cx, keyframes } from '@emotion/css';
import Icon from '~/components/Icon';
import { useAppContext } from '~/contexts';
import { mobileMaxWidth } from '~/constants/css';
import ArenaButton from '../ArenaButton';
import { ARENA } from '../theme';
import { BOSSES, bossCardURL } from '../bosses';
import type { ArenaExamSummary, ArenaState } from '../types';
import {
  MIN_POWER,
  atRest,
  chooseRivalShot,
  createWorld,
  deskFor,
  flick,
  mulberry32,
  outcome,
  powerFromDrag,
  rivalSkill,
  step,
  STEP,
  type Outcome,
  type World
} from './physics';
import {
  drawAim,
  drawCrumbs,
  drawEraser,
  fitView,
  paintDesk,
  spawnCrumbs,
  updateCrumbs,
  type Crumb,
  type EraserLook,
  type View
} from './draw';

// 지우개 따먹기, the 90s classroom eraser game, as a Train mini-game (Mikey
// 10-24: "Beating a fighter wins their eraser card. Train gets a flick
// mini-game played with your won cards"). Nothing is at stake: no XP, no
// Coins, just the stamp. Members play with the boss erasers they have won
// (any slain mode); with none yet, one practice round with plain erasers.

type Opponent = 'cpu' | 'friend';
type Phase = 'lobby' | 'play';
type Busy = 'aim' | 'moving' | 'rival' | 'result';

const TUTORIAL_KEY = 'twinkle-arena-eraser-howto-seen';
const PLAYER_COLORS = [ARENA.train, ARENA.accent];
const PLAIN_YOU: EraserLook = {
  examKey: null,
  label: 'TWINKLE',
  color: ARENA.sky,
  rubber: '#f6f2ea'
};
const PLAIN_RIVAL: EraserLook = {
  examKey: null,
  label: 'RIVAL',
  color: ARENA.accent,
  rubber: '#f6b8c4'
};

function lookFor(exam: ArenaExamSummary): EraserLook {
  const boss = BOSSES[exam.key];
  return {
    examKey: exam.key,
    label: boss?.name || exam.name,
    color: boss?.color || ARENA.sky
  };
}

function isWon(exam: ArenaExamSummary) {
  return exam.difficulties.some((d) => d.slain);
}

function readSeen() {
  try {
    return localStorage.getItem(TUTORIAL_KEY) === '1';
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    localStorage.setItem(TUTORIAL_KEY, '1');
  } catch {
    // private mode: it shows again next visit, which is fine
  }
}

export default function EraserFlick({
  onOpenArena
}: {
  onOpenArena: () => void;
}) {
  const loadArenaState = useAppContext((v) => v.requestHelpers.loadArenaState);
  const [state, setState] = useState<ArenaState | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [phase, setPhase] = useState<Phase>('lobby');
  const [opponent, setOpponent] = useState<Opponent>('cpu');
  const [practice, setPractice] = useState(false);
  const [pick, setPick] = useState<string>('');
  const [pick2, setPick2] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    loadArenaState()
      .then((data: ArenaState) => {
        if (cancelled) return;
        setState(data);
        const first = (data?.exams || []).find(isWon);
        if (first) setPick(first.key);
      })
      .catch(() => !cancelled && setLoadError(true));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Game pages block pinch-zoom by default (Mikey 10-18); a page that needs
  // zoom opts out with data-twinkle-allow-zoom on <html> or <body>.
  useEffect(() => {
    function block(event: Event) {
      if (
        document.documentElement.hasAttribute('data-twinkle-allow-zoom') ||
        document.body.hasAttribute('data-twinkle-allow-zoom')
      ) {
        return;
      }
      event.preventDefault();
    }
    document.addEventListener('gesturestart', block, { passive: false });
    document.addEventListener('gesturechange', block, { passive: false });
    return () => {
      document.removeEventListener('gesturestart', block);
      document.removeEventListener('gesturechange', block);
    };
  }, []);

  const exams = useMemo(() => state?.exams || [], [state]);
  const won = useMemo(() => exams.filter(isWon), [exams]);
  const skill = rivalSkill(won.length, exams.length);

  const looks = useMemo<[EraserLook, EraserLook]>(() => {
    if (practice) return [PLAIN_YOU, PLAIN_RIVAL];
    const mine = exams.find((e) => e.key === pick);
    const you = mine ? lookFor(mine) : PLAIN_YOU;
    if (opponent === 'friend') {
      const theirs = exams.find((e) => e.key === pick2);
      return [you, theirs ? lookFor(theirs) : PLAIN_RIVAL];
    }
    // the computer plays with another boss's eraser
    const others = exams.filter((e) => e.key !== pick && BOSSES[e.key]);
    const rival = others.length
      ? others[(pick.length + won.length) % others.length]
      : null;
    return [you, rival ? lookFor(rival) : PLAIN_RIVAL];
  }, [exams, opponent, pick, pick2, practice, won.length]);

  if (phase === 'play') {
    return (
      <Game
        looks={looks}
        names={
          opponent === 'friend' && !practice
            ? ['Player 1', 'Player 2']
            : ['You', practice ? 'Rival' : rivalName(looks[1])]
        }
        vsCpu={practice || opponent === 'cpu'}
        practice={practice}
        skill={practice ? 0 : skill}
        onQuit={() => {
          setPhase('lobby');
          setPractice(false);
        }}
        onOpenArena={onOpenArena}
      />
    );
  }

  return (
    <div className={lobbyCls} data-twinkle-no-select="">
      <header className={lobbyHeadCls}>
        <h1>
          지우개 따먹기 <small>Eraser flick</small>
        </h1>
        <p>
          Flick your eraser so it climbs on top of theirs. Every boss you beat
          in the Arena gives you their eraser to play with.
        </p>
      </header>

      {loadError && (
        <p className={noteCls}>
          Your erasers could not be loaded. You can still play a practice round.
        </p>
      )}

      {!state && !loadError ? (
        <p className={noteCls}>Opening your pencil case…</p>
      ) : (
        <>
          <div className={countRowCls}>
            <strong>
              {won.length} of {exams.length || 6} erasers won
            </strong>
            {won.length > 0 && <span>Pick one to play with</span>}
          </div>
          <div
            className={cardGridCls}
            role="radiogroup"
            aria-label="Your eraser"
          >
            {exams.map((exam) => {
              const owned = isWon(exam);
              const on = owned && pick === exam.key;
              return (
                <button
                  key={exam.key}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  disabled={!owned}
                  className={cx(cardCls, on && cardOnCls)}
                  style={{ background: BOSSES[exam.key]?.color || ARENA.sky }}
                  onClick={() => setPick(exam.key)}
                  title={
                    owned
                      ? BOSSES[exam.key]?.nameEn || exam.nameEn
                      : `Beat BOSS ${exam.code} in the Arena to win this eraser`
                  }
                >
                  <img
                    src={bossCardURL(exam.key)}
                    alt={owned ? BOSSES[exam.key]?.name || exam.name : ''}
                    className={cx(cardImgCls, !owned && lockedImgCls)}
                    draggable={false}
                  />
                  {!owned && (
                    <span className={lockCls}>
                      <Icon icon="lock" />
                      <small>BOSS {exam.code}</small>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {won.length === 0 ? (
            <div className={emptyCls}>
              <p>
                You have not won an eraser yet. Beat any boss in the Arena, on
                any mode, and their eraser card is yours to flick here.
              </p>
              <div className={actionsCls}>
                <ArenaButton
                  tone="train"
                  onClick={() => {
                    setPractice(true);
                    setPhase('play');
                  }}
                >
                  <Icon icon="play" /> Practice round
                </ArenaButton>
                <ArenaButton tone="paper" onClick={onOpenArena}>
                  Go to the Arena
                </ArenaButton>
              </div>
            </div>
          ) : (
            <>
              <div
                className={opponentRowCls}
                role="radiogroup"
                aria-label="Opponent"
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={opponent === 'cpu'}
                  className={cx(chipCls, opponent === 'cpu' && chipOnCls)}
                  onClick={() => setOpponent('cpu')}
                >
                  <Icon icon="robot" /> vs Computer
                  <small>Lv {won.length}</small>
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={opponent === 'friend'}
                  className={cx(chipCls, opponent === 'friend' && chipOnCls)}
                  onClick={() => setOpponent('friend')}
                >
                  <Icon icon="users" /> 2 players, one device
                </button>
              </div>
              {opponent === 'friend' && (
                <div className={p2RowCls}>
                  <span>Player 2 plays with</span>
                  <div
                    className={p2ChoicesCls}
                    role="radiogroup"
                    aria-label="Player 2's eraser"
                  >
                    <button
                      type="button"
                      role="radio"
                      aria-checked={!pick2}
                      className={cx(miniChoiceCls, !pick2 && cardOnCls)}
                      onClick={() => setPick2('')}
                    >
                      Plain
                    </button>
                    {won.map((exam) => (
                      <button
                        key={exam.key}
                        type="button"
                        role="radio"
                        aria-checked={pick2 === exam.key}
                        className={cx(
                          miniChoiceCls,
                          pick2 === exam.key && cardOnCls
                        )}
                        onClick={() => setPick2(exam.key)}
                      >
                        <img
                          src={bossCardURL(exam.key)}
                          alt={BOSSES[exam.key]?.name || exam.name}
                          draggable={false}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className={actionsCls}>
                <ArenaButton
                  tone="train"
                  disabled={!pick}
                  onClick={() => setPhase('play')}
                >
                  <Icon icon="play" /> Play
                </ArenaButton>
              </div>
              <p className={footNoteCls}>
                Just for fun: no XP or Coins ride on it.
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
}

function rivalName(look: EraserLook) {
  if (!look.examKey) return 'Rival';
  return BOSSES[look.examKey]?.name || 'Rival';
}

function Game({
  looks,
  names,
  vsCpu,
  practice,
  skill,
  onQuit,
  onOpenArena
}: {
  looks: [EraserLook, EraserLook];
  names: [string, string];
  vsCpu: boolean;
  practice: boolean;
  skill: number;
  onQuit: () => void;
  onOpenArena: () => void;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const shakeRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [round, setRound] = useState(1);
  const [score, setScore] = useState<[number, number]>([0, 0]);
  const [turn, setTurn] = useState(0);
  const [busy, setBusy] = useState<Busy>('aim');
  const [result, setResult] = useState<Outcome | null>(null);
  const [showHelp, setShowHelp] = useState(() => !readSeen());

  const worldRef = useRef<World | null>(null);
  const viewRef = useRef<View | null>(null);
  const deskImgRef = useRef<{ key: string; canvas: HTMLCanvasElement } | null>(
    null
  );
  const imagesRef = useRef<(HTMLImageElement | null)[]>([null, null]);
  const crumbsRef = useRef<Crumb[]>([]);
  const fxRngRef = useRef(mulberry32(Date.now() & 0xffff));
  const rivalRngRef = useRef(mulberry32((Date.now() >> 8) & 0xffffff));
  const aimRef = useRef<{
    pointerId: number;
    sx: number;
    sy: number;
    angle: number;
    power: number;
  } | null>(null);
  const rivalAimRef = useRef<{
    angle: number;
    power: number;
    start: number;
  } | null>(null);
  const fallRef = useRef<(number | null)[]>([null, null]);
  const shakeAmpRef = useRef(0);
  const accRef = useRef(0);
  const lastRef = useRef(0);
  const rafRef = useRef(0);
  const turnRef = useRef(0);
  const busyRef = useRef<Busy>('aim');
  const timersRef = useRef<number[]>([]);
  const reduceMotion = useMemo(() => {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return false;
    }
  }, []);

  turnRef.current = turn;
  busyRef.current = busy;

  // tutorial: shown once, counted as seen as soon as it shows (not won)
  useEffect(() => {
    if (showHelp) markSeen();
  }, [showHelp]);

  // card images
  useEffect(() => {
    imagesRef.current = looks.map((look) => {
      if (!look.examKey) return null;
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => kick();
      img.src = bossCardURL(look.examKey);
      return img;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [looks]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      setSize({ w: Math.floor(rect.width), h: Math.floor(rect.height) });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // a fresh desk each round; the shape follows the screen at round start
  useEffect(() => {
    if (!size.w || !size.h) return;
    const desk = deskFor(size.w / size.h);
    worldRef.current = createWorld(desk, mulberry32(round * 9973 + 17));
    fallRef.current = [null, null];
    crumbsRef.current = [];
    kick();
    // size is read once per round on purpose
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, size.w > 0 && size.h > 0]);

  // canvas size and view follow the wrapper
  useEffect(() => {
    const canvas = canvasRef.current;
    const world = worldRef.current;
    if (!canvas || !size.w || !size.h) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(size.w * dpr);
    canvas.height = Math.round(size.h * dpr);
    canvas.style.width = `${size.w}px`;
    canvas.style.height = `${size.h}px`;
    if (world) viewRef.current = fitView(world.desk, size.w, size.h);
    kick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, round]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  // computer's turn: think, show its aim, flick
  useEffect(() => {
    if (!vsCpu || turn !== 1 || busy !== 'rival') return;
    const think = window.setTimeout(() => {
      const world = worldRef.current;
      if (!world) return;
      const shot = chooseRivalShot(world, 1, skill, rivalRngRef.current);
      rivalAimRef.current = {
        angle: shot.angle,
        power: shot.power,
        start: performance.now()
      };
      kick();
      const fire = window.setTimeout(() => {
        rivalAimRef.current = null;
        if (!worldRef.current) return;
        flick(worldRef.current, 1, shot.angle, shot.power);
        setBusy('moving');
        busyRef.current = 'moving';
        kick();
      }, 750);
      timersRef.current.push(fire);
    }, 650);
    timersRef.current.push(think);
    return () => window.clearTimeout(think);
    // kick() only starts the frame loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy, skill, turn, vsCpu]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const world = worldRef.current;
    const view = viewRef.current;
    if (!canvas || !world || !view) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = canvas.width / Math.max(1, size.w);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size.w, size.h);

    const deskKey = `${world.desk.w}x${world.desk.h}@${view.scale.toFixed(3)}:${dpr}`;
    if (!deskImgRef.current || deskImgRef.current.key !== deskKey) {
      deskImgRef.current = {
        key: deskKey,
        canvas: paintDesk(world.desk, view, dpr)
      };
    }
    const deskCanvas = deskImgRef.current.canvas;
    ctx.drawImage(
      deskCanvas,
      view.ox - 10,
      view.oy - 10,
      deskCanvas.width / dpr,
      deskCanvas.height / dpr
    );

    const now = performance.now();
    const order = [0, 1].sort(
      (a, b) =>
        (world.erasers[a].on !== null ? 1 : 0) -
        (world.erasers[b].on !== null ? 1 : 0)
    );
    order.forEach((i) => {
      const e = world.erasers[i];
      const fallStart = fallRef.current[i];
      const fall = e.fallen
        ? fallStart === null
          ? 1
          : Math.min(1, (now - fallStart) / 450)
        : 0;
      if (fall >= 1) return;
      const ring =
        busyRef.current === 'aim' || busyRef.current === 'rival'
          ? turnRef.current === i
            ? PLAYER_COLORS[i]
            : null
          : null;
      drawEraser(ctx, e, view, looks[i], imagesRef.current[i], {
        lift: e.on !== null ? 1 : 0,
        fall,
        ring
      });
    });

    drawCrumbs(ctx, crumbsRef.current, view);

    const aim = aimRef.current;
    if (aim && aim.power > 0) {
      drawAim(
        ctx,
        world.erasers[turnRef.current],
        view,
        aim.angle,
        aim.power,
        PLAYER_COLORS[turnRef.current]
      );
    }
    const rivalAim = rivalAimRef.current;
    if (rivalAim) {
      const t = Math.min(1, (now - rivalAim.start) / 600);
      drawAim(
        ctx,
        world.erasers[1],
        view,
        rivalAim.angle,
        rivalAim.power * t,
        PLAYER_COLORS[1]
      );
    }
  }, [looks, size.w, size.h]);

  const frame = useCallback(
    (time: number) => {
      rafRef.current = 0;
      const world = worldRef.current;
      if (!world) return;
      const dt = Math.min(
        0.05,
        lastRef.current ? (time - lastRef.current) / 1000 : 0
      );
      lastRef.current = time;

      if (busyRef.current === 'moving') {
        accRef.current += dt;
        while (accRef.current >= STEP && busyRef.current === 'moving') {
          step(world);
          accRef.current -= STEP;
          world.events.forEach((event) => {
            if (event.kind === 'fall') {
              fallRef.current[event.who] = time;
              return;
            }
            if (event.kind === 'slip') return;
            spawnCrumbs(
              crumbsRef.current,
              event.x,
              event.y,
              event.strength,
              event.kind === 'climb'
                ? ['#f2c14e', '#fffdf8', '#c9bfae']
                : ['#c9bfae', '#fffdf8', '#e8a0ae'],
              fxRngRef.current
            );
            if (!reduceMotion) {
              shakeAmpRef.current = Math.max(
                shakeAmpRef.current,
                Math.min(7, event.strength / (event.kind === 'climb' ? 14 : 18))
              );
            }
          });
          world.events = [];
          if (atRest(world)) {
            accRef.current = 0;
            finishShot();
          }
        }
      }
      updateCrumbs(crumbsRef.current, dt);

      const shakeEl = shakeRef.current;
      if (shakeEl) {
        const amp = shakeAmpRef.current;
        if (amp > 0.2) {
          const rng = fxRngRef.current;
          shakeEl.style.transform = `translate(${(rng() - 0.5) * 2 * amp}px, ${(rng() - 0.5) * 2 * amp}px)`;
          shakeAmpRef.current = amp * Math.pow(0.02, dt);
        } else if (amp) {
          shakeAmpRef.current = 0;
          shakeEl.style.transform = '';
        }
      }

      draw();

      const falling = fallRef.current.some(
        (start) => start !== null && time - start < 460
      );
      if (
        busyRef.current === 'moving' ||
        crumbsRef.current.length ||
        shakeAmpRef.current > 0 ||
        falling ||
        rivalAimRef.current
      ) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        lastRef.current = 0;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [draw, reduceMotion]
  );

  function kick() {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(frame);
  }

  // draw() changes identity with size/looks; redraw once when it does
  useEffect(() => {
    kick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draw]);

  function finishShot() {
    const world = worldRef.current;
    if (!world) return;
    const shooter = turnRef.current;
    const res = outcome(world, shooter);
    if (res.winner !== null) {
      busyRef.current = 'result';
      setBusy('result');
      setResult(res);
      setScore((prev) => {
        const next: [number, number] = [prev[0], prev[1]];
        next[res.winner as number] += 1;
        return next;
      });
      return;
    }
    const next = 1 - shooter;
    turnRef.current = next;
    setTurn(next);
    const nextBusy: Busy = vsCpu && next === 1 ? 'rival' : 'aim';
    busyRef.current = nextBusy;
    setBusy(nextBusy);
  }

  function nextRound() {
    // the round's loser flicks first
    const first = result?.winner === 0 ? 1 : 0;
    setResult(null);
    turnRef.current = first;
    setTurn(first);
    const nextBusy: Busy = vsCpu && first === 1 ? 'rival' : 'aim';
    busyRef.current = nextBusy;
    setBusy(nextBusy);
    setRound((r) => r + 1);
  }

  function toWorld(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    const view = viewRef.current;
    if (!canvas || !view) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left - view.ox) / view.scale,
      y: (clientY - rect.top - view.oy) / view.scale
    };
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (busyRef.current !== 'aim' || showHelp) return;
    if (vsCpu && turnRef.current === 1) return;
    const point = toWorld(event.clientX, event.clientY);
    if (!point) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    aimRef.current = {
      pointerId: event.pointerId,
      sx: point.x,
      sy: point.y,
      angle: 0,
      power: 0
    };
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    const aim = aimRef.current;
    if (!aim || aim.pointerId !== event.pointerId) return;
    const point = toWorld(event.clientX, event.clientY);
    if (!point) return;
    // pulled back from the start point; the flick goes the other way
    const dx = aim.sx - point.x;
    const dy = aim.sy - point.y;
    aim.power = powerFromDrag(Math.hypot(dx, dy));
    aim.angle = Math.atan2(dy, dx);
    kick();
  }

  function handlePointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
    const aim = aimRef.current;
    if (!aim || aim.pointerId !== event.pointerId) return;
    aimRef.current = null;
    const world = worldRef.current;
    if (!world || aim.power < MIN_POWER) {
      kick();
      return;
    }
    flick(world, turnRef.current, aim.angle, aim.power);
    busyRef.current = 'moving';
    setBusy('moving');
    kick();
  }

  function handlePointerCancel() {
    aimRef.current = null;
    kick();
  }

  const youWon = result?.winner === 0;
  const stamp = result ? stampFor(result, names, vsCpu) : null;

  return (
    <div className={gameCls} data-twinkle-no-select="">
      <div className={hudCls}>
        <Side
          look={looks[0]}
          name={names[0]}
          score={score[0]}
          active={turn === 0}
          color={PLAYER_COLORS[0]}
        />
        <div className={turnCls}>
          {busy === 'result'
            ? `Round ${round}`
            : busy === 'moving'
              ? 'Sliding…'
              : busy === 'rival'
                ? `${names[1]} is aiming…`
                : vsCpu
                  ? 'Your flick'
                  : `${names[turn]}'s flick`}
        </div>
        <Side
          look={looks[1]}
          name={names[1]}
          score={score[1]}
          active={turn === 1}
          color={PLAYER_COLORS[1]}
          right
        />
      </div>

      <div className={deskWrapCls} ref={wrapRef}>
        <div ref={shakeRef} className={shakeCls}>
          <canvas
            ref={canvasRef}
            className={canvasCls}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            aria-label="Desk. Drag back and let go to flick your eraser."
          />
        </div>

        {stamp && (
          <div className={resultCls}>
            <div
              className={cx(
                stampCls,
                youWon || !vsCpu ? stampWinCls : stampLoseCls
              )}
            >
              <b>{stamp.big}</b>
              <span>{stamp.small}</span>
            </div>
            <div className={actionsCls}>
              {practice ? (
                <>
                  <ArenaButton tone="train" size="md" onClick={nextRound}>
                    Practice again
                  </ArenaButton>
                  <ArenaButton tone="paper" size="md" onClick={onOpenArena}>
                    Win an eraser in the Arena
                  </ArenaButton>
                </>
              ) : (
                <>
                  <ArenaButton tone="train" size="md" onClick={nextRound}>
                    Next round
                  </ArenaButton>
                  <ArenaButton tone="paper" size="md" onClick={onQuit}>
                    Change erasers
                  </ArenaButton>
                </>
              )}
            </div>
          </div>
        )}

        {showHelp && (
          <div className={helpBackCls}>
            <div className={helpCls} role="dialog" aria-label="How to play">
              <h2>How to play</h2>
              <ol>
                <li>
                  <b>Drag back</b> anywhere on the desk and let go. Your eraser
                  flies the other way; a longer pull is a harder flick.
                </li>
                <li>
                  <b>Climb on top</b> of the other eraser, covering at least
                  half of it, to win the round.
                </li>
                <li>
                  Hit it <b>straight</b> and not too hard: a tap just bumps, a
                  slam bounces it away. Slide off the desk and you lose.
                </li>
              </ol>
              <ArenaButton
                tone="ink"
                size="md"
                onClick={() => setShowHelp(false)}
              >
                Got it
              </ArenaButton>
            </div>
          </div>
        )}
      </div>

      <div className={footCls}>
        <button type="button" className={linkCls} onClick={onQuit}>
          <Icon icon="arrow-left" /> {practice ? 'Back' : 'Erasers'}
        </button>
        <span className={hintCls}>
          {busy === 'aim' ? 'Pull back, let go' : ' '}
        </span>
        <button
          type="button"
          className={linkCls}
          onClick={() => setShowHelp(true)}
          aria-label="How to play"
        >
          <Icon icon="question" /> Rules
        </button>
      </div>
    </div>
  );
}

function stampFor(result: Outcome, names: [string, string], vsCpu: boolean) {
  const winner = result.winner ?? 0;
  const loser = 1 - winner;
  const why =
    result.reason === 'climb'
      ? `${names[winner]} climbed on top`
      : result.reason === 'knock'
        ? `${names[loser]} got knocked off the desk`
        : `${names[loser]} slid off the desk`;
  if (!vsCpu) return { big: `${names[winner]} wins!`, small: why };
  return winner === 0
    ? { big: 'WIN!', small: why }
    : { big: 'TAKEN!', small: why };
}

function Side({
  look,
  name,
  score,
  active,
  color,
  right
}: {
  look: EraserLook;
  name: string;
  score: number;
  active: boolean;
  color: string;
  right?: boolean;
}) {
  return (
    <div className={cx(sideCls, right && sideRightCls)}>
      <span
        className={miniCls}
        style={{
          background: look.examKey ? look.color : look.rubber,
          outlineColor: active ? color : 'transparent'
        }}
      >
        {look.examKey ? (
          <img src={bossCardURL(look.examKey)} alt="" draggable={false} />
        ) : (
          <i style={{ background: look.color }} />
        )}
      </span>
      <span className={sideTextCls}>
        <small>{name}</small>
        <b>{score}</b>
      </span>
    </div>
  );
}

const stampIn = keyframes`
  0% { opacity: 0; transform: scale(2.4) rotate(-4deg); }
  60% { opacity: 1; transform: scale(0.92) rotate(-11deg); }
  100% { opacity: 1; transform: scale(1) rotate(-9deg); }
`;

const lobbyCls = css`
  max-width: 760px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
  user-select: none;
  -webkit-user-select: none;
  touch-action: pan-x pan-y;
`;

const lobbyHeadCls = css`
  h1 {
    margin: 0;
    font-size: 2.8rem;
    font-weight: 900;
    small {
      font-size: 1.6rem;
      font-weight: 800;
      color: ${ARENA.inkSoft};
      margin-left: 0.6rem;
    }
  }
  p {
    margin: 0.4rem 0 0;
    font-size: 1.45rem;
    line-height: 1.45;
    color: ${ARENA.inkSoft};
  }
`;

const noteCls = css`
  margin: 0;
  font-size: 1.4rem;
  color: ${ARENA.inkSoft};
`;

const countRowCls = css`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  strong {
    font-size: 1.6rem;
    font-weight: 900;
  }
  span {
    font-size: 1.3rem;
    color: ${ARENA.inkSoft};
  }
`;

const cardGridCls = css`
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 1.2rem;
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
  }
`;

const cardCls = css`
  position: relative;
  aspect-ratio: 3 / 4;
  max-height: 19vh;
  justify-self: center;
  width: 100%;
  padding: 0;
  border: 3px solid ${ARENA.line};
  border-radius: 8px;
  box-shadow: 3px 4px 0 ${ARENA.line};
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.12s;
  &:disabled {
    cursor: default;
    box-shadow: none;
    border-style: dashed;
  }
  &:not(:disabled):hover {
    transform: translate(-1px, -2px) rotate(-1.5deg);
  }
`;

const cardOnCls = css`
  outline: 4px solid ${ARENA.train};
  outline-offset: 3px;
  transform: rotate(-3deg);
`;

const cardImgCls = css`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const lockedImgCls = css`
  filter: grayscale(1) brightness(0.35);
  opacity: 0.55;
`;

const lockCls = css`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  color: #fff;
  font-size: 2rem;
  small {
    font-size: 1.05rem;
    font-weight: 800;
    letter-spacing: 0.04em;
  }
`;

const emptyCls = css`
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  padding: 1.4rem;
  background: ${ARENA.paper};
  border: 3px solid ${ARENA.line};
  border-radius: 12px;
  box-shadow: 3px 3px 0 ${ARENA.line};
  p {
    margin: 0;
    font-size: 1.5rem;
    line-height: 1.5;
  }
`;

const actionsCls = css`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
`;

const opponentRowCls = css`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const chipCls = css`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.7rem 1.4rem;
  border: 2px solid ${ARENA.line};
  border-radius: 999px;
  background: ${ARENA.paper};
  font: inherit;
  font-size: 1.4rem;
  font-weight: 800;
  cursor: pointer;
  small {
    font-size: 1.1rem;
    padding: 0.1rem 0.6rem;
    border-radius: 999px;
    background: ${ARENA.ink};
    color: #fff;
  }
`;

const chipOnCls = css`
  background: ${ARENA.ink};
  color: #fff;
  small {
    background: #fff;
    color: ${ARENA.ink};
  }
`;

const p2RowCls = css`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
  font-size: 1.35rem;
  font-weight: 700;
`;

const p2ChoicesCls = css`
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
`;

const miniChoiceCls = css`
  width: 3.6rem;
  height: 4.8rem;
  padding: 0;
  border: 2px solid ${ARENA.line};
  border-radius: 6px;
  background: #f6f2ea;
  font: inherit;
  font-size: 1rem;
  font-weight: 800;
  overflow: hidden;
  cursor: pointer;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const footNoteCls = css`
  margin: 0;
  text-align: center;
  font-size: 1.25rem;
  color: ${ARENA.inkSoft};
`;

const gameCls = css`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  max-width: 1100px;
  margin: 0 auto;
  width: 100%;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  touch-action: pan-x pan-y;
`;

const hudCls = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
`;

const sideCls = css`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  min-width: 0;
  flex: 1;
`;

const sideRightCls = css`
  flex-direction: row-reverse;
  text-align: right;
`;

const miniCls = css`
  flex-shrink: 0;
  width: 3.4rem;
  height: 4.5rem;
  border: 2px solid ${ARENA.line};
  border-radius: 5px;
  box-shadow: 2px 2px 0 ${ARENA.line};
  overflow: hidden;
  outline: 3px solid transparent;
  outline-offset: 2px;
  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  i {
    display: block;
    margin-top: 40%;
    height: 45%;
  }
`;

const sideTextCls = css`
  display: flex;
  flex-direction: column;
  min-width: 0;
  small {
    font-size: 1.2rem;
    font-weight: 700;
    color: ${ARENA.inkSoft};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  b {
    font-size: 2.4rem;
    font-weight: 900;
    line-height: 1;
  }
`;

const turnCls = css`
  flex-shrink: 0;
  padding: 0.5rem 1.2rem;
  border: 2px solid ${ARENA.line};
  border-radius: 999px;
  background: ${ARENA.paper};
  font-size: 1.3rem;
  font-weight: 800;
  white-space: nowrap;
`;

const deskWrapCls = css`
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
`;

const shakeCls = css`
  position: absolute;
  inset: 0;
`;

const canvasCls = css`
  display: block;
  touch-action: none;
  cursor: crosshair;
`;

const resultCls = css`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  background: rgba(244, 239, 228, 0.35);
`;

const stampCls = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 1.4rem 2.6rem;
  border: 6px double currentColor;
  border-radius: 14px;
  background: rgba(255, 253, 248, 0.92);
  transform: rotate(-9deg);
  animation: ${stampIn} 0.45s cubic-bezier(0.2, 1.4, 0.4, 1) both;
  b {
    font-size: 4.4rem;
    font-weight: 900;
    letter-spacing: 0.04em;
    line-height: 1.05;
  }
  span {
    font-size: 1.4rem;
    font-weight: 800;
    color: ${ARENA.ink};
  }
  @media (max-width: ${mobileMaxWidth}) {
    b {
      font-size: 3.6rem;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const stampWinCls = css`
  color: ${ARENA.accent};
`;

const stampLoseCls = css`
  color: ${ARENA.ink};
`;

const helpBackCls = css`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(29, 27, 24, 0.35);
`;

const helpCls = css`
  max-width: 44rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.6rem 1.8rem;
  background: ${ARENA.paper};
  border: 3px solid ${ARENA.line};
  border-radius: 12px;
  box-shadow: 5px 5px 0 ${ARENA.line};
  h2 {
    margin: 0;
    font-size: 2rem;
    font-weight: 900;
  }
  ol {
    margin: 0;
    padding-left: 2rem;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    font-size: 1.45rem;
    line-height: 1.45;
  }
  > button {
    align-self: flex-end;
  }
`;

const footCls = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
`;

const linkCls = css`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border: none;
  background: none;
  padding: 0.4rem 0;
  font: inherit;
  font-size: 1.35rem;
  font-weight: 700;
  color: ${ARENA.inkSoft};
  cursor: pointer;
  &:hover {
    color: ${ARENA.ink};
  }
`;

const hintCls = css`
  font-size: 1.3rem;
  font-weight: 700;
  color: ${ARENA.inkSoft};
`;
