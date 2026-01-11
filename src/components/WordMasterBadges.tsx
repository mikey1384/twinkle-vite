import React from 'react';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { wordLevelHash } from '~/constants/defaultValues';

export function getRGBA(colorName: string, opacity = 1) {
  switch (colorName) {
    case 'logoBlue':
      // Softer, pastel blue that's easier on the eyes
      return `rgba(62, 138, 230, ${opacity})`;
    case 'pink':
      return `rgba(255, 105, 180, ${opacity})`;
    case 'orange':
      return `rgba(255, 140, 0, ${opacity})`;
    case 'red':
      return `rgba(255, 50, 50, ${opacity})`;
    case 'gold':
      return `rgba(255, 207, 52, ${opacity})`;
    case 'limeGreen':
      return `rgba(50, 205, 50, ${opacity})`;
    case 'passionFruit':
      return `rgba(255, 85, 170, ${opacity})`;
    case 'brownOrange':
      return `rgba(245, 190, 70, ${opacity})`;
    case 'darkOceanBlue':
      return `rgba(30, 110, 183, ${opacity})`;
    case 'rose':
      return `rgba(223, 0, 102, ${opacity})`;
    case 'premiumRegister':
      return `linear-gradient(135deg, #ffe259 0%, #ffa751 100%)`;
    case 'premiumSpell':
      return `linear-gradient(135deg, rgba(80,170,200,1) 0%, rgba(80,140,200,1) 100%)`;
    case 'premiumReward':
      return `linear-gradient(135deg, #DA70D6 0%, #8A2BE2 100%)`;
    default:
      return `rgba(153, 153, 153, ${opacity})`;
  }
}

export function getActionColor(action: string) {
  switch (action) {
    case 'break_start':
      return 'orange';
    case 'break_clear':
      return 'limeGreen';
    case 'register':
      return 'premiumRegister';
    case 'spell':
      return 'premiumSpell';
    case 'reward':
      return 'premiumReward';
    case 'hit':
      return 'limeGreen';
    case 'apply':
      return 'pink';
    case 'answer':
      return 'red';
    default:
      return 'passionFruit';
  }
}

export function getBreakTypeColor(breakType?: string) {
  switch (breakType) {
    case 'daily_tasks':
      return 'logoBlue';
    case 'daily_reflection':
      return 'brownOrange';
    case 'chess_puzzle':
      return 'darkOceanBlue';
    case 'pending_moves':
      return 'orange';
    case 'grammarbles':
      return 'gold';
    case 'vocab_quiz':
      return 'rose';
    default:
      return 'logoBlue';
  }
}

export function badgeStyle(colorName: string, bgOpacity = 0.85) {
  const isGradient =
    colorName === 'premiumRegister' ||
    colorName === 'premiumSpell' ||
    colorName === 'premiumReward';

  const background = isGradient
    ? getRGBA(colorName)
    : getRGBA(colorName, bgOpacity);

  return css`
    display: inline-flex;
    font-family: 'Press Start 2P', cursive;
    font-size: 0.8rem;
    padding: 0.5rem 0.8rem;
    align-items: center;
    justify-content: center;
    border-radius: 1rem;
    min-width: 80px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
    transition: transform 0.2s ease, box-shadow 0.2s ease;

    &:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
    }

    ${isGradient
      ? `
          color: #fff;
          background: ${background};
          background-size: 200% 200%;
          animation: gradientAnimation 4s ease infinite;
        `
      : `
          background-color: ${background};
          color: #fff;
        `}

    @keyframes gradientAnimation {
      0% {
        background-position: 0% 50%;
      }
      50% {
        background-position: 100% 50%;
      }
      100% {
        background-position: 0% 50%;
      }
    }

    .label {
      margin-left: 0.4rem;
    }
    svg {
      margin-right: 0.3rem;
    }
  `;
}

const statusBadgeStyle = css`
  font-weight: 700;
  text-align: center;
  width: fit-content;

  @media (max-width: ${mobileMaxWidth}) {
    font-size: 0.9rem;
    padding: 0.3rem 0.6rem;
  }
`;

export function WordMasterStatusBadge({
  label,
  colorName,
  bgOpacity = 0.85,
  className
}: {
  label: string;
  colorName: string;
  bgOpacity?: number;
  className?: string;
}) {
  if (!label) return null;
  const classNames = [badgeStyle(colorName, bgOpacity), statusBadgeStyle, className]
    .filter(Boolean)
    .join(' ');
  return <span className={classNames}>{label}</span>;
}

function levelBadgeStyle(backgroundColor: string) {
  return css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.3rem 0.7rem;
    border-radius: 1rem;
    font-size: 1rem;
    font-weight: 600;
    color: #fff;
    background: ${backgroundColor};
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12);

    @media (max-width: ${mobileMaxWidth}) {
      font-size: 0.8rem;
    }
  `;
}

export function WordMasterLevelBadge({
  level,
  label,
  colorName,
  className
}: {
  level?: number;
  label?: string;
  colorName?: string;
  className?: string;
}) {
  const normalizedLevel =
    typeof level === 'number' && Number.isFinite(level) ? level : 3;
  const levelInfo = wordLevelHash[normalizedLevel] || wordLevelHash[3];
  const resolvedLabel = label || levelInfo?.label;
  if (!resolvedLabel) return null;
  const resolvedColor = colorName || levelInfo?.color || 'logoBlue';
  const classNames = [levelBadgeStyle(getRGBA(resolvedColor, 1)), className]
    .filter(Boolean)
    .join(' ');
  return <span className={classNames}>{resolvedLabel}</span>;
}
