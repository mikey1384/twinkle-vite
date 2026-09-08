import React from 'react';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { tabletMaxWidth } from '~/constants/css';

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
    height: auto;
    min-height: 44px;
    font-family: inherit;
    line-height: 1.5;
    appearance: none;
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
    font-size: 16px;
    @media (max-width: ${tabletMaxWidth}) {
      font-size: 14px;
      padding: 1rem;
      gap: 0.7rem;
    }
    touch-action: manipulation;
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
    transition: transform 150ms ease, box-shadow 200ms ease, border-color 200ms ease;
    &:focus-visible { outline: 3px solid #334155; outline-offset: 3px; }
    &:disabled { cursor: default; }
    @media (prefers-reduced-motion: reduce) { transition: none; }

    /* Desktop-only hover affordance */
    @media (hover: hover) and (pointer: fine) {
      &:hover:not(:disabled) {
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
    <div style={{ ...style, minHeight: style?.height, height: 'auto' }}>
      <button
        type="button"
        disabled={!onReveal}
        onClick={onReveal}
        className={overlayClass}
        style={{ cursor: onReveal ? 'pointer' : 'default', minHeight: style?.height || 44 }}
      >
        <Icon icon="eye-slash" />
        <span>
          <span style={{ display: 'block' }}>
            {opponentName
              ? `${opponentName} made a new ${gameDisplayEn} move.`
              : `New ${gameDisplayEn} move available.`}
          </span>
          <span style={{ display: 'block', marginBlock: 8 }}>View move</span>
          <span style={{ display: 'block' }}>
            {`After viewing ${opponentLabelEn}'s move, you `}
            <b>must</b>
            {' make your own move within your timer. Otherwise, you will lose.'}
          </span>
        </span>
      </button>
    </div>
  );
}
