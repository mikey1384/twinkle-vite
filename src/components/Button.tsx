import React, { CSSProperties, ReactNode, useMemo } from 'react';
import { css } from '@emotion/css';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import Icon from '~/components/Icon';
import ErrorBoundary from '~/components/ErrorBoundary';

export default function Button({
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
  onMouseEnter = () => null,
  onMouseLeave = () => null,
  skeuomorphic,
  style = {},
  transparent,
  mobilePadding,
  mobileBorderRadius
}: {
  className?: string;
  color?: string;
  disabled?: boolean;
  loading?: boolean;
  onClick: (arg: any) => any;
  onHover?: boolean;
  children?: ReactNode;
  hoverColor?: string;
  filled?: boolean;
  opacity?: number;
  stretch?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  skeuomorphic?: boolean;
  style?: CSSProperties;
  transparent?: boolean;
  mobilePadding?: string;
  mobileBorderRadius?: string;
}) {
  const isDisabled = useMemo(() => disabled || loading, [disabled, loading]);
  const textOpacity = useMemo(
    () => (isDisabled ? 0.2 : transparent ? 0.7 : 1),
    [isDisabled, transparent]
  );
  const buttonCSS = useMemo(() => {
    const appliedHoverColor = getHoverColor({
      isDisabled,
      filled,
      skeuomorphic,
      transparent,
      textOpacity,
      hoverColor,
      color
    });
    const colorKey = (onHover ? hoverColor : color) || 'black';
    const backgroundOpacity = opacity || (filled ? 1 : skeuomorphic ? 0.5 : 0);
    const backgroundHoverOpacity = transparent ? 0 : 0.9;
    const backgroundDisabledOpacity = filled || skeuomorphic ? 0.2 : 0;

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
        ${isDisabled ? '' : `color: ${appliedHoverColor};`}
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
  }, [
    isDisabled,
    filled,
    skeuomorphic,
    transparent,
    textOpacity,
    hoverColor,
    color,
    onHover,
    opacity,
    mobilePadding,
    mobileBorderRadius,
    stretch,
    className
  ]);

  const buttonStyle = useMemo(
    () => ({ ...style, ...(stretch ? { width: '100%' } : {}) }),
    [style, stretch]
  );

  const validatedChildren = useMemo(() => {
    if (
      React.isValidElement(children) ||
      Array.isArray(children) ||
      typeof children === 'string'
    ) {
      return children;
    }
    return null;
  }, [children]);

  return (
    <ErrorBoundary componentPath="Button">
      <button
        style={buttonStyle}
        className={buttonCSS}
        onClick={onClick}
        disabled={isDisabled}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {validatedChildren}
        {loading && (
          <Icon style={{ marginLeft: '0.7rem' }} icon="spinner" pulse />
        )}
      </button>
    </ErrorBoundary>
  );

  function getHoverColor({
    isDisabled,
    filled,
    skeuomorphic,
    transparent,
    textOpacity,
    hoverColor,
    color
  }: {
    isDisabled?: boolean;
    filled?: boolean;
    skeuomorphic?: boolean;
    transparent?: boolean;
    textOpacity: number;
    hoverColor?: string;
    color: string;
  }): string {
    if (isDisabled) {
      if (!filled) {
        return Color[hoverColor || color](textOpacity);
      }
    } else if (skeuomorphic || transparent) {
      return Color[hoverColor || color]();
    }
    return '#fff';
  }
}
