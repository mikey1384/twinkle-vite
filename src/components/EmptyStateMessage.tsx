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
  const { getColor: getAccentColor } = useRoleColor('filter', {
    themeName: theme,
    fallback: 'logoBlue'
  });
  const accentColor = getAccentColor(0.68) || Color.logoBlue(0.65);
  const accentBorder = getAccentColor(0.9) || Color.logoBlue(0.82);
  const textColor = '#ffffff';
  const captionColor = Color.lighterGray();

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
    background: ${accentColor};
    color: ${textColor};
    font-size: 1.9rem;
    font-weight: 600;
    padding: 2.8rem 2rem;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.25);

    @media (max-width: 768px) {
      font-size: 1.7rem;
      padding: 2.4rem 1.6rem;
    }
  `;

  const iconWrapperClass = css`
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.2rem;
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
