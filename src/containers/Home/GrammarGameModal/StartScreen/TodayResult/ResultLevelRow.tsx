import React from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { mobileMaxWidth } from '~/constants/css';
import { NEON, PIXEL_FONT, pulse, rgba } from '../../ClassicArcade/theme';

type LevelStatus = 'cleared' | 'next' | 'locked' | 'failed';

export default function ResultLevelRow({
  levelNumber,
  marbles,
  status,
  isActive,
  hasAnyScore,
  isPerfect,
  requiredScore,
  scoreToDisplay,
  deviceIsMobile,
  onToggleActive
}: {
  levelNumber: number;
  marbles: React.ReactNode[];
  status: LevelStatus;
  isActive: boolean;
  hasAnyScore: boolean;
  isPerfect: boolean;
  requiredScore: number;
  scoreToDisplay: number;
  deviceIsMobile: boolean;
  onToggleActive: () => void;
}) {
  const levelRowCls = css`
    display: grid;
    grid-template-columns: 7.5rem 32rem 9.5rem;
    align-items: center;
    gap: 1rem;
    margin: 0.7rem 0;
    @media (max-width: 900px) {
      grid-template-columns: 6.2rem 32rem 9rem;
    }
    @media (max-width: ${mobileMaxWidth}) {
      grid-template-columns: 7rem 1fr;
      grid-template-rows: auto auto;
      column-gap: 0.6rem;
      row-gap: 0.35rem;
    }
  `;

  // Each level is a glowing rail its marbles sit on; the level up next is
  // lit, locked ones are dark.
  const railGlow =
    status === 'next'
      ? NEON.cyanRgb
      : status === 'cleared'
        ? NEON.greenRgb
        : status === 'failed'
          ? NEON.redRgb
          : '140, 150, 210';
  const marblesRowCls = css`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 0.4rem 0.7rem;
    border-radius: 9999px;
    background: linear-gradient(
      180deg,
      rgba(10, 12, 46, 0.88) 0%,
      rgba(24, 16, 74, 0.88) 100%
    );
    border: 1px solid ${rgba(railGlow, status === 'locked' ? 0.22 : 0.6)};
    box-shadow:
      inset 0 0 12px rgba(0, 0, 0, 0.55),
      0 0 ${status === 'next' ? 16 : 8}px
        ${rgba(railGlow, status === 'next' ? 0.55 : status === 'locked' ? 0 : 0.28)};
    opacity: ${status === 'locked' ? 0.6 : 1};
    &::before {
      content: '';
      position: absolute;
      left: 0.8rem;
      right: 0.8rem;
      top: 50%;
      height: 2px;
      margin-top: -1px;
      border-radius: 2px;
      background: linear-gradient(
        90deg,
        transparent,
        ${rgba(railGlow, status === 'locked' ? 0.25 : 0.75)},
        transparent
      );
      pointer-events: none;
    }
    @media (max-width: ${mobileMaxWidth}) {
      padding: 0.35rem 0.4rem;
      grid-column: 2;
      grid-row: 1 / 3;
    }
    ${!deviceIsMobile ? `&:hover [data-overlay='1'] { opacity: 1; }` : ''}
  `;

  const overlayLabelBaseCls = css`
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    font-family: ${PIXEL_FONT};
    font-size: 1rem;
    white-space: nowrap;
    pointer-events: none;
    z-index: 1;
    color: #ffffff;
    padding: 0.45rem 0.8rem;
    line-height: 1.2;
    border-radius: 9999px;
    border: 2px solid transparent;
    box-shadow:
      0 2px 0 rgba(0, 0, 0, 0.35),
      0 0 12px rgba(0, 0, 0, 0.4);
    text-shadow: 0 1px 0 rgba(0, 0, 0, 0.45);
    opacity: 0;
    transition: opacity 150ms ease;
  `;

  const overlayPerfectCls = css`
    background-image: linear-gradient(
      90deg,
      #ffcb32 0%,
      #ffd564 50%,
      #ffcb32 100%
    );
    border-color: #e3a40f;
    color: #1a1a1a;
    text-shadow: none;
    box-shadow:
      0 2px 0 #c4890a,
      0 0 14px ${rgba(NEON.goldRgb, 0.7)};
  `;

  const levelTitleBaseCls = css`
    font-family: ${PIXEL_FONT};
    font-size: 1.1rem;
    line-height: 1.3;
    white-space: nowrap;
    justify-self: center;
    @media (max-width: ${mobileMaxWidth}) {
      display: none;
    }
  `;

  const levelBadgeBaseCls = css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.45rem 0.7rem;
    border-radius: 9999px;
    font-family: ${PIXEL_FONT};
    font-size: 1rem;
    line-height: 1.2;
    white-space: nowrap;
    color: #1a1a1a;
    border: 2px solid transparent;
    justify-self: center;
    @media (max-width: ${mobileMaxWidth}) {
      display: none;
    }
  `;

  const levelBadge4Cls = css`
    background-image: linear-gradient(
      90deg,
      #ec4899 0%,
      #f472b6 50%,
      #ec4899 100%
    );
    border-color: #ff8fd0;
    color: #fff;
    text-shadow: 0 1px 0 rgba(0, 0, 0, 0.35);
    box-shadow:
      0 2px 0 #be185d,
      0 0 12px rgba(236, 72, 153, 0.6);
  `;

  const levelBadge5Cls = css`
    background-image: linear-gradient(
      90deg,
      #ffcb32 0%,
      #ffd564 50%,
      #ffcb32 100%
    );
    border-color: #fff1b0;
    color: #1a1a1a;
    box-shadow:
      0 2px 0 #c4890a,
      0 0 12px ${rgba(NEON.goldRgb, 0.6)};
  `;

  const getLevelLabelColor = (level: number) => {
    switch (level) {
      case 1:
        return '#6fb0ff';
      case 2:
        return '#ff7d90';
      case 3:
        return '#ffa62b';
      case 4:
        return '#EC4899';
      case 5:
      default:
        return '#FFD564';
    }
  };

  const getOverlayBg = (s: LevelStatus) => {
    switch (s) {
      case 'cleared':
        return '#16a34a';
      case 'failed':
        return '#dc2626';
      case 'next':
        return '#f59e0b';
      case 'locked':
      default:
        return '#64748b';
    }
  };

  const getOverlayBorder = (s: LevelStatus) => {
    switch (s) {
      case 'cleared':
        return '#15803d';
      case 'failed':
        return '#b91c1c';
      case 'next':
        return '#d97706';
      case 'locked':
      default:
        return '#475569';
    }
  };

  const getStatusPillCls = (s: LevelStatus) => css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    justify-self: center;
    padding: 0.5rem 0.75rem;
    border-radius: 9999px;
    font-family: ${PIXEL_FONT};
    font-size: 0.8rem;
    line-height: 1.2;
    white-space: nowrap;
    color: #fff;
    text-shadow: 0 1px 0 rgba(0, 0, 0, 0.4);
    @media (max-width: ${mobileMaxWidth}) {
      grid-column: 1;
      grid-row: 2;
      justify-self: start;
      margin-left: 0;
      padding: 0.45rem 0.55rem;
      font-size: 0.75rem;
      gap: 0.35rem;
    }
    ${
      s === 'cleared'
        ? `background: #16a34a; border: 2px solid ${NEON.green}; box-shadow: 0 2px 0 #0f6b33, 0 0 10px ${rgba(NEON.greenRgb, 0.5)};`
        : s === 'next'
          ? `background: #ffcb32; border: 2px solid #fff1b0; box-shadow: 0 2px 0 #c4890a, 0 0 14px ${rgba(NEON.goldRgb, 0.75)}; color: #1a1a1a; text-shadow: none; animation: ${pulse} 1.4s ease-in-out infinite;`
          : s === 'failed'
            ? `background: #dc2626; border: 2px solid ${NEON.red}; box-shadow: 0 2px 0 #8f1515, 0 0 10px ${rgba(NEON.redRgb, 0.5)};`
            : `background: #3b4266; border: 2px solid #5a6390; box-shadow: 0 2px 0 #1e2240; color: #c3c9e6; text-shadow: none;`
    };
  `;

  const badgeTextCls = css`
    display: inline-flex;
    align-items: center;
    white-space: nowrap;
  `;

  const marblesInnerCls = css`
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 0.1rem;
    @media (max-width: ${mobileMaxWidth}) {
      gap: 0;
    }
  `;

  const getRowDimCls = (dim: boolean) => css`
    ${dim ? 'filter: grayscale(0.2) brightness(0.9);' : ''}
  `;

  return (
    <div className={levelRowCls}>
      {levelNumber >= 4 ? (
        <span
          className={`${levelBadgeBaseCls} ${
            levelNumber === 5 ? levelBadge5Cls : levelBadge4Cls
          }`}
        >
          {`lvl ${levelNumber}`}
        </span>
      ) : (
        <span
          className={levelTitleBaseCls}
          style={{
            color: getLevelLabelColor(levelNumber),
            textShadow: `0 0 8px ${getLevelLabelColor(levelNumber)}`
          }}
        >
          {`lvl ${levelNumber}`}
        </span>
      )}
      <div className={marblesRowCls} onClick={onToggleActive}>
        {hasAnyScore &&
          (isPerfect ? (
            <span
              className={`${overlayLabelBaseCls} ${overlayPerfectCls}`}
              data-overlay="1"
              style={{ opacity: deviceIsMobile && isActive ? 1 : undefined }}
            >
              {scoreToDisplay.toLocaleString()} / {requiredScore}
            </span>
          ) : (
            <span
              className={overlayLabelBaseCls}
              data-overlay="1"
              style={{
                opacity: deviceIsMobile && isActive ? 1 : undefined,
                background: getOverlayBg(status),
                borderColor: getOverlayBorder(status)
              }}
            >
              {scoreToDisplay.toLocaleString()} / {requiredScore}
            </span>
          ))}
        <div
          className={`${marblesInnerCls} ${getRowDimCls(status !== 'cleared')}`}
        >
          {marbles}
        </div>
      </div>
      {(() => (
        <span className={getStatusPillCls(status)}>
          <Icon
            icon={
              status === 'cleared'
                ? 'check'
                : status === 'next'
                  ? 'play'
                  : status === 'failed'
                    ? 'times'
                    : 'lock'
            }
          />
          <span className={badgeTextCls}>
            <span
              className={css`
                @media (max-width: ${mobileMaxWidth}) {
                  display: none;
                }
              `}
            >
              {status === 'cleared'
                ? 'Cleared'
                : status === 'next'
                  ? 'Next'
                  : status === 'failed'
                    ? 'Failed'
                    : 'Locked'}
            </span>
            <span
              className={css`
                display: none;
                @media (max-width: ${mobileMaxWidth}) {
                  display: inline;
                }
              `}
            >
              {`lvl ${levelNumber}`}
            </span>
          </span>
        </span>
      ))()}
    </div>
  );
}
