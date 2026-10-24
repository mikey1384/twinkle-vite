import React from 'react';
import { css, cx } from '@emotion/css';
import Icon from '~/components/Icon';
import { mobileMaxWidth } from '~/constants/css';
import { ARENA } from './theme';

// Arena's button (Mikey 10-24: AI Story and everything in Arena share one
// look): a flat color block with a thick ink outline and a hard shadow that
// presses in. `tone` picks the color; the generic site names AI Story used
// (pink, blue, logoBlue, orange, gold) map onto Arena's palette.
const TONES: Record<string, { bg: string; fg: string }> = {
  ink: { bg: ARENA.ink, fg: '#fff' },
  train: { bg: ARENA.train, fg: '#fff' },
  red: { bg: ARENA.accent, fg: '#fff' },
  pink: { bg: '#e8577e', fg: '#fff' },
  blue: { bg: ARENA.sky, fg: '#fff' },
  logoBlue: { bg: ARENA.sky, fg: '#fff' },
  orange: { bg: ARENA.coral, fg: '#fff' },
  violet: { bg: ARENA.violet, fg: '#fff' },
  gold: { bg: '#f2c14e', fg: ARENA.ink },
  paper: { bg: ARENA.paper, fg: ARENA.ink }
};

export default function ArenaButton({
  tone = 'ink',
  size = 'lg',
  disabled,
  loading,
  onClick,
  style,
  className,
  children
}: {
  tone?: keyof typeof TONES | string;
  size?: 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => any;
  style?: React.CSSProperties;
  className?: string;
  children?: React.ReactNode;
}) {
  const color = TONES[tone] || TONES.ink;
  return (
    <button
      type="button"
      className={cx(buttonCls, size === 'md' && mdCls, className)}
      style={{ background: color.bg, color: color.fg, ...style }}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      onClick={onClick}
    >
      {loading && <Icon icon="spinner" pulse />}
      {children}
    </button>
  );
}

const buttonCls = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  min-width: 14rem;
  padding: 1rem 2.4rem;
  border: 3px solid ${ARENA.line};
  border-radius: 10px;
  box-shadow: 4px 4px 0 ${ARENA.line};
  font-size: 1.8rem;
  font-weight: 900;
  letter-spacing: 0.03em;
  cursor: pointer;
  transition:
    transform 0.1s,
    box-shadow 0.1s;
  &:hover:not(:disabled) {
    transform: translate(-1px, -1px);
    box-shadow: 5px 5px 0 ${ARENA.line};
  }
  &:active:not(:disabled) {
    transform: translate(3px, 3px);
    box-shadow: 1px 1px 0 ${ARENA.line};
  }
  &:disabled {
    cursor: default;
    opacity: 0.55;
  }
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.6rem;
    padding: 0.9rem 1.8rem;
  }
`;

const mdCls = css`
  min-width: 0;
  padding: 0.6rem 1.6rem;
  font-size: 1.4rem;
  box-shadow: 3px 3px 0 ${ARENA.line};
  border-width: 2px;
`;
