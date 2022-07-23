import { memo, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { css } from '@emotion/css';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';

Button.propTypes = {
  className: PropTypes.string,
  color: PropTypes.string,
  disabled: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  filled: PropTypes.bool,
  stretch: PropTypes.bool,
  hoverColor: PropTypes.string,
  onClick: PropTypes.func,
  children: PropTypes.node,
  onHover: PropTypes.bool,
  onMouseEnter: PropTypes.func,
  onMouseLeave: PropTypes.func,
  opacity: PropTypes.number,
  skeuomorphic: PropTypes.bool,
  style: PropTypes.object,
  transparent: PropTypes.bool
};

function Button({
  className,
  color = 'black',
  disabled,
  onClick,
  onHover,
  children = null,
  hoverColor,
  filled,
  opacity,
  stretch,
  onMouseEnter = () => {},
  onMouseLeave = () => {},
  skeuomorphic,
  style = {},
  transparent
}) {
  const ButtonRef = useRef(null);
  const ButtonStyle = useMemo(() => {
    const colorKey = onHover ? hoverColor : color;
    const backgroundOpacity = opacity || (filled ? 1 : skeuomorphic ? 0.5 : 0);
    const backgroundHoverOpacity = transparent ? 0 : 0.9;
    const backgroundDisabledOpacity = filled || skeuomorphic ? 0.2 : 0;
    const textOpacity = disabled ? 0.2 : transparent ? 0.7 : 1;

    return `${css`
      cursor: ${disabled ? 'default' : 'pointer'};
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Ubuntu', sans-serif, Arial, Helvetica;
      text-transform: uppercase;
      font-weight: bold;
      line-height: 1.3;
      font-size: 1.5rem;
      padding: 1rem;
      color: ${!skeuomorphic && (filled || opacity)
        ? '#fff'
        : Color[colorKey](textOpacity)};
      background: ${skeuomorphic
        ? Color.white(opacity || 1)
        : Color[colorKey](
            disabled ? backgroundDisabledOpacity : backgroundOpacity
          )};
      border: 1px solid
        ${Color[colorKey](
          disabled ? backgroundDisabledOpacity : backgroundOpacity
        )};
      ${skeuomorphic && filled
        ? `border-color: ${Color[colorKey](
            disabled ? backgroundDisabledOpacity : backgroundHoverOpacity
          )};`
        : ''};
      border-radius: ${borderRadius};
      ${skeuomorphic
        ? disabled
          ? 'opacity: 0.5;'
          : `box-shadow: 0 0 1px ${Color[colorKey](0.5)};`
        : ''}
      &:focus {
        outline: ${(transparent || disabled || skeuomorphic) && 0};
      }
      ${skeuomorphic && filled
        ? `box-shadow: 0 0 3px ${Color[colorKey]()};`
        : ''}
      &:hover {
        background: ${skeuomorphic
          ? '#fff'
          : Color[hoverColor || color](
              disabled ? backgroundDisabledOpacity : backgroundHoverOpacity
            )};
        color: ${renderHoverColor()};
        border-color: ${Color[hoverColor || color](
          disabled ? backgroundDisabledOpacity : backgroundHoverOpacity
        )};
        ${skeuomorphic
          ? disabled
            ? ''
            : `box-shadow: 0 0 3px ${Color[hoverColor || color]()};`
          : ''};
      }
      @media (max-width: ${mobileMaxWidth}) {
        font-size: 1.3rem;
        &:hover {
          background: ${skeuomorphic
            ? '#fff'
            : Color[hoverColor || color](
                disabled ? backgroundDisabledOpacity : backgroundOpacity
              )};
          color: ${!skeuomorphic && (filled || opacity)
            ? '#fff'
            : Color[hoverColor || color](textOpacity)};
          box-shadow: ${skeuomorphic && filled
            ? `box-shadow: 0 0 1px ${Color[hoverColor || color](0.5)};`
            : 'none'};
          border: 1px solid
            ${Color[hoverColor || color](
              disabled
                ? backgroundDisabledOpacity
                : skeuomorphic && filled
                ? backgroundHoverOpacity
                : backgroundOpacity
            )};
        }
        ${stretch ? 'border-radius: 0;' : ''};
      }
    `} ${className} unselectable`;
    function renderHoverColor() {
      if (disabled) {
        if (!filled) {
          return Color[hoverColor || color](textOpacity);
        }
      } else if (skeuomorphic || transparent) {
        return Color[hoverColor || color]();
      }
      return '#fff';
    }
  }, [
    className,
    color,
    disabled,
    filled,
    hoverColor,
    onHover,
    opacity,
    skeuomorphic,
    stretch,
    transparent
  ]);
  return (
    <button
      style={{ ...style, ...(stretch ? { width: '100%' } : {}) }}
      className={ButtonStyle}
      ref={ButtonRef}
      onClick={(event) => {
        if (ButtonRef.current !== null) ButtonRef.current.blur();
        if (onClick) onClick(event);
      }}
      disabled={disabled}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </button>
  );
}

export default memo(Button);
