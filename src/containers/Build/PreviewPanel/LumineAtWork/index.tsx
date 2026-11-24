import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import {
  renderScene,
  sceneWidthFor,
  SCENE_H,
  typingSpeed,
  type LuminePose,
  type LumineSceneState
} from './pixelScene';
import { nextLuminePose, type LumineWorkMode } from './activity';

// Lumine at work (Mikey 11-24): "pixelated version of lumine typing
// diligently ... different typing animation variation so keep users engaged".
// A 10 fps pixel scene drawn into one small canvas and scaled up by a whole
// number with smoothing off, like the word battle's waking monster. Poses
// rotate by what the run is doing (see activity.ts). The clock stops while
// the tab is hidden; reduced motion draws one still frame.

const PIXEL_FONT = "'Press Start 2P', monospace";
const TICK_MS = 100;
const CELEBRATE_TICKS = 26;
const CORNER_WIDTH = 112;

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
}

function usePageHidden() {
  const [hidden, setHidden] = useState(
    () =>
      typeof document !== 'undefined' && document.visibilityState === 'hidden'
  );
  useEffect(() => {
    const onChange = () => setHidden(document.visibilityState === 'hidden');
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);
  return hidden;
}

export default function LumineAtWork({
  variant = 'stage',
  mode,
  saveSignal = 0,
  title,
  subtitle
}: {
  // stage: fills the preview area. corner: a small badge over a live preview.
  variant?: 'stage' | 'corner';
  mode: LumineWorkMode;
  // Goes up by one whenever Lumine finishes a file or a run: a celebration.
  saveSignal?: number;
  title?: string;
  subtitle?: string | null;
}) {
  const hidden = usePageHidden();
  const [reduced] = useState(prefersReducedMotion);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [fit, setFit] = useState({ width: CORNER_WIDTH, scale: 1 });
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const sceneRef = useRef<{
    frame: number;
    poseStart: number;
    poseUntil: number;
    pose: LuminePose;
    typed: number;
  }>({
    frame: 0,
    poseStart: 0,
    poseUntil: 0,
    pose: mode === 'idle' ? 'wave' : 'type',
    typed: 140
  });
  const lastSaveSignalRef = useRef(saveSignal);

  // Whole-number scale that fits the space; the scene widens to fill it.
  useLayoutEffect(() => {
    if (variant === 'corner') {
      setFit({ width: CORNER_WIDTH, scale: 1 });
      return;
    }
    const el = frameRef.current;
    if (!el) return;
    const measure = () => {
      const width = el.clientWidth - 24;
      const height = el.clientHeight - 150;
      const scale = Math.max(
        1,
        Math.min(6, Math.floor(Math.min(width / 172, height / SCENE_H)))
      );
      const sceneWidth = sceneWidthFor(width, scale);
      setFit((prev) =>
        prev.width === sceneWidth && prev.scale === scale
          ? prev
          : { width: sceneWidth, scale }
      );
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [variant]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const width = fit.width;
    const image = ctx.createImageData(width, SCENE_H);

    function draw() {
      const s = sceneRef.current;
      const state: LumineSceneState = {
        pose: s.pose,
        frame: s.frame,
        poseFrame: s.frame - s.poseStart,
        typed: s.typed,
        savedLabel: s.pose === 'celebrate',
        idle: modeRef.current === 'idle' && s.pose !== 'celebrate',
        compact: variant === 'corner'
      };
      image.data.set(renderScene(width, state));
      ctx!.putImageData(image, 0, 0);
    }

    function advance() {
      const s = sceneRef.current;
      s.frame += 1;
      if (s.frame >= s.poseUntil) {
        const next = nextLuminePose({
          mode: modeRef.current,
          previous: s.pose,
          roll: Math.random(),
          lengthRoll: Math.random()
        });
        s.pose = next.pose;
        s.poseStart = s.frame;
        s.poseUntil = s.frame + next.ticks;
      }
      s.typed += typingSpeed(s.pose);
      draw();
    }

    draw();
    if (reduced || hidden) return;
    const id = window.setInterval(advance, TICK_MS);
    return () => window.clearInterval(id);
  }, [fit.width, hidden, reduced, variant]);

  // A finished file or run: celebrate right away.
  useEffect(() => {
    if (saveSignal === lastSaveSignalRef.current) return;
    lastSaveSignalRef.current = saveSignal;
    const s = sceneRef.current;
    s.pose = 'celebrate';
    s.poseStart = s.frame;
    s.poseUntil = s.frame + CELEBRATE_TICKS;
  }, [saveSignal]);

  // A change of mode (say thinking -> writing) switches pose soon, not after
  // a long typing stretch that no longer fits.
  useEffect(() => {
    const s = sceneRef.current;
    if (s.pose === 'celebrate') return;
    s.poseUntil = Math.min(s.poseUntil, s.frame + 8);
  }, [mode]);

  const canvas = (
    <canvas
      ref={canvasRef}
      width={fit.width}
      height={SCENE_H}
      className={canvasCls}
      style={{ width: fit.width * fit.scale, height: SCENE_H * fit.scale }}
      role="img"
      aria-label={
        mode === 'idle'
          ? 'Lumine waiting at the desk'
          : 'Lumine typing at the desk'
      }
    />
  );

  if (variant === 'corner') {
    return (
      <div className={cornerCls} data-testid="lumine-at-work-corner">
        {canvas}
        <span className={cornerLabelCls}>{title || 'Lumine is working'}</span>
      </div>
    );
  }

  return (
    <div
      ref={frameRef}
      className={stageCls}
      data-testid="lumine-at-work"
      data-lumine-mode={mode}
    >
      <div className={sceneBoxCls}>{canvas}</div>
      <div className={captionCls} aria-live="polite">
        <div className={titleCls}>
          {title}
          {mode !== 'idle' && (
            <span className={dotsCls} aria-hidden="true">
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </span>
          )}
        </div>
        {subtitle ? <div className={subCls}>{subtitle}</div> : null}
      </div>
    </div>
  );
}

const canvasCls = css`
  display: block;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
`;

const stageCls = css`
  position: absolute;
  inset: 0;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.4rem;
  padding: 1.2rem;
  background: #110d22;
  color: #ffffff;
  overflow: hidden;
  text-align: center;
`;

const sceneBoxCls = css`
  border: 3px solid #2c2442;
  box-shadow:
    0 0 0 3px #0a0716,
    0 18px 40px rgba(0, 0, 0, 0.45);
  line-height: 0;
`;

const captionCls = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.7rem;
  max-width: 46rem;
  min-width: 0;
`;

const titleCls = css`
  font-family: ${PIXEL_FONT};
  font-size: 13px;
  line-height: 1.7;
  color: #fff3c4;
  text-shadow: 2px 2px 0 #1a1426;
  overflow-wrap: anywhere;
`;

const subCls = css`
  font-size: 1.3rem;
  line-height: 1.45;
  color: #c9c1e6;
  overflow-wrap: anywhere;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const dotsCls = css`
  span {
    animation: lumine-dot-1 1.6s steps(1) infinite;
  }
  span:nth-of-type(2) {
    animation-name: lumine-dot-2;
  }
  span:nth-of-type(3) {
    animation-name: lumine-dot-3;
  }
  @keyframes lumine-dot-1 {
    0% {
      opacity: 0;
    }
    25% {
      opacity: 1;
    }
  }
  @keyframes lumine-dot-2 {
    0% {
      opacity: 0;
    }
    50% {
      opacity: 1;
    }
  }
  @keyframes lumine-dot-3 {
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

const cornerCls = css`
  position: absolute;
  top: 0.8rem;
  right: 0.8rem;
  z-index: 4;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  padding: 0.4rem 0.4rem 0.45rem;
  border: 2px solid #2c2442;
  border-radius: 10px;
  background: #110d22;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.32);
  pointer-events: none;
  canvas {
    border-radius: 6px;
  }
`;

const cornerLabelCls = css`
  font-family: ${PIXEL_FONT};
  font-size: 10px;
  line-height: 1.4;
  color: #fff3c4;
  white-space: nowrap;
`;

