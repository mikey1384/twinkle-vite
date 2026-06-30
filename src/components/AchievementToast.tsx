import React, { useEffect, useRef, useState } from 'react';
import { css, keyframes } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import ProgressBar from '~/components/ProgressBar';
import Icon from '~/components/Icon';
import { addCommasToNumber } from '~/helpers/stringHelpers';

const EXIT_MS = 360;

const palette = {
  progress: {
    bg: '#3b82f6',
    border: '#2563eb',
    shadow: '#1d4ed8',
    text: '#ffffff',
    barColor: 'brightGold'
  },
  unlock: {
    bg: '#FFCB32',
    border: '#E69A00',
    shadow: '#C77F00',
    text: '#5a3e00',
    barColor: 'limeGreen'
  }
} as const;

const enterAnim = keyframes`
  0% { opacity: 0; transform: translate(-50%, 60px) scale(0.85); }
  60% { opacity: 1; transform: translate(-50%, -6px) scale(1.04); }
  100% { opacity: 1; transform: translate(-50%, 0) scale(1); }
`;

const leaveAnim = keyframes`
  0% { opacity: 1; transform: translate(-50%, 0) scale(1); }
  100% { opacity: 0; transform: translate(-50%, 24px) scale(0.92); }
`;

const shineAnim = keyframes`
  0% { left: -150%; }
  100% { left: 200%; }
`;

const badgePop = keyframes`
  0% { transform: scale(0.4) rotate(-12deg); opacity: 0; }
  60% { transform: scale(1.15) rotate(4deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
`;

const deltaPop = keyframes`
  0% { opacity: 0; transform: translateY(8px) scale(0.7); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
`;

export default function AchievementToast({
  variant = 'progress',
  title,
  badgeSrc,
  currentValue,
  targetValue,
  prevValue,
  delta,
  ap,
  duration = 5200,
  onClose,
  onClick
}: {
  variant?: 'progress' | 'unlock';
  title: string;
  badgeSrc?: string;
  currentValue?: number;
  targetValue?: number;
  prevValue?: number;
  delta?: number;
  ap?: number;
  duration?: number;
  onClose: () => void;
  onClick?: () => void;
}) {
  const isUnlock = variant === 'unlock';
  const c = palette[isUnlock ? 'unlock' : 'progress'];
  const cur = currentValue ?? 0;
  const target = targetValue ?? 1;
  const toPct = (value: number) =>
    Math.min(100, Math.max(0, Math.round((value / Math.max(1, target)) * 100)));
  const targetPct = isUnlock ? 100 : toPct(cur);
  // Start the fill at the user's previous value (Duolingo-style: animate the
  // jump they just earned), falling back to empty when no baseline is known
  // (first event of the session) or on unlock (full celebratory fill).
  const startPct =
    isUnlock || typeof prevValue !== 'number' ? 0 : toPct(prevValue);
  const barText = isUnlock
    ? 'Complete!'
    : `${addCommasToNumber(cur)} / ${addCommasToNumber(target)}`;

  const [pct, setPct] = useState(startPct);
  const [leaving, setLeaving] = useState(false);
  const closedRef = useRef(false);

  function close() {
    if (closedRef.current) return;
    closedRef.current = true;
    setLeaving(true);
    setTimeout(() => onClose(), EXIT_MS);
  }

  useEffect(() => {
    // Let the card finish entering, then animate the bar filling up.
    const fill = setTimeout(() => setPct(targetPct), 260);
    const dismiss = setTimeout(close, duration);
    return () => {
      clearTimeout(fill);
      clearTimeout(dismiss);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleClick() {
    if (onClick) {
      onClick();
      close();
    } else {
      close();
    }
  }

  return (
    <div
      role="status"
      aria-live="polite"
      onClick={handleClick}
      className={css`
        position: fixed;
        left: 50%;
        bottom: 3rem;
        /* Above modals (getZIndex base ~9,999,999), below the lazy-import
           reload overlay (2147483647). */
        z-index: 2147483000;
        width: min(92vw, 34rem);
        cursor: pointer;
        /* fill-mode both: hold the final keyframe (which carries the
           translateX(-50%) centering) so the toast doesn't snap rightward when
           the enter animation ends. */
        animation: ${leaving ? leaveAnim : enterAnim}
          ${leaving ? EXIT_MS : 420}ms
          ${leaving
            ? 'ease-in forwards'
            : 'cubic-bezier(0.2, 0.9, 0.3, 1.2) both'};
        @media (max-width: ${mobileMaxWidth}) {
          /* Float just above the mobile bottom nav (Header pinned bottom at
             --mobile-nav-height) instead of colliding with it. */
          bottom: calc(var(--mobile-nav-height, 7rem) + 1rem);
        }
      `}
    >
      <div
        className={css`
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.1rem 1.3rem;
          border-radius: 14px;
          background: ${c.bg};
          border: 2px solid ${c.border};
          box-shadow:
            0 4px 0 ${c.shadow},
            0 10px 24px rgba(0, 0, 0, 0.28);
          color: ${c.text};
          /* Sheen sweep (same shiny effect as GameCTAButton). This is a
             gradient, which the no-new-gradients rule normally forbids — Mikey
             explicitly approved it for this celebratory achievement toast. */
          &::after {
            content: '';
            position: absolute;
            top: 0;
            left: -150%;
            width: 55%;
            height: 100%;
            background: linear-gradient(
              120deg,
              rgba(255, 255, 255, 0.1) 0%,
              rgba(255, 255, 255, 0.45) 50%,
              rgba(255, 255, 255, 0.1) 100%
            );
            transform: skewX(-20deg);
            animation: ${shineAnim} 2.4s linear infinite;
            pointer-events: none;
          }
        `}
      >
        <div
          className={css`
            flex-shrink: 0;
            width: 4rem;
            height: 4rem;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: ${badgePop} 520ms cubic-bezier(0.2, 0.9, 0.3, 1.4) both;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.35));
          `}
        >
          {badgeSrc ? (
            <img
              src={badgeSrc}
              alt=""
              className={css`
                width: 100%;
                height: 100%;
                object-fit: contain;
              `}
            />
          ) : (
            <Icon icon="trophy" style={{ fontSize: '2.6rem' }} />
          )}
        </div>

        <div
          className={css`
            position: relative;
            z-index: 1;
            flex: 1;
            min-width: 0;
          `}
        >
          <div
            className={css`
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 0.6rem;
            `}
          >
            <div
              className={css`
                min-width: 0;
              `}
            >
              <div
                className={css`
                  font-size: 1.05rem;
                  font-weight: 800;
                  letter-spacing: 0.4px;
                  text-transform: uppercase;
                  opacity: 0.85;
                `}
              >
                {isUnlock ? 'Achievement Unlocked!' : 'Progress'}
              </div>
              <div
                className={css`
                  font-size: 1.45rem;
                  font-weight: 800;
                  line-height: 1.2;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                `}
              >
                {title}
              </div>
            </div>
            {isUnlock && typeof ap === 'number' ? (
              <div
                className={css`
                  flex-shrink: 0;
                  font-size: 1.3rem;
                  font-weight: 900;
                  padding: 0.3rem 0.7rem;
                  border-radius: 9999px;
                  background: rgba(0, 0, 0, 0.18);
                  animation: ${deltaPop} 360ms ease 180ms both;
                `}
              >
                +{addCommasToNumber(ap)} AP
              </div>
            ) : !isUnlock && typeof delta === 'number' && delta > 0 ? (
              <div
                className={css`
                  flex-shrink: 0;
                  font-size: 1.3rem;
                  font-weight: 900;
                  padding: 0.3rem 0.7rem;
                  border-radius: 9999px;
                  background: rgba(255, 255, 255, 0.22);
                  animation: ${deltaPop} 360ms ease 320ms both;
                `}
              >
                +{addCommasToNumber(delta)}
              </div>
            ) : null}
          </div>

          <ProgressBar progress={pct} color={c.barColor} text={barText} />
        </div>
      </div>
    </div>
  );
}
