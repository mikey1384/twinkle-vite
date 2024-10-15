import React, { useMemo } from 'react';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useKeyContext } from '~/contexts';

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
  const {
    chatFlatButton: {
      color: defaultButtonColor,
      opacity: defaultButtonOpacity
    },
    chatFlatButtonHovered: { color: defaultButtonHoveredColor },
    chatFlatButtonText: {
      color: defaultTextColor,
      shadow: defaultTextShadowColor
    }
  } = useKeyContext((v) => v.theme);

  const buttonBackgroundColor = useMemo(
    () => buttonColor || Color[defaultButtonColor](defaultButtonOpacity),
    [buttonColor, defaultButtonColor, defaultButtonOpacity]
  );

  const buttonHoverBackgroundColor = useMemo(
    () => buttonHoverColor || Color[defaultButtonHoveredColor](),
    [buttonHoverColor, defaultButtonHoveredColor]
  );

  return (
    <button
      className={css`
        width: 100%;
        padding: 0.75rem 1rem;
        background: ${buttonBackgroundColor};
        color: ${Color[textColor || defaultTextColor]()};
        ${textShadowColor || defaultTextShadowColor
          ? `text-shadow: 0 0 1px ${Color[
              textShadowColor || defaultTextShadowColor
            ]()}`
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
      onClick={onClick}
      disabled={disabled}
    >
      <Icon icon={icon} />
      <div style={{ marginLeft: '0.5rem' }}>{label}</div>
    </button>
  );
}
