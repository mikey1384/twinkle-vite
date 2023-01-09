import { memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import { css } from '@emotion/css';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import Icon from '~/components/Icon';

Button.propTypes = {
  className: PropTypes.string,
  color: PropTypes.string,
  disabled: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  filled: PropTypes.bool,
  loading: PropTypes.bool,
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
  transparent: PropTypes.bool,
  mobilePadding: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  mobileBorderRadius: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
};

function Button({
  className,
  color = 'black',
  disabled,
  loading,
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
  transparent,
  mobilePadding,
  mobileBorderRadius
}) {
  const isDisabled = useMemo(() => disabled || loading, [disabled, loading]);
  const ButtonStyle = useMemo(() => {
    const colorKey = onHover ? hoverColor : color;
    const backgroundOpacity = opacity || (filled ? 1 : skeuomorphic ? 0.5 : 0);
    const backgroundHoverOpacity = transparent ? 0 : 0.9;
    const backgroundDisabledOpacity = filled || skeuomorphic ? 0.2 : 0;
    const textOpacity = isDisabled ? 0.2 : transparent ? 0.7 : 1;

    return `${css`
      display: flex;
      cursor: ${isDisabled ? 'default' : 'pointer'};
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
            isDisabled ? backgroundDisabledOpacity : backgroundOpacity
          )};
      border: 1px solid
        ${Color[colorKey](
          isDisabled ? backgroundDisabledOpacity : backgroundOpacity
        )};
      ${skeuomorphic && filled
        ? `border-color: ${Color[colorKey](
            isDisabled ? backgroundDisabledOpacity : backgroundHoverOpacity
          )};`
        : ''};
      border-radius: ${borderRadius};
      ${skeuomorphic
        ? isDisabled
          ? 'opacity: 0.5;'
          : `box-shadow: 0 0 1px ${Color[colorKey](0.5)};`
        : ''}
      &:focus {
        outline: ${(transparent || isDisabled || skeuomorphic) && 0};
      }
      ${skeuomorphic && filled
        ? `box-shadow: 0 0 3px ${Color[colorKey]()};`
        : ''}
      &:hover {
        background: ${skeuomorphic
          ? '#fff'
          : Color[hoverColor || color](
              isDisabled ? backgroundDisabledOpacity : backgroundHoverOpacity
            )};
        color: ${renderHoverColor()};
        border-color: ${Color[hoverColor || color](
          isDisabled ? backgroundDisabledOpacity : backgroundHoverOpacity
        )};
        ${skeuomorphic
          ? isDisabled
            ? ''
            : `box-shadow: 0 0 3px ${Color[hoverColor || color]()};`
          : ''};
      }
      @media (max-width: ${mobileMaxWidth}) {
        font-size: 1.3rem;
        padding: ${mobilePadding || '1rem'};
        border-radius: ${mobileBorderRadius || borderRadius};
        &:hover {
          background: ${skeuomorphic
            ? '#fff'
            : Color[hoverColor || color](
                isDisabled ? backgroundDisabledOpacity : backgroundOpacity
              )};
          color: ${!skeuomorphic && (filled || opacity)
            ? '#fff'
            : Color[hoverColor || color](textOpacity)};
          box-shadow: ${skeuomorphic && filled
            ? `box-shadow: 0 0 1px ${Color[hoverColor || color](0.5)};`
            : 'none'};
          border: 1px solid
            ${Color[hoverColor || color](
              isDisabled
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
      if (isDisabled) {
        if (!filled) {
          return Color[hoverColor || color](textOpacity);
        }
      } else if (skeuomorphic || transparent) {
        return Color[hoverColor || color]();
      }
      return '#fff';
    }
  }, [
    onHover,
    hoverColor,
    color,
    opacity,
    filled,
    skeuomorphic,
    transparent,
    isDisabled,
    mobilePadding,
    mobileBorderRadius,
    stretch,
    className
  ]);
  return (
    <button
      style={{ ...style, ...(stretch ? { width: '100%' } : {}) }}
      className={ButtonStyle}
      onClick={onClick}
      disabled={isDisabled}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
      {loading && (
        <Icon style={{ marginLeft: '0.7rem' }} icon="spinner" pulse />
      )}
    </button>
  );
}

export default memo(Button);
