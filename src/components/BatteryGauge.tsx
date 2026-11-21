import React from 'react';
import { css } from '@emotion/css';
import { FULL_BATTERY_UNITS } from '~/helpers/battery';

// A battery amount drawn as the AI Energy card's five cells, in the card's
// flat green tones (no gradients). Used by the trade battery row and picker.
const gaugeClass = css`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
  .shell {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 2px;
    padding: 2px;
    border: 2px solid #15803d;
    border-radius: 0.6rem;
    background: #fff;
  }
  .cell {
    position: relative;
    overflow: hidden;
    border-radius: 0.25rem;
    background: rgba(148, 163, 184, 0.22);
  }
  .fill {
    position: absolute;
    inset: 0 auto 0 0;
    background: #22c55e;
  }
  .nub {
    width: 3px;
    border-radius: 0 2px 2px 0;
    background: #15803d;
  }
  &[data-muted='true'] .shell {
    border-color: #94a3b8;
  }
  &[data-muted='true'] .fill {
    background: #94a3b8;
  }
  &[data-muted='true'] .nub {
    background: #94a3b8;
  }
`;

export default function BatteryGauge({
  units,
  size = 'md',
  muted = false
}: {
  units: number;
  size?: 'sm' | 'md' | 'lg';
  muted?: boolean;
}) {
  const ratio = Math.max(0, Math.min(1, units / FULL_BATTERY_UNITS)) * 5;
  const dims =
    size === 'lg'
      ? { w: '4.2rem', h: '5.6rem', nub: '2.2rem' }
      : size === 'sm'
        ? { w: '0.9rem', h: '1.6rem', nub: '0.8rem' }
        : { w: '1.3rem', h: '2.4rem', nub: '1.1rem' };
  return (
    <span className={gaugeClass} data-muted={muted} aria-hidden="true">
      <span className="shell">
        {Array.from({ length: 5 }).map((_, index) => (
          <span
            key={index}
            className="cell"
            style={{ width: dims.w, height: dims.h }}
          >
            <span
              className="fill"
              style={{
                width: `${Math.max(0, Math.min(1, ratio - index)) * 100}%`
              }}
            />
          </span>
        ))}
      </span>
      <span className="nub" style={{ height: dims.nub }} />
    </span>
  );
}
