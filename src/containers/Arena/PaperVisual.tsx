import React from 'react';
import { css, cx } from '@emotion/css';
import { arenaMediaURL } from './media';
import PaperDiagram, { type DiagramVisual } from './PaperDiagram';
import PaperMap, { type MapVisual } from './PaperMap';

// Tables, charts and pictures as the real booklet prints them (Mikey
// 2026-10-24): black and white, series told apart by solid, white and
// hatched fills, values printed on bars when the item says so. Charts are
// drawn from the item's data, so the numbers the questions test are exact.

export interface Visual {
  kind:
    | 'table'
    | 'bar'
    | 'groupedBar'
    | 'line'
    | 'pie'
    | 'image'
    | 'panels'
    | 'timeline'
    | 'diagram'
    | 'map';
  orientation?: 'vertical' | 'horizontal';
  panels?: Visual[];
  title?: string;
  columns?: string[];
  rows?: { marker?: string; cells: string[] }[];
  yLabel?: string;
  yMax?: number;
  yStep?: number;
  categories?: string[];
  series?: { name: string; values: number[] }[];
  valueLabels?: boolean;
  note?: string;
  src?: string;
  alt?: string;
  // a licensed photo's required attribution (공공누리 제1유형: 출처표시)
  credit?: string;
  // timeline (한국사 연표): the marked events in order, and the labels of
  // the spans between consecutive marks ((가) … (마))
  ticks?: { label: string; text?: string }[];
  segments?: string[];
}

const FILLS = [
  '#222',
  '#fff',
  'url(#arena-hatch)',
  '#9a9a9a',
  'url(#arena-dots)'
];

// A table whose rows carry ①-⑤ is the question's choices (수능 영어 10번):
// the paper prints no separate choice line, so the rows themselves mark.
export function tableMarksChoices(visual: Visual) {
  return visual.kind === 'table' && !!visual.rows?.some((row) => row.marker);
}

export default function PaperVisual({
  visual,
  marked = null,
  onMark
}: {
  visual: Visual;
  marked?: number | null;
  onMark?: (choice: number | null) => void;
}) {
  if (visual.kind === 'table') {
    return <PaperTable visual={visual} marked={marked} onMark={onMark} />;
  }
  if (visual.kind === 'image' && visual.src) {
    return (
      <figure className={figureCls}>
        <img
          src={arenaMediaURL(visual.src)}
          alt={visual.alt || visual.title || ''}
          className={visual.credit ? 'photo' : undefined}
        />
        {visual.credit && <p className={creditCls}>{visual.credit}</p>}
      </figure>
    );
  }
  if (visual.kind === 'timeline') return <PaperTimeline visual={visual} />;
  // a 수학/과학/KMC figure drawn from the item's data (PaperDiagram.tsx)
  if (visual.kind === 'diagram') {
    return <PaperDiagram visual={visual as unknown as DiagramVisual} />;
  }
  // a locator map from bundled outlines (PaperMap.tsx)
  if (visual.kind === 'map') {
    return <PaperMap visual={visual as unknown as MapVisual} />;
  }
  if (visual.kind === 'panels') {
    return (
      <figure className={figureCls}>
        {visual.title && <figcaption>{visual.title}</figcaption>}
        <div className={panelsCls}>
          {(visual.panels || []).map((panel, i) => (
            <PaperVisual key={i} visual={panel} />
          ))}
        </div>
      </figure>
    );
  }
  if (visual.kind === 'line') return <LineChart visual={visual} />;
  if (visual.kind === 'pie') return <PieChart visual={visual} />;
  if (visual.orientation === 'horizontal')
    return <HorizontalBarChart visual={visual} />;
  return <BarChart visual={visual} />;
}

function PieChart({ visual }: { visual: Visual }) {
  const values = visual.series?.[0]?.values || [];
  const labels = visual.categories || [];
  const total = values.reduce((sum, v) => sum + v, 0) || 1;
  const R = 90;
  const C = { x: 130, y: 110 };
  let angle = -Math.PI / 2;
  return (
    <figure className={figureCls}>
      {visual.title && <figcaption>{visual.title}</figcaption>}
      <svg
        viewBox="0 0 260 230"
        className={svgCls}
        role="img"
        aria-label={visual.title}
      >
        <Defs />
        {values.map((v, i) => {
          const start = angle;
          const sweep = (v / total) * Math.PI * 2;
          angle += sweep;
          const end = angle;
          const large = sweep > Math.PI ? 1 : 0;
          const x1 = C.x + R * Math.cos(start);
          const y1 = C.y + R * Math.sin(start);
          const x2 = C.x + R * Math.cos(end);
          const y2 = C.y + R * Math.sin(end);
          const mid = (start + end) / 2;
          const lx = C.x + R * 0.62 * Math.cos(mid);
          const ly = C.y + R * 0.62 * Math.sin(mid);
          const fill = FILLS[i % FILLS.length];
          const dark = fill === '#222';
          return (
            <g key={i}>
              <path
                d={`M${C.x},${C.y} L${x1},${y1} A${R},${R} 0 ${large} 1 ${x2},${y2} Z`}
                fill={fill}
                stroke="#222"
              />
              <text
                x={lx}
                y={ly}
                textAnchor="middle"
                fontSize="10"
                fill={dark ? '#fff' : '#222'}
              >
                <tspan x={lx} dy="-2">
                  {labels[i]}
                </tspan>
                {visual.valueLabels && (
                  <tspan x={lx} dy="11">
                    {v}%
                  </tspan>
                )}
              </text>
            </g>
          );
        })}
      </svg>
      {visual.note && <p className={noteCls}>{visual.note}</p>}
    </figure>
  );
}

function HorizontalBarChart({ visual }: { visual: Visual }) {
  const series = visual.series || [];
  const categories = visual.categories || [];
  const LEFT = 92;
  const HH = Math.max(220, 28 + categories.length * (series.length * 14 + 14));
  const max =
    visual.yMax ||
    Math.ceil(Math.max(...series.flatMap((s) => s.values), 1) / 10) * 10;
  const step = visual.yStep || (max <= 50 ? 10 : 20);
  const ticks: number[] = [];
  for (let v = 0; v <= max + 1e-9; v += step) ticks.push(v);
  const x = (v: number) => LEFT + (W - LEFT - PAD.right) * (v / max);
  const groupH = (HH - 40) / Math.max(categories.length, 1);
  const barH = Math.min(14, (groupH * 0.8) / Math.max(series.length, 1));
  return (
    <figure className={figureCls}>
      {visual.title && <figcaption>{visual.title}</figcaption>}
      <svg
        viewBox={`0 0 ${W} ${HH}`}
        className={svgCls}
        role="img"
        aria-label={visual.title}
      >
        <Defs />
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={x(t)}
              x2={x(t)}
              y1={10}
              y2={HH - 26}
              stroke="#ccc"
              strokeWidth="0.8"
            />
            <text x={x(t)} y={HH - 12} textAnchor="middle" fontSize="11">
              {t}
            </text>
          </g>
        ))}
        <line x1={LEFT} x2={LEFT} y1={10} y2={HH - 26} stroke="#222" />
        {categories.map((cat, ci) => {
          const y0 = 10 + groupH * ci + (groupH - barH * series.length) / 2;
          return (
            <g key={cat}>
              <text
                x={LEFT - 6}
                y={10 + groupH * ci + groupH / 2 + 4}
                textAnchor="end"
                fontSize="11"
              >
                {cat}
              </text>
              {series.map((s, si) => {
                const v = s.values[ci] ?? 0;
                const y = y0 + barH * si;
                return (
                  <g key={s.name}>
                    <rect
                      x={LEFT}
                      y={y}
                      width={x(v) - LEFT}
                      height={barH - 2}
                      fill={FILLS[si % FILLS.length]}
                      stroke="#222"
                    />
                    {visual.valueLabels && (
                      <text x={x(v) + 4} y={y + barH - 4} fontSize="10">
                        {v}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}
        {visual.yLabel && (
          <text x={W - PAD.right} y={HH - 1} textAnchor="end" fontSize="10">
            ({visual.yLabel})
          </text>
        )}
      </svg>
      <Legend series={series} />
      {visual.note && <p className={noteCls}>{visual.note}</p>}
    </figure>
  );
}

// A 연표 as 한국사 papers print it: one black rule, a dot per event with its
// year above and the event below, and the span labels ((가) …) set between
// consecutive dots. Drawn from the item's data so the order the question
// tests is exact.
function PaperTimeline({ visual }: { visual: Visual }) {
  const ticks = visual.ticks || [];
  const segments = visual.segments || [];
  if (ticks.length < 2) return null;
  const W = 640;
  const pad = 40;
  const step = (W - pad * 2) / (ticks.length - 1);
  const x = (i: number) => pad + i * step;
  const lineY = 62;
  return (
    <figure className={figureCls}>
      {visual.title && <figcaption>{visual.title}</figcaption>}
      <svg
        viewBox={`0 0 ${W} 130`}
        className={timelineCls}
        role="img"
        aria-label={ticks.map((t) => `${t.label} ${t.text || ''}`).join(', ')}
      >
        <line
          x1={pad - 16}
          x2={W - pad + 16}
          y1={lineY}
          y2={lineY}
          stroke="#111"
          strokeWidth={2}
        />
        {ticks.map((tick, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={lineY} r={5} fill="#111" />
            <text
              x={x(i)}
              y={lineY - 16}
              textAnchor="middle"
              fontSize={15}
              fontWeight={700}
            >
              {tick.label}
            </text>
            {tick.text &&
              wrap(tick.text, 9).map((line, j) => (
                <text
                  key={j}
                  x={x(i)}
                  y={lineY + 26 + j * 17}
                  textAnchor="middle"
                  fontSize={13}
                >
                  {line}
                </text>
              ))}
          </g>
        ))}
        {segments.slice(0, ticks.length - 1).map((label, i) => (
          <text
            key={label}
            x={(x(i) + x(i + 1)) / 2}
            y={lineY - 6}
            textAnchor="middle"
            fontSize={15}
            fontWeight={700}
          >
            {label}
          </text>
        ))}
      </svg>
      {visual.note && <p className={noteCls}>{visual.note}</p>}
    </figure>
  );
}

// split a short Korean event name into lines of about n characters
function wrap(text: string, n: number) {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    if (line && (line + ' ' + word).length > n) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

function PaperTable({
  visual,
  marked,
  onMark
}: {
  visual: Visual;
  marked: number | null;
  onMark?: (choice: number | null) => void;
}) {
  return (
    <figure className={figureCls}>
      {visual.title && <figcaption>{visual.title}</figcaption>}
      <table className={tableCls}>
        <thead>
          <tr>
            {visual.rows?.some((r) => r.marker) && <th />}
            {(visual.columns || []).map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(visual.rows || []).map((row, i) => (
            <tr
              key={i}
              className={cx(
                row.marker && onMark && markableRowCls,
                row.marker && marked === i && markedRowCls
              )}
              onClick={
                row.marker && onMark
                  ? () => onMark(marked === i ? null : i)
                  : undefined
              }
            >
              {row.marker && <td className={markerCls}>{row.marker}</td>}
              {row.cells.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

const W = 520;
const H = 300;
const PAD = { left: 48, right: 12, top: 16, bottom: 46 };

function axis(visual: Visual) {
  const max =
    visual.yMax ||
    Math.ceil(
      Math.max(...(visual.series || []).flatMap((s) => s.values), 1) / 10
    ) * 10;
  const step = visual.yStep || (max <= 50 ? 10 : max <= 100 ? 20 : max / 5);
  const ticks: number[] = [];
  for (let v = 0; v <= max + 1e-9; v += step)
    ticks.push(Math.round(v * 100) / 100);
  const y = (v: number) => PAD.top + (H - PAD.top - PAD.bottom) * (1 - v / max);
  return { max, ticks, y };
}

function Defs() {
  return (
    <defs>
      <pattern
        id="arena-hatch"
        width="6"
        height="6"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)"
      >
        <rect width="6" height="6" fill="#fff" />
        <line x1="0" y1="0" x2="0" y2="6" stroke="#222" strokeWidth="1.4" />
      </pattern>
      <pattern
        id="arena-dots"
        width="5"
        height="5"
        patternUnits="userSpaceOnUse"
      >
        <rect width="5" height="5" fill="#fff" />
        <circle cx="2.5" cy="2.5" r="1" fill="#222" />
      </pattern>
    </defs>
  );
}

function Frame({
  visual,
  ticks,
  y
}: {
  visual: Visual;
  ticks: number[];
  y: (v: number) => number;
}) {
  return (
    <>
      {ticks.map((t) => (
        <g key={t}>
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={y(t)}
            y2={y(t)}
            stroke="#ccc"
            strokeWidth="0.8"
          />
          <text x={PAD.left - 6} y={y(t) + 4} textAnchor="end" fontSize="11">
            {t}
          </text>
        </g>
      ))}
      <line
        x1={PAD.left}
        x2={PAD.left}
        y1={PAD.top}
        y2={H - PAD.bottom}
        stroke="#222"
      />
      <line
        x1={PAD.left}
        x2={W - PAD.right}
        y1={H - PAD.bottom}
        y2={H - PAD.bottom}
        stroke="#222"
      />
      {visual.yLabel && (
        <text x={4} y={PAD.top - 4} fontSize="11">
          ({visual.yLabel})
        </text>
      )}
    </>
  );
}

function Legend({ series }: { series: { name: string }[] }) {
  if (series.length < 2) return null;
  return (
    <div className={legendCls}>
      {series.map((s, i) => (
        <span key={s.name}>
          <svg width="14" height="10" aria-hidden>
            <Defs />
            <rect
              width="14"
              height="10"
              fill={FILLS[i % FILLS.length]}
              stroke="#222"
            />
          </svg>
          {s.name}
        </span>
      ))}
    </div>
  );
}

function BarChart({ visual }: { visual: Visual }) {
  const series = visual.series || [];
  const categories = visual.categories || [];
  const { ticks, y } = axis(visual);
  const groupW = (W - PAD.left - PAD.right) / Math.max(categories.length, 1);
  const barW = Math.min(28, (groupW * 0.75) / Math.max(series.length, 1));
  return (
    <figure className={figureCls}>
      {visual.title && <figcaption>{visual.title}</figcaption>}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className={svgCls}
        role="img"
        aria-label={visual.title}
      >
        <Defs />
        <Frame visual={visual} ticks={ticks} y={y} />
        {categories.map((cat, ci) => {
          const x0 =
            PAD.left + groupW * ci + (groupW - barW * series.length) / 2;
          return (
            <g key={cat}>
              {series.map((s, si) => {
                const v = s.values[ci] ?? 0;
                const x = x0 + barW * si;
                return (
                  <g key={s.name}>
                    <rect
                      x={x}
                      y={y(v)}
                      width={barW - 2}
                      height={H - PAD.bottom - y(v)}
                      fill={FILLS[si % FILLS.length]}
                      stroke="#222"
                    />
                    {visual.valueLabels && (
                      <text
                        x={x + (barW - 2) / 2}
                        y={y(v) - 3}
                        textAnchor="middle"
                        fontSize="10"
                      >
                        {v}
                      </text>
                    )}
                  </g>
                );
              })}
              <text
                x={PAD.left + groupW * ci + groupW / 2}
                y={H - PAD.bottom + 16}
                textAnchor="middle"
                fontSize="11"
              >
                {cat}
              </text>
            </g>
          );
        })}
      </svg>
      <Legend series={series} />
      {visual.note && <p className={noteCls}>{visual.note}</p>}
    </figure>
  );
}

function LineChart({ visual }: { visual: Visual }) {
  const series = visual.series || [];
  const categories = visual.categories || [];
  const { ticks, y } = axis(visual);
  const stepX = (W - PAD.left - PAD.right) / Math.max(categories.length - 1, 1);
  const x = (i: number) =>
    PAD.left + 16 + (stepX - 32 / Math.max(categories.length - 1, 1)) * i;
  const MARKS = ['circle', 'square', 'triangle'];
  return (
    <figure className={figureCls}>
      {visual.title && <figcaption>{visual.title}</figcaption>}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className={svgCls}
        role="img"
        aria-label={visual.title}
      >
        <Defs />
        <Frame visual={visual} ticks={ticks} y={y} />
        {series.map((s, si) => (
          <g key={s.name}>
            <polyline
              fill="none"
              stroke="#222"
              strokeWidth="1.5"
              strokeDasharray={si === 1 ? '5 3' : si === 2 ? '2 2' : undefined}
              points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
            />
            {s.values.map((v, i) => {
              const mark = MARKS[si % MARKS.length];
              return (
                <g key={i}>
                  {mark === 'circle' && (
                    <circle cx={x(i)} cy={y(v)} r="3.5" fill="#222" />
                  )}
                  {mark === 'square' && (
                    <rect
                      x={x(i) - 3.5}
                      y={y(v) - 3.5}
                      width="7"
                      height="7"
                      fill="#fff"
                      stroke="#222"
                    />
                  )}
                  {mark === 'triangle' && (
                    <polygon
                      points={`${x(i)},${y(v) - 4} ${x(i) - 4},${y(v) + 3} ${x(i) + 4},${y(v) + 3}`}
                      fill="#222"
                    />
                  )}
                  {visual.valueLabels && (
                    <text
                      x={x(i)}
                      y={y(v) - 7}
                      textAnchor="middle"
                      fontSize="10"
                    >
                      {v}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        ))}
        {categories.map((cat, i) => (
          <text
            key={cat}
            x={x(i)}
            y={H - PAD.bottom + 16}
            textAnchor="middle"
            fontSize="11"
          >
            {cat}
          </text>
        ))}
      </svg>
      <Legend series={series} />
      {visual.note && <p className={noteCls}>{visual.note}</p>}
    </figure>
  );
}

const creditCls = css`
  margin: 0.3rem 0 0;
  font-size: 1.05rem;
  text-align: right;
  color: #555;
`;

const timelineCls = css`
  width: 100%;
  max-width: 64rem;
  font-family: inherit;
`;

const figureCls = css`
  margin: 0 0 0.8rem;
  break-inside: avoid;
  figcaption {
    text-align: center;
    font-weight: 700;
    font-size: 1.3rem;
    margin-bottom: 0.4rem;
  }
  img {
    display: block;
    max-width: 100%;
    margin: 0 auto;
  }
  /* an artifact photo prints small, as on the real paper */
  img.photo {
    max-height: 22rem;
    width: auto;
  }
`;

const svgCls = css`
  width: 100%;
  height: auto;
  font-family: 'Times New Roman', Tinos, serif;
`;

const tableCls = css`
  width: 100%;
  border-collapse: collapse;
  font-size: 1.25rem;
  th,
  td {
    border: 1px solid #222;
    padding: 0.3rem 0.4rem;
    text-align: center;
  }
  th {
    background: #eee;
    font-weight: 700;
  }
`;

const markerCls = css`
  font-weight: 700;
  width: 2.4rem;
`;

const legendCls = css`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 1.2rem;
  font-size: 1.15rem;
  span {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }
`;

const noteCls = css`
  text-align: right;
  font-size: 1.1rem;
  margin: 0.3rem 0 0;
`;

const panelsCls = css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(22rem, 1fr));
  gap: 1rem;
  align-items: start;
`;

const markableRowCls = css`
  cursor: pointer;
  &:hover td {
    background: #f4f0e6;
  }
`;

const markedRowCls = css`
  td {
    background: #ece6d6;
    font-weight: 700;
  }
`;
