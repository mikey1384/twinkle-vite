import React, { useState } from 'react';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import Icon from '~/components/Icon';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import { useRoleColor } from '~/theme/useRoleColor';
import AiEnergyDashboardModal from '~/containers/Chat/RightMenu/ChatInfo/AIChatMenu/AiEnergyDashboardModal';

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
  cardRef,
  themeColor
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
  themeColor?: string;
}) {
  const [aiEnergyDashboardModalShown, setAiEnergyDashboardModalShown] =
    useState(false);
  const modeBadgeRole = useRoleColor('button', {
    themeName: themeColor,
    fallback: themeColor || 'logoBlue'
  });
  const segments = Math.max(1, energySegments);
  const rawPercent = Math.max(0, Math.min(100, energyPercent));
  const percent = Math.round(rawPercent);
  const ratio = rawPercent / 100;
  const visualSegmentFill = ratio * segments;
  const tone = ratio >= 0.6 ? 'green' : ratio >= 0.3 ? 'gold' : 'red';
  const fill = TONE[tone];
  const modeLabel = mode
    ? mode === 'low_energy'
      ? 'Lite Mode'
      : 'Max Mode'
    : '';
  const statusLabel = [modeLabel, overflowed ? 'extra used' : '']
    .filter(Boolean)
    .join(' · ');
  const hasEnoughCoins = twinkleCoins >= resetCost;
  const showRequirements = !!(
    communityFundsRequirements && communityFundsRequirements.length > 0
  );
  const themedModeBadgeStyle = {
    '--energy-mode-bg': modeBadgeRole.getColor(0.92),
    '--energy-mode-border': modeBadgeRole.getColor(),
    '--energy-mode-shadow': modeBadgeRole.getColor(0.36)
  } as React.CSSProperties;
  const lowEnergyModeBadgeStyle = {
    '--energy-mode-bg': TONE.gold.flat,
    '--energy-mode-border': TONE.gold.border,
    '--energy-mode-shadow': TONE.gold.shadow
  } as React.CSSProperties;
  const modeBadgeStyle =
    mode === 'low_energy' ? lowEnergyModeBadgeStyle : themedModeBadgeStyle;
  const themedCardStyle = {
    '--energy-card-border': modeBadgeRole.getColor(0.3),
    '--energy-card-bg': modeBadgeRole.getColor(0.035),
    '--energy-card-shadow': modeBadgeRole.getColor(0.12),
    '--energy-badge-bg': 'rgba(255, 251, 235, 0.95)',
    '--energy-badge-border': 'rgba(245, 158, 11, 0.42)',
    '--energy-badge-shadow': 'rgba(180, 83, 9, 0.18)',
    '--energy-badge-hover-bg': '#fff7d6',
    '--energy-bolt-color': '#f59e0b'
  } as React.CSSProperties;

  const isInline = variant === 'inline';
  const wrapperCls = isInline ? inlineCls : cardCls;
  const cellsClass = isInline ? cellsFlatCls : cellsCls;
  const cellClass = isInline ? cellFlatCls : cellCls;
  const energyCells = Array.from({ length: segments }).map((_, index) => {
    const fillRatio = Math.max(0, Math.min(1, visualSegmentFill - index));
    const filled = fillRatio > 0;
    const fillWidth = `${fillRatio * 100}%`;
    if (isInline) {
      return (
        <div
          key={index}
          className={cellClass}
          style={{
            background: EMPTY_FLAT
          }}
        >
          {filled && (
            <span
              className={cellFlatFillCls}
              style={{
                width: fillWidth,
                background: fill.flat
              }}
            />
          )}
        </div>
      );
    }
    return (
      <div
        key={index}
        className={cellClass}
        style={{
          background: EMPTY_BG,
          borderColor: filled ? fill.border : EMPTY_BORDER,
          boxShadow: filled
            ? `0 2px 0 ${fill.shadow}, inset 0 1px 0 rgba(255,255,255,0.4)`
            : 'inset 0 1px 2px rgba(0,0,0,0.06)'
        }}
      >
        {filled && (
          <span
            className={cellFillCls}
            style={{
              width: fillWidth,
              background: fill.bg
            }}
          />
        )}
      </div>
    );
  });
  const meter = (
    <div
      className={cellsClass}
      role="meter"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Energy ${percent}%`}
    >
      {energyCells}
    </div>
  );

  return (
    <>
      <div
        ref={cardRef}
        className={`${wrapperCls} ${className ?? ''}`}
        style={{ ...themedCardStyle, ...style }}
      >
        {isInline ? (
          <div className={inlineRowCls}>
            <button
              type="button"
              className={`${energyBadgeCls} ${inlineTitleCls}`}
              onClick={() => setAiEnergyDashboardModalShown(true)}
              title="Open AI Energy dashboard"
            >
              <Icon icon="bolt" className={boltCls} />
              {statusLabel && (
                <span className={inlineTitleTextCls}>Energy</span>
              )}
            </button>
            <div className={inlineMeterWrapCls}>
              {meter}
              <span className={inlinePercentCls}>{percent}%</span>
            </div>
            {statusLabel && (
              <span className={inlineModeCls} style={modeBadgeStyle}>
                {statusLabel}
              </span>
            )}
          </div>
        ) : (
          <>
            <div className={headerCls}>
              <button
                type="button"
                className={`${energyBadgeCls} ${titleCls}`}
                onClick={() => setAiEnergyDashboardModalShown(true)}
                title="Open AI Energy dashboard"
              >
                <Icon icon="bolt" className={boltCls} />
                <span>Energy</span>
              </button>
              <div className={statusCls}>
                <span className={percentCls} data-tone={tone}>
                  {percent}%
                </span>
                {statusLabel && (
                  <span className={modeCls} style={modeBadgeStyle}>
                    {statusLabel}
                  </span>
                )}
              </div>
            </div>
            {meter}
          </>
        )}

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
      {aiEnergyDashboardModalShown && (
        <AiEnergyDashboardModal
          modalLevel={3}
          onHide={() => setAiEnergyDashboardModalShown(false)}
        />
      )}
    </>
  );
}

const cardCls = css`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding: 0.7rem 0.9rem 0.8rem;
  border: 1px solid var(--energy-card-border);
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 1px 0 var(--energy-card-shadow);
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
  gap: 0.35rem;
  padding: 0;
  background: transparent;
  border: none;
  font-size: 1.15rem;
  color: ${Color.darkerGray()};

  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.05rem;
  }
`;

const inlineRowCls = css`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  width: 100%;
  min-height: 2rem;
`;

const inlineTitleCls = css`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;
  font-weight: 800;
  color: ${Color.darkerGray()};
  white-space: nowrap;
`;

const energyBadgeCls = css`
  appearance: none;
  border: 1px solid var(--energy-badge-border);
  border-radius: 6px;
  background: var(--energy-badge-bg);
  box-shadow: 0 2px 0 var(--energy-badge-shadow);
  padding: 0.25rem 0.5rem;
  font: inherit;
  cursor: pointer;
  transition:
    transform 120ms ease,
    box-shadow 120ms ease,
    background-color 120ms ease;

  &:hover {
    background: var(--energy-badge-hover-bg);
    box-shadow: 0 3px 0 var(--energy-badge-shadow);
    transform: translateY(-1px);
  }

  &:active {
    box-shadow: 0 1px 0 var(--energy-badge-shadow);
    transform: translateY(1px);
  }
`;

const inlineTitleTextCls = css`
  @media (max-width: ${mobileMaxWidth}) {
    display: none;
  }
`;

const inlineMeterWrapCls = css`
  position: relative;
  display: flex;
  align-items: center;
  flex: 1 1 auto;
  min-width: 8rem;
`;

const inlinePercentCls = css`
  position: absolute;
  top: 50%;
  left: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 3.2rem;
  padding: 0.15rem 0.45rem;
  transform: translate(-50%, -50%);
  border-radius: 6px;
  background: rgba(17, 24, 39, 0.35);
  color: #fff;
  font-size: 1rem;
  font-weight: 800;
  line-height: 1;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
  pointer-events: none;
  white-space: nowrap;
`;

const inlineModeCls = css`
  flex-shrink: 0;
  padding: 0.2rem 0.5rem;
  border: 1px solid var(--energy-mode-border);
  border-radius: 6px;
  background: var(--energy-mode-bg);
  box-shadow: 0 2px 0 var(--energy-mode-shadow);
  color: #fff;
  font-size: 1em;
  font-weight: 900;
  line-height: 1;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.28);
  white-space: nowrap;
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
  letter-spacing: 0;
  color: ${Color.darkerGray()};
`;

const boltCls = css`
  color: var(--energy-bolt-color);
  filter: drop-shadow(0 1px 0 var(--energy-badge-shadow));
`;

const statusCls = css`
  display: inline-flex;
  align-items: center;
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
  padding: 0.18rem 0.45rem;
  border: 1px solid var(--energy-mode-border);
  border-radius: 6px;
  background: var(--energy-mode-bg);
  box-shadow: 0 2px 0 var(--energy-mode-shadow);
  color: #fff;
  font-size: 1em;
  font-weight: 900;
  line-height: 1;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.28);
  white-space: nowrap;
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
  background-clip: padding-box;
  transition: background 0.2s ease, border-color 0.2s ease,
    box-shadow 0.2s ease;
`;

const cellFillCls = css`
  position: absolute;
  top: -2px;
  bottom: -2px;
  left: 0;
  border-radius: 6px;
  transition: width 0.2s ease;
`;

const cellsFlatCls = css`
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  gap: 0.3rem;
  width: 100%;
  height: 1.6rem;
`;

const cellFlatCls = css`
  position: relative;
  overflow: hidden;
  border-radius: 3px;
  transition: background 0.2s ease;
`;

const cellFlatFillCls = css`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  border-radius: inherit;
  transition: width 0.2s ease;
`;

const rechargeSectionCls = css`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-top: 0.2rem;
`;

const rechargeMessageCls = css`
  font-size: 1em;
  line-height: 1.45;
  opacity: 0.85;
`;

const requirementsListCls = css`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 1em;
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
  font-size: 1em;
  font-weight: 700;
  color: ${Color.rose()};
`;
