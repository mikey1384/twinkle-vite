import React, { type CSSProperties, type ReactNode } from 'react';
import Button from '~/components/Button';
import { css } from '@emotion/css';
import { useKeyContext } from '~/contexts';

export default function NewTopButton({
  onClick,
  loading,
  children,
  variant = 'slate',
  style,
  isChecked
}: {
  onClick: () => void;
  loading?: boolean;
  children: ReactNode;
  variant?: 'slate' | 'magenta' | 'purple' | 'orange' | 'green' | 'gold' | 'logoBlue';
  style?: CSSProperties;
  isChecked?: boolean;
}) {
  useKeyContext(() => null); // keep hook consistency if needed later

  const color =
    variant === 'magenta'
      ? 'magenta'
      : variant === 'purple'
      ? 'purple'
      : variant === 'orange'
      ? 'orange'
      : variant === 'green'
      ? 'green'
      : variant === 'gold'
      ? 'gold'
      : variant === 'logoBlue'
      ? 'logoBlue'
      : 'logoBlue';

  // Fun gradient backgrounds inspired by Grammarbles badges
  const gradientBg =
    variant === 'magenta'
      ? 'linear-gradient(135deg, #db0076 0%, #ff4088 100%)'
      : variant === 'gold' || variant === 'orange'
      ? 'linear-gradient(135deg, #ff8c00 0%, #ffc040 100%)'
      : variant === 'logoBlue'
      ? 'linear-gradient(135deg, #0047ab 0%, #408cff 100%)'
      : variant === 'green'
      ? 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)'
      : variant === 'purple'
      ? 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)'
      : undefined;

  const funClass = css`
    ${gradientBg ? `background: ${gradientBg} !important;` : ''}
    border: none !important;
    color: #fff !important;
    transform: translateZ(0);
    &:hover {
      transform: translateY(-1px) scale(1.01);
    }
  `;

  return (
    <Button
      onClick={onClick}
      style={style}
      color={color}
      variant={gradientBg ? 'solid' : 'soft'}
      tone={gradientBg ? 'raised' : 'flat'}
      shape="pill"
      size="md"
      uppercase={false}
      disabled={!!loading}
      className={funClass}
    >
      {children}
      {isChecked ? <span style={{ marginLeft: '0.5rem' }}>✓</span> : null}
    </Button>
  );
}
