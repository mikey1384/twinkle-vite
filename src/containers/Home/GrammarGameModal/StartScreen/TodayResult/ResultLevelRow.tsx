import React from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { mobileMaxWidth } from '~/constants/css';

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
    grid-template-columns: 7.5rem calc(30rem + 0.9rem) 8rem;
    align-items: center;
    gap: 1rem;
    margin: 0.6rem 0;
    @media (max-width: 900px) {
      grid-template-columns: 6.2rem 24rem 7.5rem;
    }
    @media (max-width: ${mobileMaxWidth}) {
      grid-template-columns: 6rem 1fr;
      grid-template-rows: auto auto;
      row-gap: 0.35rem;
    }
  `;

  const marblesRowCls = css`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding-left: 0.25rem;
    padding-right: 1rem;
    @media (max-width: ${mobileMaxWidth}) {
      padding-right: 0.5rem;
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
    font-weight: 900;
    letter-spacing: 0.3px;
    pointer-events: none;
    z-index: 1;
    color: #ffffff;
    padding: 0.2rem 0.6rem;
    line-height: 1.1;
    border-radius: 9999px;
    border: 2px solid transparent;
    box-shadow: 0 2px 0 rgba(0, 0, 0, 0.25);
    text-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
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
    box-shadow: 0 2px 0 #c4890a;
  `;

  const levelTitleBaseCls = css`
    font-weight: 900;
    letter-spacing: 0.6px;
    font-size: 1.2rem;
    justify-self: center;
    @media (max-width: ${mobileMaxWidth}) {
      display: none;
    }
  `;

  const getLevelLabelColor = (level: number) => {
    switch (level) {
      case 1:
        return '#418CEB';
      case 2:
        return '#F3677B';
      case 3:
        return '#FF9A00';
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
    display: grid;
    grid-template-columns: 1.1rem auto 1.1rem;
    align-items: center;
    justify-items: center;
    column-gap: 0.3rem;
    padding: 0.25rem 0.6rem;
    border-radius: 9999px;
    font-weight: 700;
    font-size: 0.85rem;
    color: #fff;
    @media (max-width: ${mobileMaxWidth}) {
      grid-column: 1;
      grid-row: 2;
      justify-self: start;
      margin-left: 0;
    }
    ${s === 'cleared'
      ? `background: #22c55e; border: 2px solid #16a34a; box-shadow: 0 2px 0 #15803d;`
      : s === 'next'
      ? `background: #ffcb32; border: 2px solid #e3a40f; box-shadow: 0 2px 0 #c4890a; color: #1a1a1a;`
      : s === 'failed'
      ? `background: #ef4444; border: 2px solid #dc2626; box-shadow: 0 2px 0 #b91c1c;`
      : `background: #94a3b8; border: 2px solid #64748b; box-shadow: 0 2px 0 #475569;`};
    & > :first-child {
      grid-column: 1;
    }
    &::after {
      content: '';
      grid-column: 3;
      width: 1.1rem;
      height: 1rem;
    }
  `;

  const badgeTextCls = css`
    grid-column: 2;
    display: inline-flex;
    align-items: center;
    white-space: nowrap;
  `;

  const marblesInnerCls = css`
    display: inline-flex;
    align-items: center;
    gap: 0.1rem;
  `;

  const getRowDimCls = (dim: boolean) =>
    css`
      ${dim ? 'filter: grayscale(0.25) brightness(0.85);' : ''}
    `;

  return (
    <div className={levelRowCls}>
      <span
        className={levelTitleBaseCls}
        style={{ color: getLevelLabelColor(levelNumber) }}
      >
        {`lvl ${levelNumber}`}
      </span>
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
                  font-weight: 900;
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
