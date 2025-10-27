import React from 'react';
import { css, cx } from '@emotion/css';
import { Color } from '~/constants/css';
import { useRoleColor } from '~/theme/useRoleColor';

interface EmptyStateMessageProps {
  children: React.ReactNode;
  caption?: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  style?: React.CSSProperties;
  theme?: string;
}

export default function EmptyStateMessage({
  children,
  caption,
  className,
  icon,
  style,
  theme
}: EmptyStateMessageProps) {
  const { getColor: getBorderColor } = useRoleColor('filter', {
    themeName: theme,
    fallback: 'logoBlue'
  });
  const accentBorder = getBorderColor(0.9) || Color.logoBlue(0.82);
  const accentText = Color.darkerGray();
  const captionColor = Color.darkGray();

  const containerClass = css`
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 0.75rem;
    border-radius: 14px;
    border: 1px dashed ${accentBorder};
    background: #ffffff;
    color: ${accentText};
    font-size: 1.9rem;
    font-weight: 600;
    padding: 2.6rem 2rem;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);

    @media (max-width: 768px) {
      font-size: 1.7rem;
      padding: 2.2rem 1.6rem;
    }
  `;

  const iconWrapperClass = css`
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.2rem;
    color: ${accentText};
  `;

  const captionClass = css`
    font-size: 1.45rem;
    font-weight: 500;
    color: ${captionColor};
  `;

  return (
    <div className={cx(containerClass, className)} style={style}>
      {icon && <div className={iconWrapperClass}>{icon}</div>}
      <div>{children}</div>
      {caption && <div className={captionClass}>{caption}</div>}
    </div>
  );
}
