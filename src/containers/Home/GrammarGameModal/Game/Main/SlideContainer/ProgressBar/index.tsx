import React from 'react';
import Bubble from './Bubble';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import {
  NEON,
  PIXEL_FONT,
  glowPulse,
  pop,
  rgba,
  ringBurst,
  trailRun
} from '../../../../ClassicArcade/theme';
import { useRoleColor } from '~/theme/hooks/useRoleColor';

export default function ProgressBar({
  isOnStreak,
  isCompleted,
  questions,
  selectedIndex,
  style
}: {
  isOnStreak: boolean;
  isCompleted: boolean;
  questions: any[];
  selectedIndex: number;
  style: React.CSSProperties;
}) {
  const roleS = useRoleColor('grammarGameScoreS', { fallback: 'gold' });
  const roleA = useRoleColor('grammarGameScoreA', { fallback: 'magenta' });
  const roleB = useRoleColor('grammarGameScoreB', { fallback: 'orange' });
  const roleC = useRoleColor('grammarGameScoreC', { fallback: 'pink' });
  const roleD = useRoleColor('grammarGameScoreD', { fallback: 'logoBlue' });
  const roleF = useRoleColor('grammarGameScoreF', { fallback: 'gray' });

  const colorS = (opacity?: number) =>
    roleS.getColor(opacity) || Color.gold(opacity ?? 1);
  const colorA = (opacity?: number) =>
    roleA.getColor(opacity) || Color.magenta(opacity ?? 1);
  const colorB = (opacity?: number) =>
    roleB.getColor(opacity) || Color.orange(opacity ?? 1);
  const colorC = (opacity?: number) =>
    roleC.getColor(opacity) || Color.pink(opacity ?? 1);
  const colorD = (opacity?: number) =>
    roleD.getColor(opacity) || Color.logoBlue(opacity ?? 1);
  const colorF = (opacity?: number) =>
    roleF.getColor(opacity) || Color.gray(opacity ?? 1);

  // Paint only: the slot being played gets a speed-line trail.
  const playingSlot =
    !isCompleted && !questions[selectedIndex]?.score ? selectedIndex + 1 : 0;

  const glass = (color: (o?: number) => string) => `
    background-color: #160c42;
    background-image:
      radial-gradient(circle at 33% 27%, rgba(255,255,255,0.95) 0, rgba(255,255,255,0.5) 9%, rgba(255,255,255,0) 26%),
      radial-gradient(circle at 62% 84%, rgba(255,255,255,0.4) 0, rgba(255,255,255,0) 24%),
      radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 58%, rgba(8,4,32,0.55) 100%),
      radial-gradient(circle at 42% 38%, ${color(1)} 0%, ${color(0.92)} 45%, ${color(0.6)} 100%);
    border-color: transparent;
    box-shadow:
      inset 0 -3px 5px rgba(0, 0, 0, 0.35),
      0 0 10px ${color(0.85)},
      0 0 22px ${color(0.35)};
    animation: ${pop} 420ms ease-out;
    &::before {
      content: '';
      position: absolute;
      inset: -3px;
      border-radius: 50%;
      border: 2px solid ${color(1)};
      opacity: 0;
      animation: ${ringBurst} 520ms ease-out;
      pointer-events: none;
    }
  `;

  const className = css`
    .track {
      --cg-slot-gap: 6px;
      position: relative;
      display: flex;
      align-items: center;
      padding: 0.9rem 1.2rem;
      border-radius: 9999px;
      background: linear-gradient(
        180deg,
        rgba(10, 12, 46, 0.9) 0%,
        rgba(26, 16, 78, 0.9) 100%
      );
      border: 1px solid ${rgba(NEON.cyanRgb, 0.45)};
      box-shadow:
        0 0 16px ${rgba(NEON.cyanRgb, 0.25)},
        inset 0 0 14px rgba(0, 0, 0, 0.6);
      /* the glowing rail the marbles race along */
      &::before {
        content: '';
        position: absolute;
        left: 1rem;
        right: 1rem;
        top: 50%;
        height: 3px;
        margin-top: -1.5px;
        border-radius: 3px;
        background: linear-gradient(
          90deg,
          ${rgba(NEON.violetRgb, 0.2)},
          ${rgba(NEON.cyanRgb, 0.85)} 50%,
          ${rgba(NEON.violetRgb, 0.2)}
        );
        box-shadow: 0 0 8px ${rgba(NEON.cyanRgb, 0.5)};
      }
      @media (max-width: ${mobileMaxWidth}) {
        --cg-slot-gap: 1px;
        padding: 0.6rem 0.7rem;
      }
    }
    .track > div {
      position: relative;
    }
    ${
      playingSlot
        ? `
    .track > div:nth-child(${playingSlot}) .ball {
      border-color: ${rgba(NEON.cyanRgb, 0.95)};
      box-shadow:
        inset 0 -3px 5px rgba(0, 0, 0, 0.35),
        0 0 12px ${rgba(NEON.cyanRgb, 0.8)};
    }
    .track > div:nth-child(${playingSlot})::before {
      content: '';
      position: absolute;
      right: 70%;
      top: 22%;
      width: 46px;
      height: 56%;
      background: repeating-linear-gradient(
        180deg,
        ${rgba(NEON.cyanRgb, 0.9)} 0 2px,
        transparent 2px 5px
      );
      -webkit-mask-image: linear-gradient(90deg, transparent, #000);
      mask-image: linear-gradient(90deg, transparent, #000);
      animation: ${trailRun} 0.7s ease-in-out infinite;
      pointer-events: none;
    }`
        : ''
    }
    .waving {
      animation: wave ease-in-out;
      animation-duration: 200ms;
    }
    .ball {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 1px solid rgba(160, 180, 255, 0.3);
      font-family: ${PIXEL_FONT};
      font-size: 1.4rem;
      line-height: 1;
      color: #fff;
      text-shadow:
        0 1px 0 rgba(10, 6, 40, 0.85),
        0 0 3px rgba(10, 6, 40, 0.6);
      /* an empty slot: dim smoky glass */
      background-color: rgba(120, 140, 220, 0.12);
      background-image:
        radial-gradient(
          circle at 33% 27%,
          rgba(255, 255, 255, 0.3) 0,
          rgba(255, 255, 255, 0.12) 9%,
          rgba(255, 255, 255, 0) 26%
        ),
        radial-gradient(
          circle at 50% 50%,
          rgba(0, 0, 0, 0) 58%,
          rgba(8, 4, 32, 0.55) 100%
        );
      box-shadow: inset 0 -3px 5px rgba(0, 0, 0, 0.35);
      @media (max-width: ${mobileMaxWidth}) {
        width: 26px;
        height: 26px;
        font-size: 0.9rem;
      }
    }
    .gradedS {
      ${glass(colorS)}
    }
    .gradedA {
      ${glass(colorA)}
    }
    .gradedB {
      ${glass(colorB)}
    }
    .gradedC {
      ${glass(colorC)}
    }
    .gradedD {
      ${glass(colorD)}
    }
    .gradedF {
      ${glass(colorF)}
    }
    /* an all-S run: rainbow glass with a breathing halo */
    .streak {
      background-image:
        radial-gradient(
          circle at 33% 27%,
          rgba(255, 255, 255, 0.95) 0,
          rgba(255, 255, 255, 0.5) 9%,
          rgba(255, 255, 255, 0) 26%
        ),
        conic-gradient(
          from 200deg,
          ${colorS()},
          ${colorA()},
          ${colorB()},
          ${colorC()},
          ${colorS()}
        );
      box-shadow:
        inset 0 -3px 5px rgba(0, 0, 0, 0.3),
        0 0 14px ${colorS(0.9)};
      &::before {
        inset: -4px;
        border-color: ${colorS(1)};
        box-shadow: 0 0 12px ${colorS(0.9)};
        animation: ${glowPulse} ${selectedIndex === 9 ? 0.3 : 1}s ease-in-out
          infinite;
      }
    }
  `;

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        justifyContent: 'center',
        ...style
      }}
    >
      <div className="track">
        {questions.map((question, index) => {
          return (
            <Bubble
              key={index}
              index={index}
              isOnStreak={isOnStreak}
              isCompleted={isCompleted}
              question={question}
              style={{
                marginLeft: index === 0 ? 0 : 'var(--cg-slot-gap)',
                zIndex: 10 - index
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
