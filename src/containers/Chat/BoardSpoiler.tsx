import React from 'react';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';

export default function BoardSpoiler({
  revealed,
  onReveal,
  style,
  children,
  gameType,
  opponentName
}: {
  revealed: boolean;
  onReveal?: () => void;
  style?: React.CSSProperties;
  children: React.ReactNode;
  gameType: 'chess' | 'omok';
  opponentName?: string;
}) {
  if (revealed) {
    return <div style={style}>{children}</div>;
  }
  const overlayClass = css`
    width: 100%;
    height: 100%;
    border-radius: 0.5rem;
    border: 2px dashed rgba(245, 190, 70, 0.7);
    background: rgba(255, 255, 255, 0.95);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 1rem;
    padding: 1.5rem;
    color: rgba(115, 115, 115, 1);
    box-shadow: 0 0.5rem 2rem rgba(0, 0, 0, 0.08);
    font-size: 1.5rem;
    touch-action: manipulation;
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
    transition: transform 150ms ease, box-shadow 200ms ease, border-color 200ms ease;

    /* Desktop-only hover affordance */
    @media (hover: hover) and (pointer: fine) {
      &:hover {
        transform: translateZ(0) scale(1.02);
        box-shadow: 0 0.75rem 2.5rem rgba(0, 0, 0, 0.12),
          0 0 0.5rem rgba(255, 185, 60, 0.35);
        border-color: rgba(255, 185, 60, 0.9);
      }
    }
  `;
  const gameDisplayEn = gameType === 'omok' ? 'omok' : 'chess';
  const opponentLabelEn = opponentName || 'opponent';
  return (
    <div style={style}>
      <div
        onPointerDown={(e) => {
          if (onReveal && e.pointerType !== 'mouse') {
            e.preventDefault();
            onReveal();
          }
        }}
        onClick={(e) => {
          if (onReveal && (e.nativeEvent as PointerEvent).pointerType !== 'touch') {
            onReveal();
          }
        }}
        className={overlayClass}
        style={{ cursor: onReveal ? 'pointer' : 'default' }}
      >
        <Icon icon="eye-slash" />
        <div>
          <p>
            {opponentName
              ? `${opponentName} made a new ${gameDisplayEn} move.`
              : `New ${gameDisplayEn} move available.`}
          </p>
          <p>Tap to view it.</p>
          <p>
            {`After viewing ${opponentLabelEn}'s move, you `}
            <b>must</b>
            {' make your own move within your timer. Otherwise, you will lose.'}
          </p>
        </div>
      </div>
    </div>
  );
}
