import React from 'react';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';

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
  const gameDisplayKr = gameType === 'omok' ? '오목' : '체스';
  const opponentLabelEn = opponentName || 'opponent';
  const opponentLabelKr = opponentName ? `${opponentName}님` : '상대방';
  return (
    <div style={style}>
      <div
        onClick={onReveal}
        className={overlayClass}
        style={{ cursor: onReveal ? 'pointer' : 'default' }}
      >
        <Icon icon="eye-slash" />
        <div>
          <p>
            {SELECTED_LANGUAGE === 'kr'
              ? opponentName
                ? `${opponentName}님이 ${gameDisplayKr}에서 새 수를 두었습니다.`
                : `${gameDisplayKr}에서 새로운 수가 있습니다.`
              : opponentName
              ? `${opponentName} made a new ${gameDisplayEn} move.`
              : `New ${gameDisplayEn} move available.`}
          </p>
          <p>{SELECTED_LANGUAGE === 'kr' ? '탭하여 확인하세요.' : 'Tap to view it.'}</p>
          <p>
            {SELECTED_LANGUAGE === 'kr' ? (
              <>
                {`${opponentLabelKr}의 수를 확인한 후, 회원님의 제한시간 안에 `}
                <b>반드시</b>
                {` 자신의 수를 두셔야 합니다. 그렇지 않으면 패배합니다.`}
              </>
            ) : (
              <>
                {`After viewing ${opponentLabelEn}'s move, you `}
                <b>must</b>
                {' make your own move within your timer. Otherwise, you will lose.'}
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
