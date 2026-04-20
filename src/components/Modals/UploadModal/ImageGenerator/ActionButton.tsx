import React from 'react';
import { css } from '@emotion/css';
import GameCTAButton from '~/components/Buttons/GameCTAButton';

interface ActionButtonProps {
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  fullWidth?: boolean;
  className?: string;
}

export default function ActionButton({
  onClick,
  disabled,
  children,
  variant = 'primary',
  fullWidth = false,
  className = ''
}: ActionButtonProps) {
  return (
    <div
      className={css`
        ${fullWidth ? 'width: 100%;' : ''}
        ${className}
      `}
    >
      <GameCTAButton
        onClick={onClick}
        disabled={disabled}
        icon={variant === 'primary' ? 'magic' : ''}
        variant={variant === 'primary' ? 'success' : 'orange'}
        size="md"
        style={{ width: fullWidth ? '100%' : undefined }}
      >
        {children}
      </GameCTAButton>
    </div>
  );
}
