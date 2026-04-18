import React from 'react';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import Icon from '~/components/Icon';
import GameCTAButton from '~/components/Buttons/GameCTAButton';

interface CommunityFundRequirement {
  key: string;
  label: string;
  done: boolean;
  current?: number;
  required?: number;
}

const TONE = {
  green: {
    bg: 'linear-gradient(180deg, #4ade80 0%, #22c55e 100%)',
    border: '#15803d',
    shadow: '#166534',
    flat: '#22c55e'
  },
  gold: {
    bg: 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)',
    border: '#b45309',
    shadow: '#92400e',
    flat: '#f59e0b'
  },
  red: {
    bg: 'linear-gradient(180deg, #fb7185 0%, #e11d48 100%)',
    border: '#9f1239',
    shadow: '#881337',
    flat: '#e11d48'
  }
} as const;

const EMPTY_BG = 'rgba(148,163,184,0.18)';
const EMPTY_BORDER = 'rgba(148,163,184,0.4)';
const EMPTY_FLAT = 'rgba(148,163,184,0.22)';

export default function AiEnergyCard({
  energyPercent,
  energySegments = 5,
  energySegmentsRemaining,
  mode,
  overflowed = false,
  resetNeeded = false,
  resetCost = 0,
  resetPurchaseNumber,
  twinkleCoins = 0,
  rechargeLoading = false,
  rechargeError,
  onRecharge,
  communityFundsEligible = false,
  communityFundsRequirements,
  onRechargeWithCommunityFunds,
  variant = 'standalone',
  className,
  style,
  cardRef
}: {
  energyPercent: number;
  energySegments?: number;
  energySegmentsRemaining?: number;
  mode?: 'full_quality' | 'low_energy';
  overflowed?: boolean;
  resetNeeded?: boolean;
  resetCost?: number;
  resetPurchaseNumber?: number;
  twinkleCoins?: number;
  rechargeLoading?: boolean;
  rechargeError?: string;
  onRecharge?: () => void;
  communityFundsEligible?: boolean;
  communityFundsRequirements?: CommunityFundRequirement[];
  onRechargeWithCommunityFunds?: () => void;
  variant?: 'standalone' | 'inline';
  className?: string;
  style?: React.CSSProperties;
  cardRef?: React.Ref<HTMLDivElement>;
}) {
  const segments = Math.max(1, energySegments);
  const remaining = Math.max(
    0,
    Math.min(
      segments,
      energySegmentsRemaining ?? Math.ceil((energyPercent / 100) * segments)
    )
  );
  const percent = Math.max(0, Math.min(100, Math.round(energyPercent)));
  const ratio = remaining / segments;
  const tone = ratio >= 0.6 ? 'green' : ratio >= 0.3 ? 'gold' : 'red';
  const fill = TONE[tone];
  const modeLabel = mode
    ? mode === 'low_energy'
      ? 'Low-energy'
      : 'Full-quality'
    : '';
  const statusLabel = [modeLabel, overflowed ? 'extra used' : '']
    .filter(Boolean)
    .join(' · ');
  const hasEnoughCoins = twinkleCoins >= resetCost;
  const showRequirements = !!(
    communityFundsRequirements && communityFundsRequirements.length > 0
  );

  const isInline = variant === 'inline';
  const wrapperCls = isInline ? inlineCls : cardCls;
  const cellsClass = isInline ? cellsFlatCls : cellsCls;
  const cellClass = isInline ? cellFlatCls : cellCls;

  return (
    <div ref={cardRef} className={`${wrapperCls} ${className ?? ''}`} style={style}>
      <div className={headerCls}>
        <div className={titleCls}>
          <Icon icon="bolt" className={boltCls} />
          <span>AI Energy</span>
        </div>
        <div className={statusCls}>
          <span className={percentCls} data-tone={tone}>
            {percent}%
          </span>
          {statusLabel && <span className={modeCls}>· {statusLabel}</span>}
        </div>
      </div>

      <div
        className={cellsClass}
        role="meter"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`AI Energy ${percent}%`}
      >
        {Array.from({ length: segments }).map((_, index) => {
          const filled = index < remaining;
          if (isInline) {
            return (
              <div
                key={index}
                className={cellClass}
                style={{
                  background: filled ? fill.flat : EMPTY_FLAT
                }}
              />
            );
          }
          return (
            <div
              key={index}
              className={cellClass}
              style={{
                background: filled ? fill.bg : EMPTY_BG,
                borderColor: filled ? fill.border : EMPTY_BORDER,
                boxShadow: filled
                  ? `0 2px 0 ${fill.shadow}, inset 0 1px 0 rgba(255,255,255,0.4)`
                  : 'inset 0 1px 2px rgba(0,0,0,0.06)'
              }}
            />
          );
        })}
      </div>

      {resetNeeded && (
        <div className={rechargeSectionCls}>
          <div className={rechargeMessageCls}>
            {resetPurchaseNumber
              ? `Battery is empty. Recharge #${resetPurchaseNumber} restores one full battery for today.`
              : 'Battery is empty. Recharge to restore one full battery for today.'}
          </div>
          {onRecharge && (
            <GameCTAButton
              icon="bolt"
              variant="orange"
              shiny
              loading={rechargeLoading}
              disabled={rechargeLoading || !hasEnoughCoins}
              onClick={onRecharge}
            >
              {hasEnoughCoins
                ? `Recharge (${resetCost.toLocaleString()} coins)`
                : `Need ${resetCost.toLocaleString()} coins (you have ${twinkleCoins.toLocaleString()})`}
            </GameCTAButton>
          )}
          {showRequirements && (
            <div className={requirementsListCls}>
              {communityFundsRequirements!.map((req) => (
                <div
                  key={req.key}
                  className={requirementRowCls}
                  data-done={req.done}
                >
                  <Icon icon={req.done ? 'check' : 'times'} />
                  <span>
                    {req.label}
                    {typeof req.required === 'number'
                      ? ` (${req.current || 0}/${req.required})`
                      : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
          {onRechargeWithCommunityFunds && (
            <GameCTAButton
              icon="heart"
              variant="pink"
              loading={rechargeLoading}
              disabled={rechargeLoading || !communityFundsEligible}
              onClick={onRechargeWithCommunityFunds}
            >
              Use community funds
            </GameCTAButton>
          )}
          {rechargeError && <div className={errorCls}>{rechargeError}</div>}
        </div>
      )}
    </div>
  );
}

const cardCls = css`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding: 0.7rem 0.9rem 0.8rem;
  border: 2px solid ${Color.borderGray()};
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.04);
  font-size: 1.2rem;
  color: ${Color.darkerGray()};

  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.1rem;
    padding: 0.6rem 0.75rem 0.7rem;
  }
`;

const inlineCls = css`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0;
  background: transparent;
  border: none;
  font-size: 1.15rem;
  color: ${Color.darkerGray()};

  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.05rem;
  }
`;

const headerCls = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  flex-wrap: wrap;
`;

const titleCls = css`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-weight: 800;
  letter-spacing: 0.2px;
  color: ${Color.darkerGray()};
`;

const boltCls = css`
  color: #f59e0b;
  filter: drop-shadow(0 1px 0 rgba(180, 83, 9, 0.45));
`;

const statusCls = css`
  display: inline-flex;
  align-items: baseline;
  gap: 0.35rem;
  font-weight: 600;
`;

const percentCls = css`
  font-weight: 800;
  font-size: 1.25em;
  &[data-tone='green'] {
    color: #15803d;
  }
  &[data-tone='gold'] {
    color: #b45309;
  }
  &[data-tone='red'] {
    color: #9f1239;
  }
`;

const modeCls = css`
  opacity: 0.75;
  font-size: 0.95em;
`;

const cellsCls = css`
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  gap: 0.4rem;
  height: 1.8rem;
`;

const cellCls = css`
  position: relative;
  overflow: hidden;
  border-radius: 6px;
  border: 2px solid;
  transition: background 0.2s ease, border-color 0.2s ease,
    box-shadow 0.2s ease;
`;

const cellsFlatCls = css`
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  gap: 0.3rem;
  height: 1rem;
`;

const cellFlatCls = css`
  border-radius: 3px;
  transition: background 0.2s ease;
`;

const rechargeSectionCls = css`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-top: 0.2rem;
`;

const rechargeMessageCls = css`
  font-size: 0.95em;
  line-height: 1.45;
  opacity: 0.85;
`;

const requirementsListCls = css`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.95em;
`;

const requirementRowCls = css`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: ${Color.darkerGray()};
  &[data-done='true'] {
    color: ${Color.green()};
  }
`;

const errorCls = css`
  font-size: 0.95em;
  font-weight: 700;
  color: ${Color.rose()};
`;
