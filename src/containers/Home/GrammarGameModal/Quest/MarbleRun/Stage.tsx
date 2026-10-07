import React, { useEffect, useRef } from 'react';
import { css } from '@emotion/css';
import { W, H } from './pixel';

// The canvas a level or boss fight draws into, one frame per animation
// frame. The engine object owns all game state; this only drives it.
export default function Stage({
  engine
}: {
  engine: { frame(g: CanvasRenderingContext2D, t: number): void };
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const g = canvasRef.current?.getContext('2d');
    if (!g) return;
    let raf = 0;
    let reported = false;
    let last = -Infinity;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      // at most ~60 frames a second (120 Hz phones would draw twice as often)
      if (t - last < 1000 / 60 - 2) return;
      last = t;
      try {
        engine.frame(g, t);
      } catch (error) {
        // a drawing bug must never take the question card down with it
        if (!reported) console.error('Marble run frame failed', error);
        reported = true;
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [engine]);
  return <canvas ref={canvasRef} width={W} height={H} className={canvasCls} />;
}

const canvasCls = css`
  display: block;
  width: 100%;
  height: auto;
  border-radius: 14px 14px 0 0;
  background: #1a1426;
  image-rendering: pixelated;
`;
