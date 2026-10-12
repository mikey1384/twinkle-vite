import React, { useEffect, useMemo, useRef, useState } from 'react';
import { css, keyframes } from '@emotion/css';
import { PAPER } from '~/components/Modals/DailyQuestionModal/paperTheme';

// Reflection stats (Mikey 2026-10-12): five axes members level through Daily
// Reflection. Never shows numbers: only the shape. Each axis fills in its own
// colour layers; a full axis stays full and the next colour grows over it from
// the centre, so nothing ever shrinks.

export const REFLECTION_STAT_AXES = [
  'building',
  'adapting',
  'thinking',
  'connecting',
  'self_awareness'
] as const;
export type ReflectionStatAxis = (typeof REFLECTION_STAT_AXES)[number];

export const REFLECTION_STAT_LABELS: Record<ReflectionStatAxis, string> = {
  building: 'Building',
  adapting: 'Adapting',
  thinking: 'Thinking',
  connecting: 'Connecting',
  self_awareness: 'Self-awareness'
};

export interface ReflectionStatAxisShape {
  axis: ReflectionStatAxis;
  layer: number;
  fill: number;
}

// layer colours drawn from the painted Daily Reflection covers: soft blue,
// sage, amber, plum, terracotta (Mikey 10-12: one look on every surface)
function rgba(r: number, g: number, b: number) {
  return (opacity = 1) => `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
const LAYER_COLORS = [
  rgba(63, 111, 168),
  rgba(95, 143, 90),
  rgba(180, 118, 42),
  rgba(122, 90, 140),
  rgba(181, 82, 59)
];

const SIZE = 260;
const CENTER = SIZE / 2;
const RADIUS = 96;
// every axis shows a small starting shape, so a new member still sees one
const MIN_RADIUS_RATIO = 0.16;
const MORPH_MS = 1400;
const LABEL_ROOM = 64;

const glow = keyframes`
  0% { transform: scale(1); opacity: 0.9; }
  50% { transform: scale(2.4); opacity: 0; }
  100% { transform: scale(1); opacity: 0; }
`;

function layerColor(layer: number) {
  return LAYER_COLORS[layer % LAYER_COLORS.length];
}

function angleFor(index: number) {
  return -Math.PI / 2 + (index * 2 * Math.PI) / REFLECTION_STAT_AXES.length;
}

function point(index: number, ratio: number) {
  const angle = angleFor(index);
  return [
    CENTER + Math.cos(angle) * RADIUS * ratio,
    CENTER + Math.sin(angle) * RADIUS * ratio
  ];
}

function fillRatio(fill: number) {
  return (
    MIN_RADIUS_RATIO + (1 - MIN_RADIUS_RATIO) * Math.max(0, Math.min(1, fill))
  );
}

// a continuous "layer + fill" value per axis, so a morph can animate across a
// layer boundary
function progressOf(shape: ReflectionStatAxisShape[]) {
  return REFLECTION_STAT_AXES.map((axis) => {
    const item = shape.find((entry) => entry.axis === axis);
    return item ? item.layer + item.fill : 0;
  });
}

function polygonPoints(ratios: number[]) {
  return ratios
    .map((ratio, index) =>
      point(index, ratio)
        .map((v) => v.toFixed(1))
        .join(',')
    )
    .join(' ');
}

const PETAL_HALF_ANGLE = (30 * Math.PI) / 180;

function petalPoints(index: number, ratio: number) {
  const angle = angleFor(index);
  const at = (a: number, r: number) =>
    [CENTER + Math.cos(a) * RADIUS * r, CENTER + Math.sin(a) * RADIUS * r]
      .map((v) => v.toFixed(1))
      .join(',');
  return [
    `${CENTER},${CENTER}`,
    at(angle - PETAL_HALF_ANGLE, ratio * 0.6),
    at(angle, ratio),
    at(angle + PETAL_HALF_ANGLE, ratio * 0.6)
  ].join(' ');
}

export default function ReflectionStatShape({
  shape,
  previous,
  grownAxis,
  animate = false,
  onAnimationEnd,
  maxWidth = 340
}: {
  shape: ReflectionStatAxisShape[];
  previous?: ReflectionStatAxisShape[] | null;
  grownAxis?: ReflectionStatAxis | null;
  animate?: boolean;
  onAnimationEnd?: () => void;
  maxWidth?: number;
}) {
  const target = useMemo(() => progressOf(shape), [shape]);
  const start = useMemo(
    () => (previous ? progressOf(previous) : target),
    [previous, target]
  );
  const shouldAnimate = animate && !!previous;
  const [progress, setProgress] = useState<number[]>(
    shouldAnimate ? start : target
  );
  const [morphDone, setMorphDone] = useState(!shouldAnimate);
  const onAnimationEndRef = useRef(onAnimationEnd);
  onAnimationEndRef.current = onAnimationEnd;

  useEffect(() => {
    if (!shouldAnimate) {
      setProgress(target);
      setMorphDone(true);
      return;
    }
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setProgress(target);
      setMorphDone(true);
      onAnimationEndRef.current?.();
      return;
    }
    let frame = 0;
    const startedAt = performance.now();
    // a short pause first, so the old shape is seen before it grows
    const delay = 500;
    function tick(now: number) {
      const elapsed = now - startedAt - delay;
      const t = Math.max(0, Math.min(1, elapsed / MORPH_MS));
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(start.map((from, i) => from + (target[i] - from) * eased));
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setMorphDone(true);
        onAnimationEndRef.current?.();
      }
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [shouldAnimate, start, target]);

  // base shape: every axis's first layer (a finished first layer sits at the
  // edge)
  const baseRatios = progress.map((value) =>
    value >= 1 ? 1 : fillRatio(value)
  );
  const layers: React.ReactNode[] = [
    <polygon
      key="base"
      points={polygonPoints(baseRatios)}
      fill={layerColor(0)(0.26)}
      stroke={layerColor(0)(0.95)}
      strokeWidth={2.2}
      strokeLinejoin="round"
    />
  ];
  // past the first layer, an axis gets a petal along it: each finished layer
  // is a full petal in its colour, and the current layer's petal grows from
  // the centre on top, so the new colour visibly creeps outward
  progress.forEach((value, index) => {
    const top = Math.floor(value);
    if (top < 1) return;
    for (let layer = 1; layer <= top; layer++) {
      const ratio = layer < top ? 1 : value - top;
      if (ratio <= 0.001) continue;
      const color = layerColor(layer);
      layers.push(
        <polygon
          key={`${index}-${layer}`}
          points={petalPoints(index, ratio)}
          fill={color(0.55)}
          stroke={color(1)}
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
      );
    }
  });

  const previousRatios = previous
    ? progressOf(previous).map((value) => (value >= 1 ? 1 : fillRatio(value)))
    : null;
  const grownIndex = grownAxis ? REFLECTION_STAT_AXES.indexOf(grownAxis) : -1;
  // the tip of the grown axis: its newest layer, or the full edge of the layer
  // it just completed when the new one has barely started
  let grownTip: number[] | null = null;
  let grownColor = layerColor(0);
  if (grownIndex >= 0) {
    const value = progress[grownIndex];
    const top = Math.floor(value);
    const frac = value - top;
    const onNewLayer = top === 0 || frac > 0.15;
    grownTip = point(
      grownIndex,
      top === 0 ? fillRatio(frac) : onNewLayer ? frac : 1
    );
    grownColor = layerColor(onNewLayer ? top : top - 1);
  }

  return (
    <svg
      // side room for the axis labels
      viewBox={`${-LABEL_ROOM} 0 ${SIZE + LABEL_ROOM * 2} ${SIZE}`}
      role="img"
      aria-label={`Reflection stats shape: ${REFLECTION_STAT_AXES.map(
        (axis) => REFLECTION_STAT_LABELS[axis]
      ).join(', ')}`}
      className={css`
        width: 100%;
        max-width: ${maxWidth}px;
        height: auto;
        display: block;
        margin: 0 auto;
        overflow: visible;
      `}
    >
      {[1, 0.66, 0.33].map((ratio) => (
        <polygon
          key={ratio}
          points={polygonPoints(REFLECTION_STAT_AXES.map(() => ratio))}
          fill="none"
          stroke={ratio === 1 ? PAPER.lineStrong : PAPER.line}
          strokeWidth={1}
        />
      ))}
      {REFLECTION_STAT_AXES.map((axis, index) => {
        const [x, y] = point(index, 1);
        return (
          <line
            key={axis}
            x1={CENTER}
            y1={CENTER}
            x2={x}
            y2={y}
            stroke={PAPER.line}
            strokeWidth={1}
          />
        );
      })}
      {previousRatios && !morphDone && (
        <polygon
          points={polygonPoints(previousRatios)}
          fill="none"
          stroke={PAPER.inkFaint}
          strokeWidth={1.2}
          strokeDasharray="4 3"
        />
      )}
      {layers}
      {grownTip && (
        <g>
          <circle
            cx={grownTip[0]}
            cy={grownTip[1]}
            r={5}
            fill={grownColor(1)}
          />
          <circle
            cx={grownTip[0]}
            cy={grownTip[1]}
            r={7}
            fill="none"
            stroke={grownColor(1)}
            strokeWidth={2}
            className={css`
              transform-box: fill-box;
              transform-origin: center;
              animation: ${glow} 1.6s ease-out ${shouldAnimate ? '0.6s' : '0s'}
                3;
            `}
          />
        </g>
      )}
      {REFLECTION_STAT_AXES.map((axis, index) => {
        const [x, y] = point(index, 1.2);
        const isGrown = index === grownIndex;
        return (
          <text
            key={axis}
            x={x}
            y={y}
            textAnchor={
              Math.abs(x - CENTER) < 4 ? 'middle' : x > CENTER ? 'start' : 'end'
            }
            dominantBaseline="middle"
            fontSize={13.5}
            fontWeight={isGrown ? 800 : 600}
            fill={isGrown ? PAPER.ink : PAPER.inkSoft}
          >
            {REFLECTION_STAT_LABELS[axis]}
          </text>
        );
      })}
    </svg>
  );
}
