import React, { useEffect, useMemo, useRef, useState } from 'react';
import { css } from '@emotion/css';

const VARIANTS = {
  primary: { bg: '#3b82f6', border: '#2563eb', shadow: '#1d4ed8' },
  success: { bg: '#22c55e', border: '#16a34a', shadow: '#15803d' },
  logoBlue: { bg: '#418CEB', border: '#0046C3', shadow: '#003AA5' },
  magenta: { bg: '#ec4899', border: '#db2777', shadow: '#be185d' },
  orange: { bg: '#FF9A00', border: '#F5BE46', shadow: '#FF8C00' },
  gold: { bg: '#FFD564', border: '#FAC132', shadow: '#FAC132' },
  purple: { bg: '#9333ea', border: '#7e22ce', shadow: '#6b21a8' }
} as const;

const DEFAULT_MESSAGES = [
  'Unpacking blocks...',
  'Warming up the game engine...',
  'Teaching robots to behave...',
  'Polishing pixels...',
  'Almost there...'
];

const MILESTONES = [25, 50, 75];

// Sibling of ProgressBar in GameCTAButton's visual language: chunky bordered
// track with a hard drop shadow, solid variant fill, a sheen sweep, and
// milestone pips. When no real progress exists it simulates an honest curve —
// quick to ~55%, crawling toward 92%, snapping to 100 only on `complete`.
export default function GameProgressBar({
  progress,
  complete = false,
  variant = 'logoBlue',
  messages = DEFAULT_MESSAGES,
  label,
  style
}: {
  progress?: number;
  complete?: boolean;
  variant?: keyof typeof VARIANTS;
  messages?: string[];
  label?: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const colors = VARIANTS[variant] || VARIANTS.logoBlue;
  const [simulated, setSimulated] = useState(4);
  const [messageIndex, setMessageIndex] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    if (typeof progress === 'number' || complete) return;
    const timer = setInterval(() => {
      const elapsed = (Date.now() - startRef.current) / 1000;
      setSimulated(() => {
        const fast = Math.min(55, elapsed * 22);
        const crawl = Math.max(0, elapsed - 2.5) * 2.4;
        return Math.min(92, 4 + fast + crawl);
      });
    }, 180);
    return () => clearInterval(timer);
  }, [progress, complete]);

  useEffect(() => {
    if (messages.length < 2) return;
    const timer = setInterval(() => {
      setMessageIndex((index) => (index + 1) % messages.length);
    }, 2600);
    return () => clearInterval(timer);
  }, [messages.length]);

  const shown = complete ? 100 : typeof progress === 'number' ? progress : simulated;
  const clamped = Math.max(0, Math.min(100, shown));
  const statusLine = useMemo(
    () => label ?? messages[messageIndex % Math.max(1, messages.length)],
    [label, messages, messageIndex]
  );

  return (
    <div
      className={css`
        width: min(30rem, 82%);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.7rem;
      `}
      style={style}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
    >
      <div
        className={css`
          position: relative;
          width: 100%;
          height: 2.4rem;
          border-radius: 8px;
          border: 2px solid ${colors.border};
          box-shadow: 0 2px 0 ${colors.shadow};
          background: rgba(148, 163, 184, 0.18);
          overflow: hidden;
        `}
      >
        <div
          className={css`
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            background: ${colors.bg};
            transition: width 0.45s ease;
          `}
          style={{
            width: `${clamped}%`,
            borderRadius: clamped >= 99 ? '4px' : '4px 0 0 4px'
          }}
        >
          <span
            className={css`
              position: absolute;
              top: -30%;
              bottom: -30%;
              width: 1.6rem;
              background: rgba(255, 255, 255, 0.34);
              transform: skewX(-20deg);
              animation: gameProgressSheen 1.6s ease-in-out infinite;
              @keyframes gameProgressSheen {
                0% {
                  left: -20%;
                }
                60%,
                100% {
                  left: 115%;
                }
              }
            `}
          />
        </div>
        {MILESTONES.map((milestone) => (
          <span
            key={milestone}
            className={css`
              position: absolute;
              top: 50%;
              width: 0.7rem;
              height: 0.7rem;
              border-radius: 2px;
              transform: translate(-50%, -50%) rotate(45deg);
              transition: all 0.3s ease;
              z-index: 2;
            `}
            style={{
              left: `${milestone}%`,
              background:
                clamped >= milestone ? '#fff' : 'rgba(255, 255, 255, 0.45)',
              boxShadow:
                clamped >= milestone
                  ? `0 0 6px rgba(255, 255, 255, 0.9)`
                  : 'none',
              scale: clamped >= milestone ? '1.15' : '1'
            }}
          />
        ))}
        <span
          className={css`
            position: absolute;
            top: 50%;
            right: 0.7rem;
            transform: translateY(-50%);
            font-size: 1.1rem;
            font-weight: 700;
            z-index: 3;
          `}
          style={{
            color: clamped > 88 ? '#fff' : '#334155',
            textShadow: clamped > 88 ? '0 1px 2px rgba(0,0,0,0.35)' : 'none'
          }}
        >
          {Math.round(clamped)}%
        </span>
      </div>
      <div
        className={css`
          font-size: 1.1rem;
          font-weight: 700;
          opacity: 0.82;
          text-align: center;
          min-height: 1.6em;
        `}
        aria-live="polite"
      >
        {statusLine}
      </div>
    </div>
  );
}
