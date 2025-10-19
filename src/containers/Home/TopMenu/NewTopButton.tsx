import React, { type CSSProperties, type ReactNode } from 'react';
import Button from '~/components/Button';
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

  return (
    <Button
      onClick={onClick}
      style={style}
      color={color}
      variant="soft"
      tone="flat"
      shape="pill"
      size="md"
      uppercase={false}
      disabled={!!loading}
    >
      {children}
      {isChecked ? <span style={{ marginLeft: '0.5rem' }}>✓</span> : null}
    </Button>
  );
}
