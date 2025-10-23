import React, { useMemo } from 'react';
import { css, cx } from '@emotion/css';
import { tabletMaxWidth } from '~/constants/css';

export interface LeaderboardListProps {
  children: React.ReactNode;
  className?: string;
  listClassName?: string;
  listRef?: React.Ref<HTMLDivElement>;
  style?: React.CSSProperties;
  listStyle?: React.CSSProperties;
  /**
   * Default container height is auto. Override when the parent layout expects a fixed viewport.
   */
  height?: string;
  /**
   * Default width for the scrolling column.
   */
  width?: string;
  /**
   * Mobile width fallback (defaults to 100%).
   */
  mobileWidth?: string;
  /**
   * Spacing between leaderboard rows (default 0.75rem desktop, 0.5rem mobile).
   */
  gap?: string;
  mobileGap?: string;
  /**
   * Padding applied around the list on desktop.
   */
  padding?: string;
  /**
   * Padding applied around the list on mobile breakpoints.
   */
  mobilePadding?: string;
  /**
   * Extra bottom padding to keep the final item clear of sticky footers.
   */
  bottomPadding?: string;
  /**
   * When false, disables scroll behaviour so the host can manage overflow.
   */
  scrollable?: boolean;
}

export default function LeaderboardList({
  children,
  className,
  listClassName,
  listRef,
  style,
  listStyle,
  height = 'auto',
  width = '42rem',
  mobileWidth = '100%',
  gap = '0.75rem',
  mobileGap = '0.5rem',
  padding = '0 1rem 3.5rem',
  mobilePadding = '0 0.75rem 3rem',
  bottomPadding = '3.5rem',
  scrollable = true
}: LeaderboardListProps) {
  const wrapperClass = useMemo(
    () =>
      css`
        height: ${height};
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        min-height: 0;
        overflow: hidden;
      `,
    [height]
  );

  const listClass = useMemo(
    () =>
      css`
        width: ${width};
        max-width: 100%;
        display: flex;
        flex-direction: column;
        gap: ${gap};
        padding: ${padding};
        ${scrollable
          ? `
        flex: 1 1 auto;
        min-height: 0;
        overflow-y: auto;
        max-height: 100%;
        scrollbar-gutter: stable both-edges;
        overscroll-behavior: contain;`
          : ''}

        @supports (padding-bottom: env(safe-area-inset-bottom)) {
          padding-bottom: calc(${bottomPadding} + env(safe-area-inset-bottom));
        }

        @media (max-width: ${tabletMaxWidth}) {
          gap: ${mobileGap};
          padding: ${mobilePadding};
          width: ${mobileWidth};
          @supports (padding-bottom: env(safe-area-inset-bottom)) {
            padding-bottom: calc(
              ${parsePaddingValue(mobilePadding)} + env(safe-area-inset-bottom)
            );
          }
        }
      `,
    [
      width,
      gap,
      padding,
      scrollable,
      bottomPadding,
      mobileGap,
      mobilePadding,
      mobileWidth
    ]
  );

  return (
    <div className={cx(wrapperClass, className)} style={style}>
      <div
        ref={listRef}
        className={cx(listClass, listClassName)}
        style={listStyle}
      >
        {children}
      </div>
    </div>
  );
}

function parsePaddingValue(padding: string) {
  const parts = padding.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return parts[0];
  if (parts.length === 3) return parts[2];
  return parts[2] || parts[0];
}
