import React, { useEffect, useMemo, useRef, useState } from 'react';
import { css, cx } from '@emotion/css';
import { drawToCanvas, generateMonster } from './generator';

export type MonsterPose =
  | 'idle'
  | 'hit'
  | 'attack'
  | 'defeat'
  | 'gone'
  // Waking up (11-22): deep sleep, a stir, one eye cracked open, a yawn, then
  // eyes open with a jolt.
  | 'sleep'
  | 'stir'
  | 'peek'
  | 'yawn'
  | 'wake';

const SLEEPY_POSES: MonsterPose[] = ['sleep', 'stir', 'peek', 'yawn'];

// A word's monster (approved generator, 11-22), drawn crisp at a whole-number
// scale. Idle: a two-frame bob with a blink now and then. Hit: a white flash
// and a shake. Attack: a lunge toward the player. Defeat: the generator's
// flash-dissolve-sink frames, once. Bosses (level 5) are drawn bigger.
// Waking up: slow breathing with the eyes shut, a twitch, one eye half open,
// a stretching yawn, and a jolt as the eyes open. Reduced motion keeps the
// frames and drops the movement.
export default function MonsterSprite({
  word,
  level,
  pose = 'idle',
  scale,
  className,
  label,
  onDefeatEnd
}: {
  word: string;
  level: number;
  pose?: MonsterPose;
  scale?: number;
  className?: string;
  // Spoken name; a sleeping monster's word is not announced yet.
  label?: string;
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
    // Sleep breathes slower than the idle bob.
    const id = window.setInterval(
      () => setTick((t) => t + 1),
      SLEEPY_POSES.includes(pose) ? 900 : 420
    );
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
    } else if (pose === 'sleep' || pose === 'stir') {
      frame = monster.frames.sleep[tick % 2];
    } else if (pose === 'peek') {
      frame = monster.frames.peek;
    } else if (pose === 'yawn') {
      frame = monster.frames.yawn;
    } else if (pose === 'wake') {
      frame = monster.frames.idle[0];
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
      aria-label={label || `${word} monster`}
      className={cx(
        canvasCls,
        pose === 'hit' && hitCls,
        pose === 'attack' && attackCls,
        pose === 'stir' && stirCls,
        pose === 'yawn' && yawnCls,
        pose === 'wake' && wakeCls,
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

const stirCls = css`
  animation: monster-stir 1.1s steps(2) infinite;
  @keyframes monster-stir {
    0%,
    60%,
    100% {
      transform: translateX(0) rotate(0);
    }
    70% {
      transform: translateX(-2px) rotate(-2deg);
    }
    85% {
      transform: translateX(2px) rotate(2deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const yawnCls = css`
  transform-origin: 50% 90%;
  animation: monster-yawn 0.9s ease-in-out 1 both;
  @keyframes monster-yawn {
    0% {
      transform: scale(1, 1);
    }
    50% {
      transform: scale(0.96, 1.08);
    }
    100% {
      transform: scale(1, 1.02);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const wakeCls = css`
  transform-origin: 50% 100%;
  animation: monster-wake 0.5s cubic-bezier(0.3, 1.6, 0.5, 1) 1;
  @keyframes monster-wake {
    0% {
      transform: translateY(0) scale(1, 1);
    }
    25% {
      transform: translateY(2px) scale(1.06, 0.92);
    }
    55% {
      transform: translateY(-12px) scale(0.96, 1.06);
    }
    100% {
      transform: translateY(0) scale(1, 1);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;
