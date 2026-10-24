import React, { useId, useMemo } from 'react';
import { css } from '@emotion/css';
import MathText, { hasMath } from './MathText';
import { compileDiagramExpr } from './diagramExpr';

// A figure drawn by our own code (Arena 10-25), the way KICE and KMC
// booklets print them: thin black lines, solid or hollow points, upright
// point names and italic variables in the paper's serif. The item carries
// the figure as data (twinkle-api helpers/arena/diagram.ts checks it on
// import), so lengths and angles the problem states are drawn exactly.
// Coordinates are in `view` (math units, y up); without a view they are
// viewBox units with (0, 0) at the bottom left.

export interface DiagramVisual {
  kind: 'diagram';
  width: number;
  height: number;
  view?: { xMin: number; xMax: number; yMin: number; yMax: number };
  elements: DiagramElement[];
  title?: string;
  note?: string;
  alt?: string;
}

// white hides what lies behind it (a solid's faces, drawn back to front)
type Fill = 'none' | 'hatch' | 'light' | 'white';
type Compass = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw' | 'c';

export type DiagramElement =
  | {
      type: 'point';
      id: string;
      x: number;
      y: number;
      label?: string;
      labelPos?: Compass;
      hollow?: boolean;
      dot?: boolean;
    }
  | {
      type: 'segment';
      from: string;
      to: string;
      dashed?: boolean;
      thick?: boolean;
      arrow?: 'start' | 'end' | 'both';
      label?: string;
      labelSide?: 'left' | 'right';
    }
  | {
      type: 'polygon';
      points: string[];
      fill?: Fill;
      dashed?: boolean;
      stroke?: boolean;
    }
  | { type: 'circle'; center: string; r: number; dashed?: boolean; fill?: Fill }
  | {
      type: 'arc';
      center: string;
      r: number;
      start: number;
      end: number;
      dashed?: boolean;
      arrow?: 'start' | 'end' | 'both';
      label?: string;
    }
  | {
      type: 'angle';
      at: string;
      from: string;
      to: string;
      label?: string;
      // how far from the vertex the label sits (viewBox units); by default
      // just outside the arc
      labelR?: number;
      right?: boolean;
      r?: number;
      count?: number;
    }
  | { type: 'ticks'; segment: [string, string]; count?: number }
  | {
      type: 'text';
      x: number;
      y: number;
      text: string;
      anchor?: 'start' | 'middle' | 'end';
      size?: number;
    }
  | {
      type: 'axes';
      xMin?: number;
      xMax?: number;
      yMin?: number;
      yMax?: number;
      xLabel?: string;
      yLabel?: string;
      origin?: string | false;
      ticks?: { axis: 'x' | 'y'; at: number; label?: string }[];
    }
  | {
      type: 'plot';
      expr: string;
      domain: [number, number];
      endpoints?: {
        start?: 'open' | 'closed' | 'none';
        end?: 'open' | 'closed' | 'none';
      };
      dashed?: boolean;
      label?: string;
      labelAt?: number;
      labelPos?: Compass;
    }
  | {
      type: 'region';
      upper: string;
      lower?: string;
      domain: [number, number];
      fill?: Fill;
    }
  | {
      // a free polyline or polygon by coordinates (map coasts, borders,
      // rivers); clipped to the drawing's frame
      type: 'outline';
      coords: [number, number][];
      closed?: boolean;
      fill?: Fill;
      stroke?: boolean;
      dashed?: boolean;
      thin?: boolean;
    }
  | {
      type: 'shape';
      from: string;
      path: { to: string; center?: string; clockwise?: boolean }[];
      fill?: Fill;
      stroke?: boolean;
      dashed?: boolean;
    };

// margin around the drawing for labels, in viewBox units
const PAD = 18;
const FONT = 15;
const LINE = 1.2;
const DASH = '5 4';
const COMPASS: Record<Compass, number | null> = {
  e: 0,
  ne: 45,
  n: 90,
  nw: 135,
  w: 180,
  sw: 225,
  s: 270,
  se: 315,
  c: null
};

interface Pt {
  x: number;
  y: number;
}

export default function PaperDiagram({ visual }: { visual: DiagramVisual }) {
  const uid = useId().replace(/[^A-Za-z0-9_-]/g, '');
  const drawing = useMemo(() => buildDiagram(visual, uid), [visual, uid]);
  if (!drawing) return null;
  const { width, height } = visual;
  return (
    <figure className={figureCls}>
      {visual.title && <figcaption>{visual.title}</figcaption>}
      <svg
        viewBox={`${-PAD} ${-PAD} ${width + PAD * 2} ${height + PAD * 2}`}
        className={svgCls}
        style={{ maxWidth: `${(width + PAD * 2) / 10}rem` }}
        role="img"
        aria-label={visual.alt || visual.title || '그림'}
      >
        {drawing}
      </svg>
      {visual.note && <p className={noteCls}>{visual.note}</p>}
    </figure>
  );
}

export function buildDiagram(visual: DiagramVisual, uid: string) {
  const { width, height } = visual;
  const elements = Array.isArray(visual.elements) ? visual.elements : [];
  if (!(width > 0) || !(height > 0)) return null;
  const view = visual.view || { xMin: 0, xMax: width, yMin: 0, yMax: height };
  const sx = width / (view.xMax - view.xMin);
  const sy = height / (view.yMax - view.yMin);
  // math → screen (y down)
  const X = (x: number) => (x - view.xMin) * sx;
  const Y = (y: number) => height - (y - view.yMin) * sy;
  const S = (p: Pt) => ({ x: X(p.x), y: Y(p.y) });
  const points = new Map<string, Pt>();
  for (const el of elements) {
    if (el.type === 'point') points.set(el.id, { x: el.x, y: el.y });
  }
  const P = (id: string) => points.get(id);
  const hatch = `dg-hatch-${uid}`;
  const arrow = `dg-arrow-${uid}`;
  const clip = `dg-clip-${uid}`;
  const frame = `dg-frame-${uid}`;
  const fillOf = (fill?: Fill) =>
    fill === 'hatch'
      ? `url(#${hatch})`
      : fill === 'light'
        ? '#d4d4d4'
        : fill === 'white'
          ? '#fff'
          : 'none';
  const markers = (end?: 'start' | 'end' | 'both') => ({
    markerStart:
      end === 'start' || end === 'both' ? `url(#${arrow})` : undefined,
    markerEnd: end === 'end' || end === 'both' ? `url(#${arrow})` : undefined
  });

  // directions (screen degrees, y up) from each point to its neighbours, so
  // a point's name sits in the widest free gap
  const neighbours = new Map<string, number[]>();
  const link = (a: string, b: string) => {
    const pa = P(a);
    const pb = P(b);
    if (!pa || !pb) return;
    const add = (id: string, from: Pt, to: Pt) => {
      const sa = S(from);
      const sb = S(to);
      const deg = (Math.atan2(sa.y - sb.y, sb.x - sa.x) * 180) / Math.PI;
      neighbours.set(id, [...(neighbours.get(id) || []), deg]);
    };
    add(a, pa, pb);
    add(b, pb, pa);
  };
  for (const el of elements) {
    if (el.type === 'segment') link(el.from, el.to);
    if (el.type === 'polygon' && el.stroke !== false)
      el.points.forEach((id, i) =>
        link(id, el.points[(i + 1) % el.points.length])
      );
    if (el.type === 'shape') {
      let at = el.from;
      for (const step of el.path) {
        if (!step.center) link(at, step.to);
        at = step.to;
      }
    }
  }
  const autoDirection = (id: string) => {
    const dirs = (neighbours.get(id) || [])
      .map((d) => (d + 360) % 360)
      .sort((a, b) => a - b);
    if (!dirs.length) return 45;
    if (dirs.length === 1) return dirs[0] + 180;
    let best = 0;
    let bestGap = -1;
    dirs.forEach((d, i) => {
      const next = i + 1 < dirs.length ? dirs[i + 1] : dirs[0] + 360;
      if (next - d > bestGap) {
        bestGap = next - d;
        best = d + (next - d) / 2;
      }
    });
    return best;
  };

  const background: React.ReactNode[] = [];
  const lines: React.ReactNode[] = [];
  const dots: React.ReactNode[] = [];
  const labels: React.ReactNode[] = [];

  // a label set around (sx0, sy0) toward screen angle deg (y up), at distance d
  const placeLabel = (
    key: string,
    at: Pt,
    deg: number | null,
    text: string,
    d = FONT * 0.8,
    size = FONT
  ) => {
    let x = at.x;
    let y = at.y + size * 0.35;
    let anchor: 'start' | 'middle' | 'end' = 'middle';
    if (deg != null) {
      const rad = (deg * Math.PI) / 180;
      const c = Math.cos(rad);
      const s = Math.sin(rad);
      x = at.x + c * d;
      y = at.y - s * d + size * 0.35;
      anchor = c > 0.35 ? 'start' : c < -0.35 ? 'end' : 'middle';
      // a name straight above or below sits a little further off the point
      if (anchor === 'middle') y += -s * size * 0.15;
    }
    labels.push(
      <PaperLabel
        key={key}
        x={x}
        y={y}
        text={text}
        anchor={anchor}
        size={size}
      />
    );
  };

  elements.forEach((el, i) => {
    const key = `${el.type}-${i}`;
    switch (el.type) {
      case 'point': {
        const at = S(el);
        if (el.dot !== false) {
          dots.push(
            <circle
              key={key}
              cx={at.x}
              cy={at.y}
              r={el.hollow ? 3 : 2.6}
              fill={el.hollow ? '#fff' : '#111'}
              stroke="#111"
              strokeWidth={el.hollow ? LINE : 0}
            />
          );
        }
        if (el.label) {
          const deg = el.labelPos ? COMPASS[el.labelPos] : autoDirection(el.id);
          placeLabel(key, at, deg, el.label);
        }
        break;
      }
      case 'segment': {
        const a = P(el.from);
        const b = P(el.to);
        if (!a || !b) break;
        const sa = S(a);
        const sb = S(b);
        lines.push(
          <line
            key={key}
            x1={sa.x}
            y1={sa.y}
            x2={sb.x}
            y2={sb.y}
            stroke="#111"
            strokeWidth={el.thick ? LINE * 1.8 : LINE}
            strokeDasharray={el.dashed ? DASH : undefined}
            {...markers(el.arrow)}
          />
        );
        if (el.label) {
          const mid = { x: (sa.x + sb.x) / 2, y: (sa.y + sb.y) / 2 };
          // left of the direction from → to, on screen with y up
          const dir = Math.atan2(sa.y - sb.y, sb.x - sa.x);
          let side = el.labelSide;
          if (!side) {
            // away from the figure's middle
            const c = centroid([...points.values()].map(S));
            const leftX = Math.cos(dir + Math.PI / 2);
            const leftY = -Math.sin(dir + Math.PI / 2);
            side =
              (mid.x - c.x) * leftX + (mid.y - c.y) * leftY >= 0
                ? 'left'
                : 'right';
          }
          const deg =
            ((dir + (side === 'left' ? Math.PI / 2 : -Math.PI / 2)) * 180) /
            Math.PI;
          placeLabel(key, mid, deg, el.label, FONT * 0.7);
        }
        break;
      }
      case 'polygon': {
        const pts = el.points.map(P).filter(Boolean) as Pt[];
        if (pts.length < 3) break;
        lines.push(
          <polygon
            key={key}
            points={pts.map((p) => `${X(p.x)},${Y(p.y)}`).join(' ')}
            fill={fillOf(el.fill)}
            stroke={el.stroke === false ? 'none' : '#111'}
            strokeWidth={LINE}
            strokeLinejoin="round"
            strokeDasharray={el.dashed ? DASH : undefined}
          />
        );
        break;
      }
      case 'circle': {
        const c = P(el.center);
        if (!c) break;
        lines.push(
          <ellipse
            key={key}
            cx={X(c.x)}
            cy={Y(c.y)}
            rx={el.r * sx}
            ry={el.r * sy}
            fill={fillOf(el.fill)}
            stroke="#111"
            strokeWidth={LINE}
            strokeDasharray={el.dashed ? DASH : undefined}
          />
        );
        break;
      }
      case 'arc': {
        const c = P(el.center);
        if (!c) break;
        const sc = S(c);
        lines.push(
          <path
            key={key}
            d={arcPath(sc, el.r * sx, el.start, el.end)}
            fill="none"
            stroke="#111"
            strokeWidth={LINE}
            strokeDasharray={el.dashed ? DASH : undefined}
            {...markers(el.arrow)}
          />
        );
        if (el.label) {
          const mid = ((el.start + el.end) / 2) * (Math.PI / 180);
          const at = {
            x: sc.x + Math.cos(mid) * el.r * sx,
            y: sc.y - Math.sin(mid) * el.r * sx
          };
          placeLabel(key, at, (mid * 180) / Math.PI, el.label);
        }
        break;
      }
      case 'angle': {
        const at = P(el.at);
        const a = P(el.from);
        const b = P(el.to);
        if (!at || !a || !b) break;
        const sc = S(at);
        const sa = S(a);
        const sb = S(b);
        let a1 = (Math.atan2(sc.y - sa.y, sa.x - sc.x) * 180) / Math.PI;
        let a2 = (Math.atan2(sc.y - sb.y, sb.x - sc.x) * 180) / Math.PI;
        // the inside angle (< 180), drawn counterclockwise from a1 to a2
        let sweep = (((a2 - a1) % 360) + 360) % 360;
        if (sweep > 180) {
          [a1, a2] = [a2, a1];
          sweep = 360 - sweep;
        }
        const r = el.r || (el.right ? 9 : 16);
        if (el.right) {
          const u = (a1 * Math.PI) / 180;
          const v = (a2 * Math.PI) / 180;
          const p1 = { x: sc.x + Math.cos(u) * r, y: sc.y - Math.sin(u) * r };
          const p2 = { x: sc.x + Math.cos(v) * r, y: sc.y - Math.sin(v) * r };
          const corner = { x: p1.x + p2.x - sc.x, y: p1.y + p2.y - sc.y };
          lines.push(
            <polyline
              key={key}
              points={`${p1.x},${p1.y} ${corner.x},${corner.y} ${p2.x},${p2.y}`}
              fill="none"
              stroke="#111"
              strokeWidth={LINE * 0.85}
            />
          );
        } else {
          for (let k = 0; k < (el.count || 1); k++) {
            lines.push(
              <path
                key={`${key}-${k}`}
                d={arcPath(sc, r + k * 3.5, a1, a1 + sweep)}
                fill="none"
                stroke="#111"
                strokeWidth={LINE * 0.85}
              />
            );
          }
        }
        if (el.label) {
          const bis = a1 + sweep / 2;
          const span = (el.count || 1) * 3.5;
          // a narrow angle pushes its label further out along the bisector
          const d = el.labelR || r + span + FONT * (sweep < 40 ? 0.95 : 0.55);
          const rad = (bis * Math.PI) / 180;
          labels.push(
            <PaperLabel
              key={`${key}-label`}
              x={sc.x + Math.cos(rad) * d}
              y={sc.y - Math.sin(rad) * d + FONT * 0.35}
              text={el.label}
              anchor="middle"
              size={FONT * 0.93}
            />
          );
        }
        break;
      }
      case 'ticks': {
        const a = P(el.segment[0]);
        const b = P(el.segment[1]);
        if (!a || !b) break;
        const sa = S(a);
        const sb = S(b);
        const len = Math.hypot(sb.x - sa.x, sb.y - sa.y) || 1;
        const ux = (sb.x - sa.x) / len;
        const uy = (sb.y - sa.y) / len;
        const n = el.count || 1;
        for (let k = 0; k < n; k++) {
          const off = (k - (n - 1) / 2) * 3.5;
          const cx = (sa.x + sb.x) / 2 + ux * off;
          const cy = (sa.y + sb.y) / 2 + uy * off;
          lines.push(
            <line
              key={`${key}-${k}`}
              x1={cx - uy * 5}
              y1={cy + ux * 5}
              x2={cx + uy * 5}
              y2={cy - ux * 5}
              stroke="#111"
              strokeWidth={LINE}
            />
          );
        }
        break;
      }
      case 'text': {
        const size = el.size || FONT;
        if (hasMath(el.text)) {
          const w = Math.max(40, el.text.length * size * 0.55);
          const left =
            el.anchor === 'start' ? 0 : el.anchor === 'end' ? -w : -w / 2;
          labels.push(
            <foreignObject
              key={key}
              x={X(el.x) + left}
              y={Y(el.y) - size * 0.9}
              width={w}
              height={size * 1.8}
            >
              <div
                className={foreignCls}
                style={{
                  fontSize: `${size}px`,
                  textAlign:
                    el.anchor === 'start'
                      ? 'left'
                      : el.anchor === 'end'
                        ? 'right'
                        : 'center'
                }}
              >
                <MathText text={el.text} />
              </div>
            </foreignObject>
          );
        } else {
          labels.push(
            <PaperLabel
              key={key}
              x={X(el.x)}
              y={Y(el.y) + size * 0.35}
              text={el.text}
              anchor={el.anchor || 'middle'}
              size={size}
            />
          );
        }
        break;
      }
      case 'axes': {
        const x0 = X(Math.max(view.xMin, Math.min(view.xMax, 0)));
        const y0 = Y(Math.max(view.yMin, Math.min(view.yMax, 0)));
        const xa = X(el.xMin ?? view.xMin);
        const xb = X(el.xMax ?? view.xMax);
        const ya = Y(el.yMin ?? view.yMin);
        const yb = Y(el.yMax ?? view.yMax);
        lines.push(
          <g key={key} stroke="#111" strokeWidth={LINE}>
            <line
              x1={xa}
              y1={y0}
              x2={xb}
              y2={y0}
              markerEnd={`url(#${arrow})`}
            />
            <line
              x1={x0}
              y1={ya}
              x2={x0}
              y2={yb}
              markerEnd={`url(#${arrow})`}
            />
          </g>
        );
        placeLabel(`${key}-x`, { x: xb, y: y0 }, -20, el.xLabel || 'x', 6);
        placeLabel(`${key}-y`, { x: x0, y: yb }, 160, el.yLabel || 'y', 7);
        if (el.origin !== false)
          placeLabel(`${key}-o`, { x: x0, y: y0 }, 225, el.origin || 'O', 9);
        (el.ticks || []).forEach((t, k) => {
          const isX = t.axis === 'x';
          const at = isX ? { x: X(t.at), y: y0 } : { x: x0, y: Y(t.at) };
          lines.push(
            <line
              key={`${key}-t${k}`}
              x1={at.x - (isX ? 0 : 3)}
              y1={at.y - (isX ? 3 : 0)}
              x2={at.x + (isX ? 0 : 3)}
              y2={at.y + (isX ? 3 : 0)}
              stroke="#111"
              strokeWidth={LINE}
            />
          );
          if (t.label)
            placeLabel(
              `${key}-tl${k}`,
              at,
              isX ? 270 : 180,
              t.label,
              isX ? 9 : 6
            );
        });
        break;
      }
      case 'plot': {
        const f = compileDiagramExpr(el.expr);
        if (!f) break;
        const [a, b] = el.domain;
        lines.push(
          <path
            key={key}
            d={plotPath(f, a, b, X, Y, height)}
            fill="none"
            stroke="#111"
            strokeWidth={LINE}
            strokeLinejoin="round"
            strokeDasharray={el.dashed ? DASH : undefined}
            clipPath={`url(#${clip})`}
          />
        );
        (['start', 'end'] as const).forEach((end) => {
          const kind = el.endpoints?.[end];
          if (!kind || kind === 'none') return;
          const x = end === 'start' ? a : b;
          const y = f(x);
          if (!Number.isFinite(y)) return;
          dots.push(
            <circle
              key={`${key}-${end}`}
              cx={X(x)}
              cy={Y(y)}
              r={kind === 'open' ? 3 : 2.6}
              fill={kind === 'open' ? '#fff' : '#111'}
              stroke="#111"
              strokeWidth={kind === 'open' ? LINE : 0}
            />
          );
        });
        if (el.label) {
          const lx = el.labelAt ?? b;
          const ly = f(lx);
          if (Number.isFinite(ly)) {
            placeLabel(
              `${key}-label`,
              { x: X(lx), y: Y(ly) },
              COMPASS[el.labelPos || 'e'],
              el.label,
              6
            );
          }
        }
        break;
      }
      case 'region': {
        const upper = compileDiagramExpr(el.upper);
        const lower = el.lower ? compileDiagramExpr(el.lower) : () => 0;
        if (!upper || !lower) break;
        const [a, b] = el.domain;
        const n = 160;
        const top: string[] = [];
        const bottom: string[] = [];
        for (let k = 0; k <= n; k++) {
          const x = a + ((b - a) * k) / n;
          const u = upper(x);
          const l = lower(x);
          if (!Number.isFinite(u) || !Number.isFinite(l)) continue;
          top.push(`${X(x)},${clampY(Y(u), height)}`);
          bottom.unshift(`${X(x)},${clampY(Y(l), height)}`);
        }
        if (top.length < 2) break;
        background.push(
          <polygon
            key={key}
            points={[...top, ...bottom].join(' ')}
            fill={fillOf(el.fill || 'light')}
            stroke="none"
            clipPath={`url(#${clip})`}
          />
        );
        break;
      }
      case 'outline': {
        const coords = (el.coords || []).filter(
          (c) =>
            Array.isArray(c) && Number.isFinite(c[0]) && Number.isFinite(c[1])
        );
        if (coords.length < 2) break;
        const d =
          coords
            .map(
              (c, k) => `${k ? 'L' : 'M'}${round(X(c[0]))},${round(Y(c[1]))}`
            )
            .join('') + (el.closed ? 'Z' : '');
        const fill = el.closed ? fillOf(el.fill) : 'none';
        lines.push(
          <path
            key={key}
            d={d}
            fill={fill}
            stroke={el.stroke === false ? 'none' : '#111'}
            strokeWidth={el.thin ? LINE * 0.6 : LINE}
            strokeLinejoin="round"
            strokeDasharray={el.dashed ? (el.thin ? '3 2' : DASH) : undefined}
            clipPath={`url(#${frame})`}
          />
        );
        break;
      }
      case 'shape': {
        const start = P(el.from);
        if (!start) break;
        let at = start;
        let d = `M${X(start.x)},${Y(start.y)}`;
        for (const step of el.path) {
          const to = P(step.to);
          if (!to) break;
          const c = step.center ? P(step.center) : null;
          if (c) {
            const r = Math.hypot(at.x - c.x, at.y - c.y) * sx;
            const from = Math.atan2(at.y - c.y, at.x - c.x);
            const end = Math.atan2(to.y - c.y, to.x - c.x);
            let ccw = (((end - from) * 180) / Math.PI + 720) % 360;
            if (step.clockwise) ccw = 360 - ccw;
            const large = ccw > 180 ? 1 : 0;
            d += ` A${r},${r} 0 ${large} ${step.clockwise ? 1 : 0} ${X(to.x)},${Y(to.y)}`;
          } else {
            d += ` L${X(to.x)},${Y(to.y)}`;
          }
          at = to;
        }
        d += ' Z';
        const fill = fillOf(el.fill);
        (fill === 'none' ? lines : background).push(
          <path key={`${key}-fill`} d={d} fill={fill} stroke="none" />
        );
        if (el.stroke !== false) {
          lines.push(
            <path
              key={key}
              d={d}
              fill="none"
              stroke="#111"
              strokeWidth={LINE}
              strokeDasharray={el.dashed ? DASH : undefined}
            />
          );
        }
        break;
      }
    }
  });

  return (
    <>
      <defs>
        <pattern
          id={hatch}
          width="5"
          height="5"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="5" stroke="#111" strokeWidth="0.9" />
        </pattern>
        <marker
          id={arrow}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          markerUnits="userSpaceOnUse"
          orient="auto-start-reverse"
        >
          <path d="M0,1 L10,5 L0,9 Z" fill="#111" />
        </marker>
        <clipPath id={clip}>
          <rect x={-4} y={-4} width={width + 8} height={height + 8} />
        </clipPath>
        <clipPath id={frame}>
          <rect x={0} y={0} width={width} height={height} />
        </clipPath>
      </defs>
      {background}
      {lines}
      {dots}
      {labels}
    </>
  );
}

// a circular arc about c (screen), radius r, from start to end degrees
// (math convention: counterclockwise when end > start)
function arcPath(c: Pt, r: number, start: number, end: number): string {
  const at = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return { x: c.x + Math.cos(rad) * r, y: c.y - Math.sin(rad) * r };
  };
  const ccw = end > start;
  const span = Math.abs(end - start);
  // a full circle is two half arcs
  if (span >= 360) {
    const mid = start + (ccw ? 180 : -180);
    return `${arcPath(c, r, start, mid)} ${arcPath(c, r, mid, end).replace(/^M[^A]+/, '')}`;
  }
  const a = at(start);
  const b = at(end);
  return `M${a.x},${a.y} A${r},${r} 0 ${span > 180 ? 1 : 0} ${ccw ? 0 : 1} ${b.x},${b.y}`;
}

function round(v: number) {
  return Math.round(v * 100) / 100;
}

function clampY(y: number, height: number) {
  return Math.max(-height, Math.min(height * 2, y));
}

// a sampled curve, broken where the function is undefined; points far off
// the page are pulled to just outside it and the clip path hides them
function plotPath(
  f: (x: number) => number,
  a: number,
  b: number,
  X: (x: number) => number,
  Y: (y: number) => number,
  height: number
) {
  const n = 480;
  let d = '';
  let pen = false;
  for (let k = 0; k <= n; k++) {
    const x = a + ((b - a) * k) / n;
    const v = f(x);
    if (!Number.isFinite(v)) {
      pen = false;
      continue;
    }
    d += `${pen ? ' L' : ' M'}${X(x)},${clampY(Y(v), height)}`;
    pen = true;
  }
  return d.trim();
}

function centroid(pts: Pt[]) {
  if (!pts.length) return { x: 0, y: 0 };
  return {
    x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
    y: pts.reduce((s, p) => s + p.y, 0) / pts.length
  };
}

// A name or variable as the paper sets it: capitals and digits upright
// (A, P, 6), a single lowercase letter italic (x, y, k), words like log or
// cm upright, `_` and `^` make subscripts and superscripts (P_1, 2^x,
// log_2 x, A_{k+1}).
export function labelRuns(text: string) {
  const runs: { text: string; italic: boolean; shift: 0 | 1 | -1 }[] = [];
  const push = (t: string, shift: 0 | 1 | -1) => {
    const re = /([a-z]+)|([^a-z]+)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(t))) {
      const italic = !!m[1] && m[1].length === 1;
      runs.push({ text: m[0], italic, shift });
    }
  };
  let i = 0;
  let plain = '';
  while (i < text.length) {
    const ch = text[i];
    if ((ch === '_' || ch === '^') && i + 1 < text.length) {
      if (plain) push(plain, 0);
      plain = '';
      const shift = ch === '_' ? -1 : 1;
      let part: string;
      if (text[i + 1] === '{') {
        const close = text.indexOf('}', i + 2);
        part = close > 0 ? text.slice(i + 2, close) : text.slice(i + 2);
        i = close > 0 ? close + 1 : text.length;
      } else {
        const m = /^(\d+|[A-Za-z]|.)/.exec(text.slice(i + 1))!;
        part = m[0];
        i += 1 + part.length;
      }
      push(part, shift);
      continue;
    }
    plain += ch;
    i++;
  }
  if (plain) push(plain, 0);
  return runs;
}

function PaperLabel({
  x,
  y,
  text,
  anchor,
  size
}: {
  x: number;
  y: number;
  text: string;
  anchor: 'start' | 'middle' | 'end';
  size: number;
}) {
  const runs = labelRuns(text);
  let level = 0;
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fontSize={size}
      fill="#111"
      className={labelCls}
    >
      {runs.map((run, i) => {
        const target = run.shift * size * 0.32;
        const dy = -(target - level);
        level = target;
        return (
          <tspan
            key={i}
            dy={dy || undefined}
            fontStyle={run.italic ? 'italic' : undefined}
            fontSize={run.shift ? size * 0.72 : undefined}
          >
            {run.text}
          </tspan>
        );
      })}
    </text>
  );
}

const figureCls = css`
  margin: 0.4rem 0 0.8rem;
  break-inside: avoid;
  figcaption {
    text-align: center;
    font-weight: 700;
    font-size: 1.3rem;
    margin-bottom: 0.4rem;
  }
`;

const svgCls = css`
  display: block;
  width: 100%;
  height: auto;
  margin: 0 auto;
`;

const labelCls = css`
  font-family: 'Times New Roman', Tinos, 'Noto Serif KR', serif;
`;

const foreignCls = css`
  font-family: 'Times New Roman', Tinos, serif;
  line-height: 1.8;
  white-space: nowrap;
  color: #111;
`;

const noteCls = css`
  text-align: right;
  font-size: 1.1rem;
  margin: 0.3rem 0 0;
`;
