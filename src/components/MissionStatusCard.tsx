import React, { useMemo } from 'react';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { useRoleColor } from '~/theme/useRoleColor';

type MissionStatus = 'success' | 'fail' | 'info';

interface Rewards {
  xp?: number;
  coins?: number;
}

interface MissionStatusCardProps {
  status: MissionStatus;
  title: React.ReactNode;
  message?: React.ReactNode;
  rewards?: Rewards;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

const statusConfig: Record<
  MissionStatus,
  { icon: string; color: string; background: string }
> = {
  success: {
    icon: 'check-circle',
    color: Color.gold(),
    background: Color.gold(0.2)
  },
  fail: {
    icon: 'xmark',
    color: Color.rose(),
    background: Color.rose(0.12)
  },
  info: {
    icon: 'sparkles',
    color: Color.logoBlue(),
    background: Color.logoBlue(0.12)
  }
};

export default function MissionStatusCard({
  status,
  title,
  message,
  rewards,
  footer,
  children,
  style
}: MissionStatusCardProps) {
  const palette = statusConfig[status];

  const isSuccess = status === 'success';

  const backgroundColor = useMemo(() => {
    if (status === 'success')
      return 'linear-gradient(135deg, rgba(255,249,236,0.82), rgba(255,233,186,0.42))';
    if (status === 'fail') return Color.rose(0.08);
    return 'rgba(59,130,246,0.08)';
  }, [status]);

  const borderColor = useMemo(() => {
    if (status === 'success') return 'rgba(250,193,50,0.6)';
    if (status === 'fail') return Color.rose(0.25);
    return 'rgba(59,130,246,0.25)';
  }, [status]);

  const xpNumberColor = useRoleColor('xpNumber', {
    fallback: 'logoGreen'
  }).getColor() || Color.logoGreen();

  return (
    <section
      className={css`
        width: 100%;
        max-width: 52rem;
        border-radius: 20px;
        padding: 2.4rem;
        border: 1.4px solid ${borderColor};
        background: ${backgroundColor};
        box-shadow: ${isSuccess
          ? '0 30px 64px -38px rgba(250,193,50,0.35)'
          : '0 18px 40px -32px rgba(15, 23, 42, 0.6)'};
        display: flex;
        flex-direction: column;
        gap: 1.8rem;
        position: relative;
        overflow: hidden;
        transition: background 0.35s ease, border-color 0.35s ease,
          filter 0.35s ease, box-shadow 0.35s ease;
        ${isSuccess
          ? `
          &::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(140deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.04) 40%, rgba(255,255,255,0) 65%);
            pointer-events: none;
            transition: opacity 0.35s ease;
          }
          &::after {
            content: '';
            position: absolute;
            top: -50%;
            left: -150%;
            width: 50%;
            height: 220%;
            background: linear-gradient(120deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0.15) 100%);
            transform: skewX(-18deg);
            opacity: 0;
            pointer-events: none;
          }
          &:hover {
            border-color: rgba(250,193,50,0.85);
            background: linear-gradient(135deg, rgba(255,249,236,0.98), rgba(255,225,150,0.78));
            filter: saturate(1.08);
            box-shadow: 0 34px 70px -36px rgba(250,193,50,0.45);
          }
          &:hover::before {
            opacity: 0.85;
          }
          &:hover::after {
            animation: mission-card-gold-shine 1.4s ease-in-out forwards;
          }
          @keyframes mission-card-gold-shine {
            0% { left: -150%; opacity: 0; }
            20% { opacity: 0.25; }
            45% { opacity: 0.55; }
            100% { left: 150%; opacity: 0; }
          }
        `
          : ''}
        ${isSuccess ? 'backdrop-filter: blur(6px);' : ''}
        @media (max-width: ${mobileMaxWidth}) {
          padding: 2rem;
          gap: 1.4rem;
        }
      `}
      style={style}
    >
      <header
        className={css`
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          text-align: center;
          position: relative;
          padding-top: 1rem;
        `}
      >
        {isSuccess ? (
          <div
            className={css`
              width: 100%;
              max-width: 18rem;
              height: 2.4rem;
              background: linear-gradient(120deg, rgba(255, 255, 255, 0.24) 0%, rgba(255, 255, 255, 0.6) 45%, rgba(255, 255, 255, 0.18) 100%);
              border-radius: 999px;
              filter: blur(6px);
              position: absolute;
              top: -0.8rem;
              left: 50%;
              transform: translateX(-50%);
            `}
          />
        ) : null}
        <div
          className={css`
            width: 4.6rem;
            height: 4.6rem;
            border-radius: 16px;
            background: ${palette.background};
            display: flex;
            align-items: center;
            justify-content: center;
            color: ${palette.color};
            font-size: 2.4rem;
            box-shadow: ${isSuccess
              ? '0 12px 24px -18px rgba(250,193,50,0.55)'
              : 'none'};
          `}
        >
          <Icon icon={palette.icon as any} />
        </div>
        <div
          className={css`
            display: flex;
            flex-direction: column;
            gap: 0.8rem;
            align-items: center;
            text-align: center;
            h2 {
              font-size: 2.1rem;
              font-weight: 800;
              line-height: 1.2;
              color: ${Color.darkerGray()};
              text-shadow: ${isSuccess
                ? '0 1px 12px rgba(250, 193, 50, 0.35)'
                : 'none'};
              letter-spacing: 0.04em;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.9rem;
              }
            }
          `}
        >
          <h2>{title}</h2>
          {message ? (
            <div
              className={css`
                font-size: 1.5rem;
                color: ${Color.darkGray()};
                max-width: 36rem;
                display: flex;
                flex-direction: column;
                gap: 0.8rem;
              `}
            >
              {message}
            </div>
          ) : null}
        </div>
      </header>

      {rewards && (rewards.xp || rewards.coins) ? (
        <div
          className={css`
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            justify-content: center;
          `}
        >
          {rewards.xp ? (
            <RewardChip
              borderColor={xpNumberColor}
              valueColor={xpNumberColor}
              labelColor={Color.gold()}
              label="XP"
              value={addCommasToNumber(rewards.xp)}
            />
          ) : null}
          {rewards.coins ? (
            <RewardChip
              borderColor={Color.brownOrange()}
              valueColor={Color.brownOrange()}
              label="coins"
              value={`${addCommasToNumber(rewards.coins)}`}
            />
          ) : null}
        </div>
      ) : null}

      {children}

      {footer ? (
        <footer
          className={css`
            margin-top: 0.4rem;
            display: flex;
            justify-content: center;
          `}
        >
          {footer}
        </footer>
      ) : null}
    </section>
  );
}

function RewardChip({
  borderColor,
  valueColor,
  labelColor,
  label,
  value,
  icon,
  iconColor
}: {
  borderColor: string;
  valueColor: string;
  labelColor?: string;
  label: string;
  value: string | number;
  icon?: any;
  iconColor?: string;
}) {
  return (
    <span
      className={css`
        display: inline-flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.7rem 1.1rem;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.85);
        border: 1px solid ${borderColor};
        font-size: 1.4rem;
        font-weight: 700;
      `}
    >
      {icon ? <Icon icon={icon} style={{ color: iconColor || valueColor }} /> : null}
      <span
        style={{
          color: valueColor
        }}
      >
        {value}
      </span>
      {label ? (
        <span
          className={css`
            text-transform: uppercase;
            letter-spacing: 0.06em;
            font-size: 1.2rem;
          `}
          style={{
            color: labelColor || valueColor
          }}
        >
          {label}
        </span>
      ) : null}
    </span>
  );
}
