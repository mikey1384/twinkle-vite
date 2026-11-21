import React, { useId, useState } from 'react';
import { css } from '@emotion/css';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import BatteryGauge from '~/components/BatteryGauge';
import {
  BATTERY_STEP_UNITS,
  BATTERY_MIN_UNITS,
  FULL_BATTERY_UNITS,
  batteryPercent,
  describeBatteryUse,
  formatBatteryExpiry
} from '~/helpers/battery';

// How much battery to give or ask for (DESIGN §7). The site's standard Modal
// and Buttons; amounts in 1% steps up to what the server says is possible.
const pickerClass = css`
  display: grid;
  gap: 1.6rem;
  .hero {
    display: flex;
    align-items: center;
    gap: 1.6rem;
    padding: 1.6rem;
    border: 1px solid #aad9cc;
    border-radius: 1.4rem;
    background: #effaf7;
  }
  .hero-amount {
    font-size: 3.2rem;
    font-weight: 800;
    line-height: 1.1;
    color: #126b65;
    font-variant-numeric: tabular-nums;
  }
  .hero-sub {
    font-size: 1.3rem;
    color: #24334a;
    margin-top: 0.3rem;
  }
  .hero-sub b {
    color: #126b65;
  }
  .slider-row label {
    display: flex;
    justify-content: space-between;
    font-size: 1.2rem;
    font-weight: 700;
    color: #344359;
    margin-bottom: 0.6rem;
  }
  .slider-row label span {
    font-weight: 400;
    color: #67758a;
  }
  input[type='range'] {
    width: 100%;
    height: 3.2rem;
    accent-color: #16a34a;
    cursor: pointer;
    margin: 0;
  }
  .ends {
    display: flex;
    justify-content: space-between;
    font-size: 1.1rem;
    color: #67758a;
  }
  .picks {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.7rem;
  }
  .picks button {
    min-height: 4.4rem;
    border: 1px solid #d4deeb;
    border-radius: 0.8rem;
    background: #fff;
    color: #325681;
    font-size: 1.3rem;
    font-weight: 700;
    cursor: pointer;
    padding: 0.4rem;
  }
  .picks button small {
    display: block;
    font-size: 1rem;
    font-weight: 500;
    color: #67758a;
  }
  .picks button[aria-pressed='true'] {
    border-color: #16a34a;
    background: #effaf7;
    color: #126b65;
  }
  .picks button:disabled {
    opacity: 0.45;
    cursor: default;
  }
  .expiry {
    display: flex;
    gap: 0.8rem;
    align-items: flex-start;
    padding: 1rem 1.2rem;
    border-radius: 1rem;
    background: #fff8ed;
    border: 1px solid #ebc896;
    color: #80501c;
    font-size: 1.25rem;
    line-height: 1.5;
  }
  .empty-state {
    text-align: center;
    padding: 2rem 1rem;
    color: #536178;
    font-size: 1.3rem;
    line-height: 1.6;
  }
  @media (max-width: 450px) {
    .hero {
      flex-direction: column;
      text-align: center;
      padding: 1.2rem;
      gap: 0.8rem;
    }
    .hero-amount {
      font-size: 2.6rem;
    }
    .picks {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
`;

export default function BatteryAmountPicker({
  side,
  partnerName,
  maxUnits,
  initialUnits,
  expiresAt,
  nowMs,
  timeZone,
  onHide,
  onDone
}: {
  side: 'give' | 'receive';
  partnerName: string;
  // give: today's battery you can still send (own unspent allowance + received)
  // receive: how much more you can receive today (receive cap room)
  maxUnits: number;
  initialUnits?: number;
  expiresAt: number;
  nowMs: number;
  timeZone?: string;
  onHide: () => void;
  onDone: (units: number) => void;
}) {
  const sliderId = useId();
  const max =
    Math.floor(Math.min(FULL_BATTERY_UNITS, maxUnits) / BATTERY_STEP_UNITS) *
    BATTERY_STEP_UNITS;
  const [units, setUnits] = useState(
    Math.min(initialUnits || Math.min(FULL_BATTERY_UNITS * 0.2, max), max)
  );
  const when = formatBatteryExpiry(expiresAt, nowMs, timeZone);
  const quick = [
    { units: FULL_BATTERY_UNITS * 0.2, label: '20%', sub: '1 bar' },
    { units: FULL_BATTERY_UNITS * 0.4, label: '40%', sub: '2 bars' },
    { units: FULL_BATTERY_UNITS * 0.6, label: '60%', sub: '3 bars' },
    {
      units: max,
      label: `${batteryPercent(max)}%`,
      sub: side === 'give' ? 'All I can give' : 'Most I can get'
    }
  ];
  const empty = max < BATTERY_MIN_UNITS;
  return (
    <Modal
      modalKey="BatteryAmountPicker"
      isOpen
      size="sm"
      title={side === 'give' ? 'Give battery' : 'Ask for battery'}
      onClose={onHide}
      animationDuration={0}
      footer={
        <>
          <Button variant="ghost" onClick={onHide}>
            Cancel
          </Button>
          <Button
            color="green"
            variant="solid"
            disabled={empty}
            onClick={() => onDone(units)}
          >
            <Icon icon="bolt" />
            <span style={{ marginLeft: '0.7rem' }}>
              {empty ? 'Add battery' : `Add ${batteryPercent(units)}% battery`}
            </span>
          </Button>
        </>
      }
    >
      <div className={pickerClass} style={{ width: '100%' }}>
        {empty ? (
          <div className="empty-state">
            <BatteryGauge units={0} size="lg" muted />
            <p>
              {side === 'give'
                ? `You have no battery left to give today. It refills ${when}.`
                : `You've received all the battery you can today. Try again after ${when.replace(/^(today|tomorrow) at /, '')}.`}
            </p>
          </div>
        ) : (
          <>
            <div className="hero">
              <BatteryGauge units={units} size="lg" />
              <div style={{ minWidth: 0 }}>
                <div className="hero-amount">{batteryPercent(units)}%</div>
                <div className="hero-sub">
                  of a full battery · <b>{describeBatteryUse(units)}</b>
                </div>
              </div>
            </div>
            <div className="slider-row">
              <label htmlFor={sliderId}>
                {side === 'give'
                  ? `How much for ${partnerName}?`
                  : `How much from ${partnerName}?`}
              </label>
              <input
                id={sliderId}
                type="range"
                min={BATTERY_MIN_UNITS}
                max={max}
                step={BATTERY_STEP_UNITS}
                value={units}
                aria-valuetext={`${batteryPercent(units)}% of a battery, ${describeBatteryUse(units)}`}
                onChange={(e) => setUnits(Number(e.target.value))}
              />
              <div className="ends">
                <span>{batteryPercent(BATTERY_MIN_UNITS)}%</span>
                <span>{batteryPercent(max)}%</span>
              </div>
            </div>
            <div className="picks" role="group" aria-label="Quick amounts">
              {quick.map((pick, index) => (
                <button
                  key={index}
                  aria-pressed={units === pick.units}
                  disabled={pick.units > max}
                  onClick={() => setUnits(pick.units)}
                >
                  {pick.label}
                  <small>{pick.sub}</small>
                </button>
              ))}
            </div>
            <div className="expiry">
              <Icon icon="hourglass-half" style={{ marginTop: '0.25rem' }} />
              <span>
                Expires <b>{when}</b>. Battery that isn't used by then
                disappears.
              </span>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
