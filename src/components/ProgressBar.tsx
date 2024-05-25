import React, { useMemo } from 'react';
import { borderRadius, Color, innerBorderRadius } from '~/constants/css';
import { css } from '@emotion/css';
import { returnTheme } from '~/helpers';
import { useKeyContext } from '~/contexts';

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
  const { profileTheme } = useKeyContext((v) => v.myState);
  const {
    progressBar: { color: progressBarColor }
  } = useMemo(() => returnTheme(theme || profileTheme), [profileTheme, theme]);

  const barColor = useMemo(
    () => color || Color[progressBarColor](),
    [color, progressBarColor]
  );

  return (
    <div style={{ width: '100%', ...style }}>
      <div
        className={`${css`
          border: 1px solid ${Color.borderGray()};
          border-radius: ${borderRadius};
          height: 2.2rem;
          line-height: 1rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          margin-top: 1rem;
          font-size: 1.2rem;
          section {
            transition: width 0.5s;
            border: 1px solid ${barColor};
            border-top-left-radius: ${innerBorderRadius};
            border-bottom-left-radius: ${innerBorderRadius};
            border-top-right-radius: ${progress >= 100 ? innerBorderRadius : 0};
            border-bottom-right-radius: ${progress >= 100
              ? innerBorderRadius
              : 0};
          }
        `} ${className}`}
        style={{
          borderLeft: noBorderRadius ? 'none' : undefined,
          borderRight: noBorderRadius ? 'none' : undefined,
          borderRadius: noBorderRadius ? 0 : undefined
        }}
      >
        <section
          style={{
            background: barColor,
            width: `${progress}%`,
            height: '100%',
            display: 'flex',
            opacity: progress > 0 ? 1 : 0,
            lineHeight: 1.5,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: noBorderRadius ? 0 : undefined
          }}
        >
          <span
            style={{
              color: '#fff',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {text || `${progress}%`}
          </span>
        </section>
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
  );
}
