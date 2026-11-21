import React, { useId } from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import AssetList from '../../Trade/AssetList';
import { panelClass } from '../../Trade/styles';
import type { TradeBundle } from '../../Trade/types';
import BatteryAsset from '../../Trade/BatteryAsset';
import { batteryPercent } from '~/helpers/battery';

const editorClass = css`
  .coin-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.7rem;
    font-size: 1.2rem;
    font-weight: 700;
  }
  .battery-add {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    width: 100%;
    min-height: 4.4rem;
    border: 1px dashed #7fc8a4;
    border-radius: 0.8rem;
    background: #fff;
    color: #126b65;
    font-size: 1.3rem;
    font-weight: 700;
    cursor: pointer;
  }
  .battery-chosen .asset {
    padding: 1rem;
    border: 1px solid #e0e6ee;
    border-radius: 1rem;
  }
  .battery-chosen .asset-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.7rem;
    font-size: 1.1rem;
    color: #617087;
  }
  .battery-chosen .remove {
    border: 0;
    background: #f1f4f8;
    color: #536178;
    border-radius: 0.5rem;
    padding: 0.35rem 0.7rem;
    font-size: 1.1rem;
    cursor: pointer;
  }
  .balance {
    color: #67758a;
    font-weight: 400;
    font-size: 1.1rem;
  }
  .coin-field {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    background: #f7f9fc;
    border: 1px solid #d7e0eb;
    border-radius: 0.8rem;
    padding: 0 1rem;
  }
  .coin-field:focus-within {
    border-color: #3975c8;
    outline: 2px solid #d7e6fa;
  }
  .coin-field input {
    background: transparent;
    border: 0;
    outline: 0;
    font-size: 1.9rem;
    font-weight: 750;
    padding: 1rem 0;
    width: 100%;
    min-width: 0;
    color: #25364f;
    font-variant-numeric: tabular-nums;
  }
  .coin-field small {
    font-size: 1.2rem;
    color: #67758a;
  }
  .coin-error {
    color: #a12235;
    font-size: 1.2rem;
    margin: 0.6rem 0 0;
  }
  .add-label {
    margin: 1.7rem 0 0.7rem;
    font-size: 1.2rem;
    font-weight: 700;
  }
  .add-buttons {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.7rem;
    margin-bottom: 1.2rem;
  }
  .add-buttons button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    min-height: 4rem;
    padding: 0.7rem 0.4rem;
    border: 1px solid #d4deeb;
    border-radius: 0.8rem;
    background: #fff;
    color: #325681;
    font-size: 1.2rem;
    font-weight: 700;
    cursor: pointer;
    transition:
      background 120ms ease,
      border-color 120ms ease;
  }
  .add-buttons button:hover {
    background: #edf4fe;
    border-color: #7da5d9;
  }
`;

export default function OfferEditor({
  side,
  partnerName,
  bundle,
  coinInput,
  coinError,
  balance,
  showcase,
  showOwnership = true,
  groupObjs,
  onCoinChange,
  onChoose,
  onRemove,
  onInspectCard,
  battery,
  onChooseBattery,
  onRemoveBattery
}: {
  side: 'give' | 'receive';
  partnerName: string;
  bundle: TradeBundle;
  coinInput: string;
  coinError: string;
  balance?: number;
  showcase?: boolean;
  showOwnership?: boolean;
  groupObjs: Record<number, any>;
  onCoinChange: (value: string) => void;
  onChoose: (kind: 'card' | 'group' | 'app') => void;
  onRemove: (kind: 'card' | 'group' | 'app', id: number) => void;
  onInspectCard: (id: number) => void;
  // null while battery trading is off: the editor shows no battery row
  battery?: {
    units: number;
    giveableUnits?: number;
    expiresAt: number;
    unavailableMessage?: string;
  } | null;
  onChooseBattery?: () => void;
  onRemoveBattery?: () => void;
}) {
  const fieldId = useId();
  const title = showcase
    ? 'You show'
    : side === 'give'
      ? 'You give'
      : 'You receive';
  const count =
    bundle.cardIds.length + bundle.groupIds.length + bundle.builds.length;
  return (
    <section
      className={`${panelClass} ${editorClass}`}
      data-side={side}
      aria-label={title}
    >
      <header>
        <span className="direction">
          <Icon
            icon={
              showcase ? 'eye' : side === 'give' ? 'arrow-up' : 'arrow-down'
            }
          />
        </span>
        <div>
          <h3>{title}</h3>
          <div className="partner">
            {showcase
              ? 'Only a showcase · you keep everything'
              : `${side === 'give' ? 'To' : 'From'} ${partnerName}`}
          </div>
        </div>
      </header>
      <div className="inventory">
        <div className="coin-label">
          <label htmlFor={fieldId}>Coins {title.toLowerCase()}</label>
          {balance !== undefined && (
            <span className="balance">
              Balance: {Number(balance).toLocaleString('en-US')}
            </span>
          )}
        </div>
        <div className="coin-field">
          <Icon icon="coins" />
          <input
            id={fieldId}
            inputMode="numeric"
            value={coinInput}
            placeholder="0"
            aria-invalid={!!coinError}
            aria-describedby={coinError ? `${fieldId}-error` : undefined}
            onChange={(e) => onCoinChange(e.target.value)}
          />
          <small>coins</small>
        </div>
        {coinError && (
          <p id={`${fieldId}-error`} className="coin-error" role="alert">
            {coinError}
          </p>
        )}
        {!showcase && battery && (
          <>
            <div className="coin-label" style={{ marginTop: '1.6rem' }}>
              <span>Battery {title.toLowerCase()}</span>
              {side === 'give' && battery.giveableUnits !== undefined && (
                <span className="balance">
                  You can give {batteryPercent(battery.giveableUnits)}% today
                </span>
              )}
            </div>
            {battery.units ? (
              <div className="battery-chosen">
                <BatteryAsset
                  units={battery.units}
                  expiresAt={battery.expiresAt}
                  nowMs={Date.now()}
                  onEdit={battery.unavailableMessage ? undefined : onChooseBattery}
                  onRemove={onRemoveBattery}
                />
              </div>
            ) : battery.unavailableMessage ? (
              <p className="coin-error">{battery.unavailableMessage}</p>
            ) : (
              <button className="battery-add" onClick={onChooseBattery}>
                <Icon icon="bolt" />
                Add battery <span aria-hidden="true">+</span>
              </button>
            )}
          </>
        )}
        <p className="add-label">Items {count > 0 && `(${count})`}</p>
        <div className="add-buttons">
          <button onClick={() => onChoose('card')}>
            <Icon icon="cards-blank" />
            Cards <span aria-hidden="true">+</span>
          </button>
          <button onClick={() => onChoose('group')}>
            <Icon icon="users" />
            Groups <span aria-hidden="true">+</span>
          </button>
          <button onClick={() => onChoose('app')}>
            <Icon icon="laptop-code" />
            Apps <span aria-hidden="true">+</span>
          </button>
        </div>
        {count ? (
          <AssetList
            bundle={bundle}
            groupObjs={groupObjs}
            onInspectCard={onInspectCard}
            onRemove={onRemove}
            showCoins={false}
            showBattery={false}
            showOwnership={!showcase && showOwnership}
          />
        ) : (
          <div className="empty">
            <strong>No items added</strong>Add cards, groups or Lumine apps.
            <br />
            You can mix all three.
          </div>
        )}
      </div>
    </section>
  );
}
