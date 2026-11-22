import React, { useEffect, useMemo, useRef, useState } from 'react';
import { css, cx } from '@emotion/css';
import { drawToCanvas, generateMonster } from './generator';

export type MonsterPose = 'idle' | 'hit' | 'attack' | 'defeat' | 'gone';

// A word's monster (approved generator, 11-22), drawn crisp at a whole-number
// scale. Idle: a two-frame bob with a blink now and then. Hit: a white flash
// and a shake. Attack: a lunge toward the player. Defeat: the generator's
// flash-dissolve-sink frames, once. Bosses (level 5) are drawn bigger.
export default function MonsterSprite({
  word,
  level,
  pose = 'idle',
  scale,
  className,
  onDefeatEnd
}: {
  word: string;
  level: number;
  pose?: MonsterPose;
  scale?: number;
  className?: string;
  onDefeatEnd?: () => void;
}) {
  const monster = useMemo(() => generateMonster(word, level), [word, level]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tick, setTick] = useState(0);
  const [defeatFrame, setDefeatFrame] = useState(0);
  const onDefeatEndRef = useRef(onDefeatEnd);
  onDefeatEndRef.current = onDefeatEnd;
  const px = scale || monster.suggestedScale;

  useEffect(() => {
    if (pose === 'defeat' || pose === 'gone') return;
    const id = window.setInterval(() => setTick((t) => t + 1), 420);
    return () => window.clearInterval(id);
  }, [pose]);

  useEffect(() => {
    if (pose !== 'defeat') {
      setDefeatFrame(0);
      return;
    }
    let frame = 0;
    const id = window.setInterval(() => {
      frame += 1;
      if (frame >= monster.frames.defeat.length) {
        window.clearInterval(id);
        onDefeatEndRef.current?.();
        return;
      }
      setDefeatFrame(frame);
    }, 95);
    return () => window.clearInterval(id);
  }, [pose, monster]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, monster.width, monster.height);
    if (pose === 'gone') return;
    let frame: Uint8Array;
    if (pose === 'defeat') {
      frame = monster.frames.defeat[Math.min(defeatFrame, monster.frames.defeat.length - 1)];
    } else if (pose === 'idle' && tick % 9 === 8) {
      frame = monster.frames.blink;
    } else {
      frame = monster.frames.idle[tick % 2];
    }
    drawToCanvas(ctx, frame, monster.palette);
  }, [monster, pose, tick, defeatFrame]);

  return (
    <canvas
      ref={canvasRef}
      width={monster.width}
      height={monster.height}
      role="img"
      aria-label={`${word} monster`}
      className={cx(
        canvasCls,
        pose === 'hit' && hitCls,
        pose === 'attack' && attackCls,
        className
      )}
      style={{ width: monster.width * px, height: monster.height * px }}
    />
  );
}

const canvasCls = css`
  display: block;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
`;

const hitCls = css`
  animation: monster-hit 0.5s steps(2) 1;
  @keyframes monster-hit {
    0% {
      transform: translateX(0);
      filter: brightness(3);
    }
    20% {
      transform: translateX(-10px);
      filter: brightness(3);
    }
    40% {
      transform: translateX(9px);
      filter: none;
    }
    60% {
      transform: translateX(-6px);
      filter: brightness(2.5);
    }
    80% {
      transform: translateX(4px);
      filter: none;
    }
    100% {
      transform: translateX(0);
    }
  }
`;

const attackCls = css`
  animation: monster-attack 0.55s ease-in-out 1;
  @keyframes monster-attack {
    0% {
      transform: scale(1) translateY(0);
    }
    35% {
      transform: scale(1.18) translateY(14px);
    }
    55% {
      transform: scale(1.24) translateY(18px);
    }
    100% {
      transform: scale(1) translateY(0);
    }
  }
`;
