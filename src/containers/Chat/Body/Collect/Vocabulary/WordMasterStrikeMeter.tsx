import React from 'react';
import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { WORD_MASTER_BREAK_INTERVAL } from '~/constants/defaultValues';

interface WordMasterStrikeMeterProps {
  breakStatus?: {
    queueCount?: number;
    breakCount?: number;
    breakInterval?: number;
    activeBreakIndex?: number;
    blocked?: boolean;
    locked?: boolean;
  } | null;
  loading?: boolean;
  onOpenBreaks?: () => void;
  variant?: 'card' | 'panel';
  style?: React.CSSProperties;
}

export default function WordMasterStrikeMeter({
  breakStatus,
  loading,
  onOpenBreaks,
  variant = 'card',
  style
}: WordMasterStrikeMeterProps) {
  const breakInterval =
    breakStatus?.breakInterval || WORD_MASTER_BREAK_INTERVAL;
  const queueCount = getSafeCount(breakStatus?.queueCount);
  const activeBreakIndex = getSafeCount(breakStatus?.activeBreakIndex);
  const isLocked = Boolean(breakStatus?.locked);
  const isBlocked = Boolean(breakStatus?.blocked);
  const isLoading = Boolean(loading) && !breakStatus;
  const isInteractive = Boolean(onOpenBreaks);
  const isPanel = variant === 'panel';

  const progressCount = queueCount % breakInterval;
  const currentStrikes =
    progressCount === 0 && queueCount > 0 && activeBreakIndex > 0
      ? breakInterval
      : progressCount;
  const progressPct = Math.min(
    100,
    Math.max(0, (currentStrikes / breakInterval) * 100)
  );

  const statusLabel = isLocked
    ? 'Locked today'
    : activeBreakIndex > 0
    ? `Break ${activeBreakIndex} active`
    : 'All clear';
  const statusTone = isLocked
    ? 'rose'
    : activeBreakIndex > 0
    ? 'orange'
    : 'green';
  const nextBreakNumber =
    activeBreakIndex > 0
      ? activeBreakIndex
      : Math.floor(queueCount / breakInterval) + 1;
  const breakLabel = `Break ${nextBreakNumber}`;
  const titleLabel = isPanel ? 'Strikes' : 'Strikes Today';
  const countLabel = isPanel ? 'strikes' : 'current strikes';

  return (
    <section
      className={`${wrapperCls} ${isPanel ? panelWrapperCls : ''}`}
      style={style}
    >
      <div className={`${cardCls} ${isPanel ? panelCardCls : ''}`}>
        <div className={`${headerCls} ${isPanel ? panelHeaderCls : ''}`}>
          {!isPanel && (
            <div className={`${titleCls} ${isPanel ? panelTitleCls : ''}`}>
              {titleLabel}
            </div>
          )}
          <div className={`${pillRowCls} ${isPanel ? panelPillRowCls : ''}`}>
            <span
              className={`${pillBaseCls} ${isPanel ? panelPillBaseCls : ''}`}
              style={getStatusPillStyle(statusTone)}
            >
              {isLoading ? 'Checking...' : statusLabel}
            </span>
          </div>
        </div>
        <div className={`${contentCls} ${isPanel ? panelContentCls : ''}`}>
          <div
            className={`${countBlockCls} ${isPanel ? panelCountBlockCls : ''}`}
          >
            <div className={`${countCls} ${isPanel ? panelCountCls : ''}`}>
              {isLoading ? '...' : formatCount(currentStrikes)}
            </div>
            <div
              className={`${countLabelCls} ${
                isPanel ? panelCountLabelCls : ''
              }`}
            >
              {countLabel}
            </div>
          </div>
          <div className={progressBlockCls}>
            <div
              className={css`
                display: flex;
                align-items: center;
                gap: 0.8rem;
              `}
            >
              <div
                className={css`
                  flex: 1;
                  display: flex;
                  flex-direction: column;
                  gap: 0.35rem;
                `}
              >
                <div
                  className={`${progressMetaCls} ${isPanel ? panelMetaCls : ''}`}
                >
                  <span>
                    {isLoading
                      ? `--/${breakInterval}`
                      : `${currentStrikes}/${breakInterval}`}
                  </span>
                  <span>{isLoading ? 'Break ...' : breakLabel}</span>
                </div>
                <div
                  className={`${barTrackCls} ${isPanel ? panelBarTrackCls : ''}`}
                >
                  <div
                    className={barFillCls}
                    style={{
                      width: `${isLoading ? 0 : progressPct}%`,
                      background: getBarBackground(isLoading ? 0 : progressPct)
                    }}
                  />
                  <div
                    className={`${barTicksCls} ${isPanel ? panelBarTicksCls : ''}`}
                  />
                </div>
              </div>
              {isInteractive && (
                <button
                  type="button"
                  className={`${actionHintCls} ${
                    isPanel ? panelActionHintCls : ''
                  }`}
                  onClick={handleOpenBreaks}
                  aria-label="View word master break requirements"
                >
                  <span className={desktopOnlyCls}>View breaks</span>
                  <span className={mobileOnlyCls}>View</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      {isBlocked && !isLocked && !isPanel && (
        <div className={blockedNoteCls}>
          Clear the active break to keep collecting words.
        </div>
      )}
    </section>
  );

  function handleOpenBreaks() {
    if (!onOpenBreaks) return;
    onOpenBreaks();
  }
}

function getSafeCount(value?: number) {
  const parsed = Number(value || 0);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

function formatCount(value: number) {
  return value.toLocaleString('en-US');
}

function getStatusPillStyle(
  tone: 'rose' | 'orange' | 'green'
): React.CSSProperties {
  if (tone === 'rose') {
    return {
      color: Color.rose(),
      background: Color.rose(0.12),
      borderColor: Color.rose(0.24)
    };
  }
  if (tone === 'orange') {
    return {
      color: Color.orange(),
      background: Color.orange(0.12),
      borderColor: Color.orange(0.24)
    };
  }
  return {
    color: Color.green(),
    background: Color.green(0.12),
    borderColor: Color.green(0.24)
  };
}

const wrapperCls = css`
  width: 100%;
  margin-bottom: 1rem;
`;

const panelWrapperCls = css`
  margin-bottom: 0;
  height: 100%;
`;

const cardCls = css`
  width: 100%;
  border-radius: ${borderRadius};
  border: 1px solid ${Color.borderGray()};
  background: linear-gradient(
    180deg,
    ${Color.white()} 0%,
    ${Color.whiteGray()} 100%
  );
  padding: 1.2rem 1.6rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.06);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(
      90deg,
      ${Color.logoBlue()} 0%,
      ${Color.lightOceanBlue()} 45%,
      ${Color.lightBlue()} 100%
    );
  }

  @media (max-width: ${mobileMaxWidth}) {
    padding: 1.2rem;
    gap: 0.8rem;
  }
`;

const panelCardCls = css`
  height: 100%;
  padding: 0;
  gap: 0.6rem;
  border: none;
  background: transparent;
  box-shadow: none;
  overflow: visible;

  &::before {
    display: none;
  }

  @media (max-width: ${mobileMaxWidth}) {
    gap: 0.45rem;
  }
`;

const headerCls = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
`;

const panelHeaderCls = css`
  gap: 0.6rem;
`;

const titleCls = css`
  font-size: 1.1rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-weight: 700;
  color: ${Color.gray()};
`;

const panelTitleCls = css`
  font-size: 0.95rem;
  color: ${Color.white(0.72)};

  @media (max-width: ${mobileMaxWidth}) {
    font-size: 0.8rem;
    letter-spacing: 0.08em;
  }
`;

const pillRowCls = css`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
`;

const panelPillRowCls = css`
  gap: 0.4rem;
`;

const pillBaseCls = css`
  padding: 0.3rem 0.8rem;
  border-radius: 999px;
  font-size: 1.1rem;
  font-weight: 700;
  border: 1px solid transparent;
`;

const panelPillBaseCls = css`
  font-size: 1rem;
  padding: 0.25rem 0.7rem;

  @media (max-width: ${mobileMaxWidth}) {
    font-size: 0.8rem;
    padding: 0.2rem 0.55rem;
  }
`;

const contentCls = css`
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 1.2rem;
  align-items: center;

  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
    gap: 0.8rem;
  }
`;

const panelContentCls = css`
  grid-template-columns: 110px 1fr;
  gap: 0.8rem;

  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 60px 1fr;
    gap: 0.5rem;
  }
`;

const countBlockCls = css`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.2rem;
`;

const panelCountBlockCls = css`
  align-items: center;
  text-align: center;
`;

const countCls = css`
  font-size: 2.4rem;
  font-weight: 800;
  color: ${Color.darkerGray()};
`;

const panelCountCls = css`
  font-size: 2rem;
  color: ${Color.white(0.92)};

  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.6rem;
  }
`;

const countLabelCls = css`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${Color.gray()};
`;

const panelCountLabelCls = css`
  font-size: 1rem;
  color: ${Color.white(0.6)};

  @media (max-width: ${mobileMaxWidth}) {
    font-size: 0.9rem;
  }
`;

const progressBlockCls = css`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const progressMetaCls = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.1rem;
  color: ${Color.gray()};
  font-weight: 600;
  gap: 0.8rem;
`;

const panelMetaCls = css`
  font-size: 1rem;
  color: ${Color.white(0.65)};

  @media (max-width: ${mobileMaxWidth}) {
    font-size: 0.9rem;
  }
`;

const barTrackCls = css`
  position: relative;
  height: 0.9rem;
  border-radius: 999px;
  background: ${Color.extraLightGray()};
  overflow: hidden;
`;

const panelBarTrackCls = css`
  height: 0.6rem;
  background: ${Color.white(0.12)};

  @media (max-width: ${mobileMaxWidth}) {
    height: 0.5rem;
  }
`;

const barFillCls = css`
  height: 100%;
  transition: width 0.35s ease, background 0.35s ease;
`;

function getBarBackground(progressPct: number): string {
  if (progressPct < 40) {
    return `linear-gradient(90deg, ${Color.logoBlue()} 0%, ${Color.lightOceanBlue()} 100%)`;
  }
  if (progressPct < 70) {
    return `linear-gradient(90deg, ${Color.orange()} 0%, ${Color.gold()} 100%)`;
  }
  return `linear-gradient(90deg, ${Color.rose()} 0%, ${Color.orange()} 100%)`;
}

const barTicksCls = css`
  position: absolute;
  inset: 0;
  background-image: repeating-linear-gradient(
    to right,
    transparent 0,
    transparent calc(20% - 1px),
    ${Color.white(0.8)} calc(20% - 1px),
    ${Color.white(0.8)} 20%
  );
  opacity: 0.6;
  pointer-events: none;
`;

const panelBarTicksCls = css`
  opacity: 0.35;
`;

const actionHintCls = css`
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${Color.logoBlue()};
  font-weight: 700;
  transition: color 0.2s ease, text-shadow 0.2s ease;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;

  &:hover {
    color: ${Color.darkBlue()};
  }

  &:focus-visible {
    outline: 2px solid ${Color.logoBlue(0.35)};
    outline-offset: 2px;
  }
`;

const panelActionHintCls = css`
  color: ${Color.lightOceanBlue()};

  &:hover {
    color: ${Color.white()};
    text-shadow: 0 0 6px ${Color.lightOceanBlue(0.7)};
  }

  @media (max-width: ${mobileMaxWidth}) {
    font-size: 0.75rem;
  }
`;

const blockedNoteCls = css`
  margin-top: 0.4rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: ${Color.orange()};
  text-align: right;
`;

const desktopOnlyCls = css`
  @media (max-width: ${mobileMaxWidth}) {
    display: none;
  }
`;

const mobileOnlyCls = css`
  display: none;

  @media (max-width: ${mobileMaxWidth}) {
    display: inline;
  }
`;
