import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { css, cx } from '@emotion/css';
import { pixelSvg } from '~/containers/Home/GrammarGameModal/Quest/pixelUi';

// While a word battle loads (Mikey 11-24: "more like maybe you as a player
// exploring into the word kind of vibe until it loads"): a small explorer
// walks a dusk path while the word's letters drift past like fireflies. No
// monster and no meaning. Shown only when the wait is real: a battle that
// arrives within SCENE_DELAY_MS goes straight to the gate with no scene and no
// flash. All motion is CSS steps() on transforms (no rAF), paused while the
// tab is hidden, and a static scene with reduced motion.

const PIXEL_FONT = "'Press Start 2P', monospace";
const SCENE_DELAY_MS = 250;
const ENCOUNTER_MS = 450;
// Every scene pixel is 2 CSS px.
const PX = 2;

const C = {
  ink: '#1a1426',
  sky: '#3b2d63',
  far: '#4b3f7a',
  near: '#24493d',
  nearDark: '#1b3a31',
  ground: '#5d4a3f',
  groundLine: '#463529',
  grass: '#2f6b45',
  grassLight: '#4f9a5e',
  accent: '#ffe9a8'
};

export type ExplorePhase = 'wait' | 'explore' | 'failed' | 'encounter' | 'done';

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
}

// wait: loading, scene not shown yet (the first SCENE_DELAY_MS).
// explore / failed: the scene. encounter: the flash into the gate, only after
// a scene was shown (and never with reduced motion). done: the gate.
export function useExplorePhase({
  loading,
  failed
}: {
  loading: boolean;
  failed: boolean;
}): ExplorePhase {
  const [phase, setPhase] = useState<ExplorePhase>(
    failed ? 'failed' : loading ? 'wait' : 'done'
  );
  const shownRef = useRef(failed);

  // Layout effect: the encounter flash covers the gate before its first paint.
  useLayoutEffect(() => {
    if (failed) {
      shownRef.current = true;
      setPhase('failed');
      return;
    }
    if (loading) {
      // A retry from the error scene keeps the scene up, no blank gap.
      if (shownRef.current) {
        setPhase('explore');
        return;
      }
      setPhase('wait');
      const timer = window.setTimeout(() => {
        shownRef.current = true;
        setPhase('explore');
      }, SCENE_DELAY_MS);
      return () => window.clearTimeout(timer);
    }
    if (!shownRef.current || prefersReducedMotion()) {
      setPhase('done');
      return;
    }
    setPhase('encounter');
    const timer = window.setTimeout(() => setPhase('done'), ENCOUNTER_MS);
    return () => window.clearTimeout(timer);
  }, [loading, failed]);

  return phase;
}

function usePageHidden() {
  const [hidden, setHidden] = useState(
    () => typeof document !== 'undefined' && document.visibilityState === 'hidden'
  );
  useEffect(() => {
    const onChange = () => setHidden(document.visibilityState === 'hidden');
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);
  return hidden;
}

// ---- original pixel art, drawn once per page load ----

function tile(w: number, h: number, draw: (rect: (x: number, y: number, rw: number, rh: number, fill: string) => void) => void) {
  const rects: string[] = [];
  draw((x, y, rw, rh, fill) =>
    rects.push(`<rect x="${x}" y="${y}" width="${rw}" height="${rh}" fill="${fill}"/>`)
  );
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">${rects.join('')}</svg>`;
  return { uri: `data:image/svg+xml,${encodeURIComponent(svg)}`, w, h };
}

let artCache: ReturnType<typeof drawArt> | null = null;
function art() {
  if (!artCache) artCache = drawArt();
  return artCache;
}

function drawArt() {
  // Far hills: a stepped silhouette, 48 wide so it repeats seamlessly.
  const far = tile(48, 24, (rect) => {
    [6, 4, 3, 4, 7, 9, 8, 5].forEach((top, i) => rect(i * 6, top, 6, 24 - top, C.far));
  });
  // A row of pines, two per 32-pixel tile.
  const near = tile(32, 30, (rect) => {
    const pine = (x: number, top: number, fill: string) => {
      for (let row = 0; row < 18; row += 3) {
        const half = 1 + Math.floor(row / 3);
        rect(x - half, top + row, half * 2 + 1, 3, fill);
      }
      rect(x, top + 18, 1, 30 - top - 18, C.groundLine);
    };
    rect(0, 24, 32, 6, C.nearDark);
    pine(7, 4, C.near);
    pine(23, 8, C.nearDark);
    pine(16, 10, C.near);
  });
  // The path: a top edge, pebbles and ruts.
  const ground = tile(16, 18, (rect) => {
    rect(0, 0, 16, 18, C.ground);
    rect(0, 0, 16, 1, C.groundLine);
    rect(2, 5, 4, 1, C.groundLine);
    rect(11, 9, 3, 1, C.groundLine);
    rect(6, 13, 5, 1, C.groundLine);
    rect(13, 3, 1, 1, '#7a6352');
    rect(4, 10, 1, 1, '#7a6352');
  });
  // Tall grass along the front edge.
  const grass = tile(16, 10, (rect) => {
    rect(0, 7, 16, 3, C.grass);
    [[1, 2], [3, 0], [5, 3], [8, 1], [10, 4], [12, 0], [14, 2]].forEach(([x, top]) => {
      rect(x, top, 1, 10 - top, C.grass);
      rect(x, top, 1, 1, C.grassLight);
    });
  });
  // The explorer, facing right with a backpack and a walking stick: two
  // frames (stride, passing) side by side in one sheet.
  const body = [
    '....kkkkk......',
    '...kcccccck....',
    '...kccccccckk..',
    '...khsssssk....',
    '...khsssksk....',
    '....kssssk.....',
    '..bbkkkkkk..t..',
    '.kbbkjjjjjk.t..',
    '.kbbkjjjjjsst..',
    '.kbbkjjjjjk.t..',
    '..kkkjjjjk..t..'
  ];
  const stride = [
    '....kppppk..t..',
    '....kpkkpk..t..',
    '...kpk..kpk.t..',
    '...kwk...kwkt..',
    '..kwwk...kwwk..'
  ];
  const passing = [
    '....kppppk..t..',
    '....kppppk..t..',
    '.....kppk...t..',
    '.....kwwk...t..',
    '.....kwwwk.....'
  ];
  const sheet = [...body, ...stride].map((row, i) => row + [...body, ...passing][i]);
  const explorer = {
    uri: pixelSvg(sheet, {
      k: C.ink,
      c: '#2fb8a8',
      h: '#5a3a2a',
      s: '#f2c38f',
      j: '#e8743b',
      b: '#8a5a2b',
      p: '#3a3157',
      w: '#5d3a24',
      t: '#c9a46a'
    }),
    w: 15,
    h: 16
  };
  return { far, near, ground, grass, explorer };
}

// ---- the scene ----

export default function ExploringScene({
  word,
  failed,
  onRetry,
  compact
}: {
  // Leave out where the word must stay hidden (a Wordle answer the member may
  // not see yet): fireflies drift by instead of letters.
  word?: string;
  failed?: boolean;
  onRetry?: () => void;
  compact?: boolean;
}) {
  const hidden = usePageHidden();
  const { far, near, ground, grass, explorer } = art();
  const name = (word || '').toUpperCase();
  const letters = name ? name.split('') : ['', '', '', ''];
  // One pass of the word (or fireflies) across the sky, ~45 px a second.
  const driftS = Math.round((5 + letters.length * 0.4) * 10) / 10;
  // Both drift animations share one clock; it starts with the word already
  // coming into view.
  const drift = {
    animationDuration: `${driftS}s`,
    animationTimingFunction: `steps(${Math.round(driftS * 12)})`,
    animationDelay: `${-Math.round(driftS * 3.5) / 10}s`
  };
  const layer = (t: { uri: string; w: number; h: number }) => ({
    backgroundImage: `url("${t.uri}")`,
    backgroundSize: `${t.w * PX}px ${t.h * PX}px`,
    width: `calc(100% + ${t.w * PX}px)`,
    height: t.h * PX
  });
  const still = failed || hidden;

  return (
    <div
      className={cx(frameCls, still && pausedCls)}
      style={compact ? { padding: '1rem' } : undefined}
      data-testid="word-battle-exploring"
    >
      <div className={viewCls} aria-hidden="true">
        <span className={moonCls} />
        <span className={starsCls} />
        <div className={cx(layerCls, farCls)} style={layer(far)} />
        <div className={cx(layerCls, nearCls)} style={layer(near)} />
        <div className={driftCls} style={drift}>
          <div className={driftStripCls} style={drift}>
            {letters.map((letter, i) =>
              letter ? (
                <span key={i} className={letterCls} style={{ top: i % 2 ? 6 : 0, animationDelay: `${-i * 0.3}s` }}>
                  {letter}
                </span>
              ) : (
                <span key={i} className={fireflyCls} style={{ top: (i % 3) * 8, animationDelay: `${-i * 0.3}s` }} />
              )
            )}
          </div>
        </div>
        <div className={cx(layerCls, groundCls)} style={layer(ground)} />
        <span
          className={explorerCls}
          style={{
            backgroundImage: `url("${explorer.uri}")`,
            width: explorer.w * PX,
            height: explorer.h * PX,
            backgroundSize: `${explorer.w * 2 * PX}px ${explorer.h * PX}px`
          }}
        />
        <div className={cx(layerCls, grassCls)} style={layer(grass)} />
      </div>
      <div className={textCls} aria-live="polite">
        <div className={titleCls}>
          {failed ? (
            'The trail went cold.'
          ) : (
            <>
              {name ? `Exploring ${name}` : 'Exploring'}
              <span className={dotsCls}>
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </span>
            </>
          )}
        </div>
        <div className={subCls}>
          {failed
            ? "We couldn't reach this word just now."
            : 'Something rustles in the grass...'}
        </div>
        {failed && onRetry && (
          <div>
            <button type="button" className={retryCls} onClick={onRetry}>
              Try again ▶
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// The classic encounter: two white flashes, then dark bars part to show the
// gate. Laid over the gate (which must be position: relative).
export function EncounterFlash() {
  return (
    <div className={flashCls} aria-hidden="true">
      <span />
      <span />
    </div>
  );
}

const frameCls = css`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.4rem;
  padding: 1.4rem;
  background: #0f0b1a;
  border: 3px solid #1a1426;
  box-shadow: inset 0 0 0 3px #2c2442;
  color: #ffffff;
  @media (max-width: 480px) {
    flex-direction: column;
    text-align: center;
    gap: 0.8rem;
  }
`;

const pausedCls = css`
  &,
  * {
    animation-play-state: paused !important;
  }
`;

const viewCls = css`
  position: relative;
  flex-shrink: 0;
  width: 192px;
  height: 128px;
  overflow: hidden;
  background: ${C.sky};
  border: 3px solid #2c2442;
  image-rendering: pixelated;
  @media (max-width: 480px) {
    width: 100%;
    max-width: 288px;
  }
`;

const moonCls = css`
  position: absolute;
  top: 10px;
  right: 22px;
  width: 12px;
  height: 12px;
  background: ${C.accent};
  clip-path: polygon(2px 0, 10px 0, 10px 2px, 12px 2px, 12px 10px, 10px 10px, 10px 12px, 2px 12px, 2px 10px, 0 10px, 0 2px, 2px 2px);
`;

const starsCls = css`
  position: absolute;
  top: 0;
  left: 0;
  width: 2px;
  height: 2px;
  background: ${C.accent};
  box-shadow:
    14px 8px ${C.accent}, 40px 20px ${C.accent}, 62px 6px ${C.accent},
    96px 16px ${C.accent}, 128px 4px ${C.accent}, 150px 26px ${C.accent},
    184px 10px ${C.accent}, 220px 18px ${C.accent}, 250px 6px ${C.accent},
    276px 22px ${C.accent};
  opacity: 0.8;
`;

const layerCls = css`
  position: absolute;
  left: 0;
  background-repeat: repeat-x;
  will-change: transform;
  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
  }
`;

const farCls = css`
  top: 44px;
  animation: explore-far 12s steps(48) infinite;
  @keyframes explore-far {
    to {
      transform: translateX(-96px);
    }
  }
`;

const nearCls = css`
  top: 36px;
  animation: explore-near 3.2s steps(32) infinite;
  @keyframes explore-near {
    to {
      transform: translateX(-64px);
    }
  }
`;

const groundCls = css`
  top: 92px;
  animation: explore-ground 0.8s steps(16) infinite;
  @keyframes explore-ground {
    to {
      transform: translateX(-32px);
    }
  }
`;

const grassCls = css`
  top: 108px;
  animation: explore-ground-grass 0.8s steps(16) infinite;
  @keyframes explore-ground-grass {
    to {
      transform: translateX(-32px);
    }
  }
`;

const explorerCls = css`
  position: absolute;
  left: 56px;
  top: 62px;
  background-repeat: no-repeat;
  background-position: 0 0;
  animation: explore-walk 0.5s steps(2) infinite;
  @keyframes explore-walk {
    to {
      background-position: -60px 0;
    }
  }
  @media (max-width: 480px) {
    left: 30%;
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

// The word drifts by right to left: the wrapper crosses the view while the
// strip slides back by its own width, so the whole word enters and leaves.
const driftCls = css`
  position: absolute;
  top: 26px;
  left: 0;
  width: 100%;
  animation-name: explore-drift;
  animation-iteration-count: infinite;
  @keyframes explore-drift {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
    transform: translateX(12%);
  }
`;

const driftStripCls = css`
  position: relative;
  display: inline-flex;
  gap: 10px;
  white-space: nowrap;
  animation-name: explore-drift-strip;
  animation-iteration-count: infinite;
  @keyframes explore-drift-strip {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(-100%);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const letterCls = css`
  position: relative;
  font-family: ${PIXEL_FONT};
  font-size: 14px;
  line-height: 1;
  color: ${C.accent};
  text-shadow: 2px 2px 0 ${C.ink};
  animation: explore-twinkle 1.2s steps(2) infinite;
  @keyframes explore-twinkle {
    50% {
      opacity: 0.55;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const fireflyCls = css`
  position: relative;
  width: 4px;
  height: 4px;
  margin-right: 14px;
  background: ${C.accent};
  animation: explore-twinkle 1.2s steps(2) infinite;
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const textCls = css`
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  min-width: 0;
  @media (max-width: 480px) {
    align-items: center;
  }
`;

const titleCls = css`
  font-family: ${PIXEL_FONT};
  font-size: 13px;
  line-height: 1.6;
  overflow-wrap: anywhere;
`;

// The dots fill in one by one, then start over.
const dotsCls = css`
  span {
    animation: explore-dot-1 1.6s steps(1) infinite;
  }
  span:nth-of-type(2) {
    animation-name: explore-dot-2;
  }
  span:nth-of-type(3) {
    animation-name: explore-dot-3;
  }
  @keyframes explore-dot-1 {
    0% {
      opacity: 0;
    }
    25% {
      opacity: 1;
    }
  }
  @keyframes explore-dot-2 {
    0% {
      opacity: 0;
    }
    50% {
      opacity: 1;
    }
  }
  @keyframes explore-dot-3 {
    0% {
      opacity: 0;
    }
    75% {
      opacity: 1;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    span {
      animation: none;
    }
  }
`;

const subCls = css`
  font-size: 1.4rem;
  color: #d8d0ea;
`;

const retryCls = css`
  font-family: ${PIXEL_FONT};
  font-size: 12px;
  padding: 12px 16px;
  color: #3b2200;
  background: #ffd34d;
  border: 3px solid #ffffff;
  box-shadow: 0 4px 0 #b88a00;
  cursor: pointer;
  &:active {
    transform: translateY(3px);
    box-shadow: 0 1px 0 #b88a00;
  }
`;

const flashCls = css`
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  span {
    position: absolute;
    left: 0;
    width: 100%;
    height: 50%;
    background: #0f0b1a;
    animation: encounter-flash ${ENCOUNTER_MS}ms steps(1) 1 forwards,
      encounter-part ${ENCOUNTER_MS}ms steps(6) 1 forwards;
  }
  span:nth-of-type(1) {
    top: 0;
    --encounter-out: -100%;
  }
  span:nth-of-type(2) {
    bottom: 0;
    --encounter-out: 100%;
  }
  @keyframes encounter-flash {
    0% {
      background: #ffffff;
    }
    18% {
      background: #0f0b1a;
    }
    34% {
      background: #ffffff;
    }
    50% {
      background: #0f0b1a;
    }
  }
  @keyframes encounter-part {
    0%,
    50% {
      transform: translateY(0);
    }
    100% {
      transform: translateY(var(--encounter-out));
    }
  }
`;
