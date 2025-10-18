import React, { useMemo } from 'react';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useRoleColor } from '~/theme/useRoleColor';
import { resolveColorValue } from '~/theme/resolveColor';

export default function ChatFlatButton({
  label = 'Button',
  onClick,
  buttonColor,
  buttonHoverColor,
  textColor,
  textShadowColor,
  icon = 'plus',
  disabled = false,
  style
}: {
  label?: string;
  onClick: () => void;
  buttonColor?: string;
  buttonHoverColor?: string;
  textColor?: string;
  textShadowColor?: string;
  icon?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}) {
  const buttonRole = useRoleColor('chatFlatButton', {
    fallback: 'logoBlue'
  });
  const hoverRole = useRoleColor('chatFlatButtonHovered', {
    fallback: buttonRole.colorKey
  });
  const textRole = useRoleColor('chatFlatButtonText', {
    fallback: 'white'
  });

  const resolvedCustomButtonColor = useMemo(() => {
    if (!buttonColor) return undefined;
    const candidate = Color[buttonColor as keyof typeof Color];
    if (typeof candidate === 'function') {
      return candidate(buttonRole.defaultOpacity);
    }
    if (typeof candidate === 'string') return candidate;
    return buttonColor;
  }, [buttonColor, buttonRole.defaultOpacity]);

  const resolvedCustomHoverColor = useMemo(() => {
    if (!buttonHoverColor) return undefined;
    const candidate = Color[buttonHoverColor as keyof typeof Color];
    if (typeof candidate === 'function') {
      return candidate();
    }
    if (typeof candidate === 'string') return candidate;
    return buttonHoverColor;
  }, [buttonHoverColor]);

  const resolvedTextColor = useMemo(() => {
    if (textColor) {
      const candidate = Color[textColor as keyof typeof Color];
      if (typeof candidate === 'function') return candidate();
      if (typeof candidate === 'string') return candidate;
      return textColor;
    }
    return textRole.getColor() || Color.white();
  }, [textColor, textRole]);

  const resolvedTextShadow = useMemo(() => {
    if (textShadowColor) {
      const candidate = Color[textShadowColor as keyof typeof Color];
      if (typeof candidate === 'function') return candidate();
      if (typeof candidate === 'string') return candidate;
      return textShadowColor;
    }
    if (textRole.token?.shadow) {
      return (
        resolveColorValue(textRole.token.shadow) ||
        Color.logoBlue()
      );
    }
    return undefined;
  }, [textShadowColor, textRole.token]);

  const buttonBackgroundColor = useMemo(
    () =>
      resolvedCustomButtonColor ||
      buttonRole.getColor(buttonRole.defaultOpacity) ||
      Color.logoBlue(),
    [resolvedCustomButtonColor, buttonRole]
  );

  const buttonHoverBackgroundColor = useMemo(
    () =>
      resolvedCustomHoverColor ||
      hoverRole.getColor() ||
      buttonBackgroundColor,
    [resolvedCustomHoverColor, hoverRole, buttonBackgroundColor]
  );

  return (
    <button
      className={css`
        width: 100%;
        padding: 0.75rem 1rem;
        background: ${buttonBackgroundColor};
        color: ${resolvedTextColor};
        ${
          resolvedTextShadow
            ? `text-shadow: 0 0 1px ${resolvedTextShadow}`
          : ''};
        display: flex;
        border: none;
        justify-content: center;
        align-items: center;
        border-radius: 5px;
        cursor: ${disabled ? 'not-allowed' : 'pointer'};
        transition: all 0.2s;
        font-size: 1.5rem;
        font-weight: bold;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        opacity: ${disabled ? 0.6 : 1};

        ${!disabled &&
        `
          &:hover {
            background: ${buttonHoverBackgroundColor};
            transform: translateY(2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
          }

          &:active {
            transform: translateY(0);
            box-shadow: 0 2px 3px rgba(0, 0, 0, 0.1);
          }
        `}

        @media (max-width: ${mobileMaxWidth}) {
          font-size: 1.2rem;
        }
      `}
      style={style}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      <Icon icon={icon} />
      <div style={{ marginLeft: '0.5rem' }}>{label}</div>
    </button>
  );
}
