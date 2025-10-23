import React from 'react';
import { borderRadius, Color, innerBorderRadius } from '~/constants/css';
import { css } from '@emotion/css';
import ScopedTheme from '~/theme/ScopedTheme';
import { useRoleColor } from '~/theme/useRoleColor';

export default function ProgressBar({
  className,
  color,
  noBorderRadius,
  progress,
  style = {},
  theme,
  text,
  startLabel,
  endLabel
}: {
  className?: string;
  color?: string;
  noBorderRadius?: boolean;
  progress: number;
  style?: React.CSSProperties;
  theme?: string;
  text?: React.ReactNode;
  startLabel?: string | null;
  endLabel?: string | null;
}) {
  const {
    color: roleColor,
    themeName: resolvedThemeName
  } = useRoleColor('progressBar', {
    themeName: theme,
    fallback: 'logoBlue'
  });
  const resolveExplicitColor = (value?: string) => {
    if (!value) return undefined;
    const fn = Color[value as keyof typeof Color];
    return fn ? fn() : value;
  };
  const explicitColor = resolveExplicitColor(color);
  const barBaseColor = explicitColor || roleColor;
  const barColorVar = explicitColor
    ? barBaseColor
    : `var(--role-progressBar-color, ${barBaseColor})`;

  const textDisplay = text || `${Math.round(progress)}%`;
  const showDarkBg = progress >= 45;
  const textColor = showDarkBg ? '#fff' : Color.darkerGray();
  const textBackground = showDarkBg
    ? 'rgba(15, 23, 42, 0.3)'
    : 'rgba(255, 255, 255, 0.92)';

  return (
    <ScopedTheme theme={resolvedThemeName as any} roles={['progressBar']}>
      <div style={{ width: '100%', ...style }}>
        <div
          className={`${css`
            border-radius: ${borderRadius};
            height: 1.8rem;
            margin-top: 0.6rem;
            position: relative;
            overflow: hidden;
            background: rgba(148, 163, 184, 0.18);
            box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.12);
          `} ${className ?? ''}`}
          style={{
            borderLeft: noBorderRadius ? 'none' : undefined,
            borderRight: noBorderRadius ? 'none' : undefined,
            borderRadius: noBorderRadius ? 0 : undefined
          }}
        >
          <section
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              background: barColorVar,
              width: `${progress}%`,
              height: '100%',
              opacity: progress > 0 ? 1 : 0,
              border: 'none',
              borderTopLeftRadius: noBorderRadius ? 0 : innerBorderRadius,
              borderBottomLeftRadius: noBorderRadius ? 0 : innerBorderRadius,
              borderTopRightRadius:
                progress >= 100 && !noBorderRadius ? innerBorderRadius : 0,
              borderBottomRightRadius:
                progress >= 100 && !noBorderRadius ? innerBorderRadius : 0,
              transition: 'width 0.5s',
              zIndex: 1
            }}
          >
          </section>
          <span
            className={css`
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              display: inline-flex;
              align-items: center;
              justify-content: center;
              font-weight: 700;
              pointer-events: none;
              font-size: 1.2rem;
            `}
            style={{
              color: textColor,
              textShadow:
                showDarkBg ? '0 0 6px rgba(0,0,0,0.35)' : 'none',
              padding: '0 0.6rem',
              whiteSpace: 'nowrap',
              zIndex: 2,
              background: textBackground,
              borderRadius: '9999px'
            }}
          >
            {textDisplay}
          </span>
        </div>
        {startLabel && endLabel && (
          <div
            className={css`
              margin-top: 0.2rem;
              width: 100%;
              display: flex;
              justify-content: space-between;
            `}
          >
            <span>{startLabel}</span>
            <span>{endLabel}</span>
          </div>
        )}
      </div>
    </ScopedTheme>
  );
}
