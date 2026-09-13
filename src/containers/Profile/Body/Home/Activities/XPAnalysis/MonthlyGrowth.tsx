import React, { useId, useState } from 'react';
import { css, keyframes } from '@emotion/css';
import {
  formatCompactXP,
  formatXP,
  getMonthlyScale,
  type MonthlyXP
} from './helpers/data';
import { captionClass, cardClass, headingClass } from './styles';

export default function MonthlyGrowth({ data }: { data: MonthlyXP[] }) {
  const headingId = useId();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const latest = data[data.length - 1];
  const active =
    data.find(({ id }) => id === (hoveredId ?? selectedId)) || latest;
  const scale = getMonthlyScale(data);
  const total = data.reduce((sum, { value }) => sum + value, 0);
  const ticks =
    scale.min < 0 ? [scale.max, 0, scale.min] : [scale.max, scale.max / 2, 0];

  return (
    <section
      className={`${cardClass} ${growthClass}`}
      aria-labelledby={headingId}
    >
      <div className={headingClass}>
        <h3 id={headingId}>Monthly growth</h3>
        <span className={captionClass}>Last {data.length || 5} months</span>
      </div>
      {active ? (
        <>
          <div className="month-detail" aria-live="polite" aria-atomic="true">
            <div className="month-caption">
              <span>{active.label}</span>
              {active.id === latest.id && (
                <span className="current-badge">Month so far</span>
              )}
            </div>
            <p className="month-value">
              {formatXP(active.value)} <span>XP</span>
            </p>
          </div>
          <div
            className="chart"
            role="group"
            aria-label="Monthly net XP. Select a month for its exact amount."
          >
            <div className="grid" aria-hidden="true">
              {Array.from(new Set(ticks)).map((value) => (
                <div
                  className="grid-line"
                  key={value}
                  data-zero={value === 0}
                  style={{
                    top: `${scale.max === scale.min ? 100 : ((scale.max - value) / scale.range) * 100}%`
                  }}
                >
                  <span>{formatCompactXP(value)}</span>
                </div>
              ))}
            </div>
            <div className="months" onMouseLeave={() => setHoveredId(null)}>
              {data.map((month, index) => {
                const height = (Math.abs(month.value) / scale.range) * 100;
                const top = month.value >= 0 ? scale.zero - height : scale.zero;
                return (
                  <button
                    key={month.id}
                    type="button"
                    className="month"
                    aria-label={`${month.label}: ${formatXP(month.value)} XP${month.id === latest.id ? ', month so far' : ''}`}
                    aria-pressed={month.id === (selectedId ?? latest.id)}
                    data-active={month.id === active.id}
                    data-current={month.id === latest.id}
                    onMouseEnter={() => setHoveredId(month.id)}
                    onFocus={() => {
                      setHoveredId(null);
                      setSelectedId(month.id);
                    }}
                    onClick={() => setSelectedId(month.id)}
                  >
                    <span className="bar-track" aria-hidden="true">
                      <span
                        className="bar"
                        data-negative={month.value < 0}
                        style={{
                          top: `${month.value === 0 && scale.min === 0 ? 100 : top}%`,
                          height: month.value === 0 ? '2px' : `${height}%`,
                          animationDelay: `${index * 55}ms`
                        }}
                      />
                    </span>
                    <span className="month-label" aria-hidden="true">
                      {month.label}
                    </span>
                    <span className="bar-value" aria-hidden="true">
                      {formatCompactXP(month.value)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="period-total">
            <span className={captionClass}>
              Net XP · {data[0].label}–{latest.label}
            </span>
            <strong>
              {formatXP(total)} <span>XP</span>
            </strong>
          </div>
          <p className={`${captionClass} chart-help`}>
            Select a month to explore. This month is still in progress.
          </p>
        </>
      ) : (
        <p className={captionClass}>
          Monthly XP will appear here as it is earned.
        </p>
      )}
    </section>
  );
}

const grow = keyframes`
  from { transform: scaleY(0); }
  to { transform: scaleY(1); }
`;

const growthClass = css`
  background: #f8fafc;
  .month-detail {
    margin-bottom: 3.2rem;
  }
  .month-caption {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    height: 2.6rem;
    font-size: max(13px, 1.4rem);
    font-weight: 600;
    color: var(--xp-muted);
  }
  .current-badge {
    padding: 0.2rem 0.7rem;
    border-radius: 6px;
    background: #fff;
    border: 1px solid var(--xp-line);
    font-size: max(11px, 1.1rem);
    font-weight: 500;
  }
  .month-value {
    font-size: clamp(28px, 5vw, 3.2rem);
    font-weight: 750;
    letter-spacing: -0.04em;
    line-height: 1.5;
    overflow-wrap: anywhere;
    span {
      font-size: max(12px, 1.4rem);
      color: var(--xp-muted);
      font-weight: 500;
      letter-spacing: 0;
    }
  }
  .chart {
    position: relative;
  }
  .grid {
    position: absolute;
    top: 0;
    left: 4.2rem;
    right: 0;
    height: 19rem;
    pointer-events: none;
  }
  .grid-line {
    position: absolute;
    width: 100%;
    border-top: 1px solid #e6ebf1;
    &[data-zero='true'] {
      border-color: #cbd5e1;
    }
    span {
      position: absolute;
      right: calc(100% + 0.6rem);
      transform: translateY(-50%);
      font-size: max(11px, 1.1rem);
      color: var(--xp-muted);
      white-space: nowrap;
    }
  }
  .months {
    display: flex;
    gap: 0.5rem;
    margin-left: 4.2rem;
  }
  .month {
    flex: 1;
    min-width: 0;
    border: 0;
    padding: 0;
    border-radius: 7px;
    background: transparent;
    color: var(--xp-muted);
    font: inherit;
    cursor: pointer;
    text-align: center;
    -webkit-tap-highlight-color: transparent;
    &:focus-visible {
      outline: 2px solid var(--xp-focus);
      outline-offset: 3px;
    }
    &[data-active='true'] {
      color: var(--xp-ink);
    }
    &[data-active='true'] .bar-track {
      background: var(--xp-tint);
    }
    &[data-active='true'] .month-label {
      font-weight: 750;
    }
    &[data-current='true'] .bar {
      background: var(--xp-accent);
    }
  }
  .bar-track {
    display: block;
    position: relative;
    height: 19rem;
    border-radius: 7px;
    transition: background 160ms ease;
  }
  .bar {
    position: absolute;
    left: 18%;
    width: 64%;
    max-width: 4.6rem;
    border-radius: 6px 6px 2px 2px;
    background: color-mix(in srgb, var(--xp-accent) 40%, #cbd5e1);
    transform-origin: bottom;
    animation: ${grow} 500ms cubic-bezier(0.2, 0.7, 0.3, 1) both;
    &[data-negative='true'] {
      transform-origin: top;
      border-radius: 2px 2px 6px 6px;
    }
  }
  .month-label {
    display: block;
    margin-top: 1.2rem;
    font-size: max(12px, 1.3rem);
  }
  .bar-value {
    display: block;
    margin-top: 0.2rem;
    font-size: max(11px, 1.1rem);
    white-space: nowrap;
  }
  .period-total {
    border-top: 1px solid var(--xp-line);
    margin-top: 2rem;
    padding-top: 1.4rem;
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 0.5rem 1rem;
    flex-wrap: wrap;
  }
  .period-total strong {
    font-size: max(14px, 1.6rem);
  }
  .period-total strong span {
    font-size: max(11px, 1.1rem);
    font-weight: 500;
    color: var(--xp-muted);
  }
  .chart-help {
    margin-top: 1.1rem;
  }
  @media (prefers-reduced-motion: reduce) {
    .bar {
      animation: none;
    }
    .bar-track {
      transition: none;
    }
  }
`;
