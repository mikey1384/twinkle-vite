import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { borderRadius, Color, innerBorderRadius } from '~/constants/css';
import { css } from '@emotion/css';
import { useTheme } from '~/helpers/hooks';
import { useKeyContext } from '~/contexts';

ProgressBar.propTypes = {
  className: PropTypes.string,
  noBorderRadius: PropTypes.bool,
  progress: PropTypes.number.isRequired,
  color: PropTypes.string,
  style: PropTypes.object,
  theme: PropTypes.string,
  text: PropTypes.string
};

export default function ProgressBar({
  className,
  color,
  noBorderRadius,
  progress,
  style = {},
  theme,
  text
}) {
  const { profileTheme } = useKeyContext((v) => v.myState);
  const {
    progressBar: { color: progressBarColor }
  } = useTheme(theme || profileTheme);

  const barColor = useMemo(
    () => color || Color[progressBarColor](),
    [color, progressBarColor]
  );

  return (
    <div
      className={`${css`
        border: 1px solid ${Color.borderGray()};
        border-radius: ${borderRadius};
        height: 2.2rem;
        line-height: 1rem;
        display: flex;
        flex-direction: column;
        justify-content: center;
        margin-top: 1rem;
        font-size: 1.2rem;
        section {
          margin-left: 0;
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
        ...style,
        borderLeft: noBorderRadius && 'none',
        borderRight: noBorderRadius && 'none',
        borderRadius: noBorderRadius && 0
      }}
    >
      <section
        style={{
          background: barColor,
          width: `${progress}%`,
          height: '100%',
          display: 'flex',
          opacity: progress > 0 ? 1 : 0,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: noBorderRadius && 0
        }}
      >
        <span
          style={{
            color: '#fff'
          }}
        >
          {text || `${progress}%`}
        </span>
      </section>
    </div>
  );
}
