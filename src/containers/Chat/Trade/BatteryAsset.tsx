import React from 'react';
import { css, cx } from '@emotion/css';
import Icon from '~/components/Icon';
import BatteryGauge from '~/components/BatteryGauge';
import {
  batteryPercent,
  describeBatteryUse,
  formatBatteryExpiry
} from '~/helpers/battery';

// The battery row of a trade: amount, a plain equivalent, and when it ends
// (in the member's own clock).
const assetClass = css`
  .battery-main {
    display: flex;
    align-items: center;
    gap: 1rem;
    min-width: 0;
  }
  .battery-amount {
    font-size: 1.6rem;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    color: #24334a;
  }
  .battery-use {
    font-size: 1.2rem;
    color: #536178;
    margin-top: 0.1rem;
  }
  .battery-expiry {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-top: 0.8rem;
    padding: 0.6rem 0.8rem;
    border-radius: 0.7rem;
    background: #fff8ed;
    color: #80501c;
    font-size: 1.15rem;
    font-weight: 600;
  }
  .battery-expiry[data-state='expired'] {
    background: #f1f3f6;
    color: #5a677d;
  }
  .battery-expiry[data-state='used'] {
    background: #e9f6f3;
    color: #126b65;
  }
`;

export default function BatteryAsset({
  units,
  expiresAt,
  nowMs,
  timeZone,
  state = 'pending',
  onRemove,
  onEdit
}: {
  units: number;
  expiresAt: number;
  nowMs: number;
  timeZone?: string;
  state?: 'pending' | 'listed' | 'received' | 'sent' | 'expired' | 'cancelled';
  onRemove?: () => void;
  onEdit?: () => void;
}) {
  const when = formatBatteryExpiry(expiresAt, nowMs, timeZone);
  return (
    <div className={cx('asset', assetClass)}>
      <div className="asset-heading">
        <b>AI Energy battery</b>
        {(onEdit || onRemove) && (
          <span style={{ display: 'flex', gap: '0.6rem' }}>
            {onEdit && (
              <button className="remove" onClick={onEdit}>
                Change
              </button>
            )}
            {onRemove && (
              <button
                className="remove"
                aria-label="Remove battery"
                onClick={onRemove}
              >
                Remove
              </button>
            )}
          </span>
        )}
      </div>
      <div className="battery-main">
        <BatteryGauge
          units={units}
          muted={state === 'expired' || state === 'cancelled'}
        />
        <div style={{ minWidth: 0 }}>
          <div className="battery-amount">{batteryPercent(units)}% battery</div>
          <div className="battery-use">{describeBatteryUse(units)}</div>
        </div>
      </div>
      {state === 'pending' && (
        <div className="battery-expiry" data-state="pending">
          <Icon icon="hourglass-half" />
          <span>Expires {when}</span>
        </div>
      )}
      {state === 'received' && (
        <div className="battery-expiry" data-state="used">
          <Icon icon="bolt" />
          <span>
            {expiresAt * 1000 > nowMs
              ? `Added to your AI Energy · lasts until ${when}`
              : 'Added to AI Energy for that day'}
          </span>
        </div>
      )}
      {state === 'expired' && (
        <div className="battery-expiry" data-state="expired">
          <Icon icon="hourglass-end" />
          <span>Not delivered</span>
        </div>
      )}
    </div>
  );
}
