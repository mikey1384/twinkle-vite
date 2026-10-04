import React from 'react';
import { css, keyframes } from '@emotion/css';
import { Color } from '~/constants/css';

// One-shot burst (not looping): pieces fly out and fade, transform/opacity
// only, and nothing at all for reduced motion.
const fly = keyframes`
  0% { transform: translate(0, 0) rotate(0deg) scale(0.6); opacity: 0; }
  12% { opacity: 1; }
  100% {
    transform: translate(var(--dx), var(--dy)) rotate(var(--spin)) scale(1);
    opacity: 0;
  }
`;

const layerClass = css`
  position: absolute;
  left: 50%;
  top: 3.2rem;
  width: 0;
  height: 0;
  pointer-events: none;
  @media (prefers-reduced-motion: reduce) {
    display: none;
  }
`;

const pieceClass = css`
  position: absolute;
  width: 0.8rem;
  height: 1.2rem;
  border-radius: 2px;
  opacity: 0;
  animation: ${fly} 1.3s cubic-bezier(0.2, 0.7, 0.3, 1) 0.15s 1 forwards;
`;

const COLORS = [
  Color.brightGold(),
  '#ffffff',
  Color.violet(),
  Color.pastelPink(),
  Color.skyBlue(),
  Color.goldOrange()
];

const PIECES = Array.from({ length: 16 }, (_, index) => {
  const angle = (index / 16) * Math.PI * 2 + (index % 2 ? 0.2 : -0.1);
  const distance = 70 + (index % 4) * 22;
  return {
    dx: Math.round(Math.cos(angle) * distance * 1.6),
    dy: Math.round(Math.sin(angle) * distance * 0.8 + 30),
    spin: (index % 2 ? 1 : -1) * (180 + index * 25),
    color: COLORS[index % COLORS.length],
    delay: (index % 5) * 0.04
  };
});

export default function Confetti() {
  return (
    <span className={layerClass} aria-hidden>
      {PIECES.map((piece, index) => (
        <i
          key={index}
          className={pieceClass}
          style={
            {
              background: piece.color,
              animationDelay: `${0.15 + piece.delay}s`,
              '--dx': `${piece.dx}px`,
              '--dy': `${piece.dy}px`,
              '--spin': `${piece.spin}deg`
            } as React.CSSProperties
          }
        />
      ))}
    </span>
  );
}
