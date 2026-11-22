import React, { useMemo } from 'react';
import { css, keyframes } from '@emotion/css';
import Icon from '~/components/Icon';
import { Color, mobileMaxWidth } from '~/constants/css';
import { wordLevelHash } from '~/constants/defaultValues';
import { getRGBA } from '~/components/WordMasterBadges';
import { Sparkle } from './RobotWorkshop';

// Shared by the discovery moment and, later, the word battle's "A wild
// <word> appears!" entrance: the word as letter tiles in its level's colour,
// and the level as stars.

export function getWordLevelColor(level: number, opacity = 1) {
  return getRGBA(wordLevelHash[level]?.color || 'orange', opacity);
}

const tileDrop = keyframes`
  0% { opacity: 0; transform: translateY(-2.2rem) scale(0.5) rotate(-12deg); }
  60% { opacity: 1; transform: translateY(0.3rem) scale(1.08) rotate(3deg); }
  100% { opacity: 1; transform: translateY(0) scale(1) rotate(0deg); }
`;

const tileBob = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-0.35rem); }
`;

const tilePop = keyframes`
  0% { transform: scale(1); }
  35% { transform: scale(1.22) rotate(-4deg); }
  65% { transform: scale(0.94) rotate(2deg); }
  100% { transform: scale(1) rotate(0deg); }
`;

const sparkPop = keyframes`
  0% { opacity: 0; transform: scale(0) rotate(0deg); }
  40% { opacity: 1; transform: scale(1.2) rotate(45deg); }
  100% { opacity: 0; transform: scale(0.2) rotate(90deg); }
`;

const starPop = keyframes`
  0% { opacity: 0; transform: scale(0) rotate(-40deg); }
  70% { opacity: 1; transform: scale(1.35) rotate(8deg); }
  100% { opacity: 1; transform: scale(1) rotate(0deg); }
`;

// The whole word lands within about 0.8 s however long it is, so even a
// one-second discovery shows it complete.
export function getTileStaggerMs(length: number) {
  return Math.min(80, 650 / Math.max(length, 1));
}

export function LetterTiles({
  word,
  level,
  mode
}: {
  word: string;
  level: number;
  // assembling: tiles land one by one, then bob while the work goes on;
  // celebrating: they pop once in a wave; resting: still.
  mode: 'assembling' | 'celebrating' | 'resting';
}) {
  const letters = useMemo(() => Array.from(word), [word]);
  const stagger = getTileStaggerMs(letters.length);
  const assembledMs = letters.length * stagger + 420;
  const size = useMemo(() => {
    const length = letters.length;
    if (length <= 7) return { tile: 5, font: 3 };
    if (length <= 10) return { tile: 4.1, font: 2.5 };
    if (length <= 14) return { tile: 3.3, font: 2 };
    return { tile: 2.6, font: 1.6 };
  }, [letters.length]);
  const color = getWordLevelColor(level);
  const shadowColor = getWordLevelColor(level, 0.45);

  return (
    <div
      aria-hidden="true"
      className={css`
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.4rem 0 0.8rem;
        --tile: ${size.tile}rem;
        --tile-font: ${size.font}rem;
        @media (max-width: ${mobileMaxWidth}) {
          gap: 0.35rem;
          --tile: ${size.tile * 0.78}rem;
          --tile-font: ${size.font * 0.78}rem;
        }
      `}
    >
      {letters.map((letter, index) =>
        letter.trim() ? (
          <span
            key={index}
            className={css`
              position: relative;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: var(--tile);
              height: calc(var(--tile) * 1.12);
              font-size: var(--tile-font);
              font-weight: 800;
              line-height: 1;
              color: ${Color.darkerGray()};
              background: ${Color.white()};
              border: 0.22rem solid ${color};
              border-radius: 0.7rem;
              box-shadow: 0 0.38rem 0 ${shadowColor};
              animation: ${
                mode === 'celebrating'
                  ? `${tilePop} 560ms ease-out ${index * 45}ms both`
                  : mode === 'assembling'
                    ? `${tileDrop} 420ms cubic-bezier(0.2, 1.3, 0.4, 1) ${
                        index * stagger
                      }ms both, ${tileBob} 1.8s ease-in-out ${
                        assembledMs + index * 110
                      }ms infinite`
                    : 'none'
              };
              @media (prefers-reduced-motion: reduce) {
                animation: none;
              }
            `}
          >
            {letter}
            {mode !== 'resting' && (
              <span
                className={css`
                  position: absolute;
                  top: -0.7rem;
                  right: -0.7rem;
                  width: 1.6rem;
                  height: 1.6rem;
                  opacity: 0;
                  animation: ${sparkPop} 620ms ease-out
                    ${
                      mode === 'celebrating'
                        ? index * 45 + 120
                        : index * stagger + 260
                    }ms
                    both;
                  @media (prefers-reduced-motion: reduce) {
                    display: none;
                  }
                `}
              >
                <Sparkle size="100%" color={Color.gold()} />
              </span>
            )}
          </span>
        ) : (
          <span key={index} style={{ width: 'calc(var(--tile) * 0.4)' }} />
        )
      )}
    </div>
  );
}

export function LevelStars({
  level,
  delayMs = 0
}: {
  level: number;
  delayMs?: number;
}) {
  const color = getWordLevelColor(level);
  return (
    <span
      role="img"
      aria-label={`Level ${level} of 5`}
      className={css`
        display: inline-flex;
        gap: 0.25rem;
        font-size: 1.7rem;
        @media (max-width: ${mobileMaxWidth}) {
          font-size: 1.4rem;
        }
      `}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Icon
          key={star}
          icon="star"
          aria-hidden="true"
          className={css`
            color: ${star <= level ? color : Color.borderGray()};
            ${
              star <= level
                ? `animation: ${starPop} 380ms ease-out ${
                    delayMs + star * 110
                  }ms both;`
                : ''
            }
            @media (prefers-reduced-motion: reduce) {
              animation: none;
            }
          `}
        />
      ))}
    </span>
  );
}
