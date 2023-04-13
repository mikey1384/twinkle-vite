import React, { CSSProperties } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';
import { useTheme } from '~/helpers/hooks';
import { useKeyContext } from '~/contexts';

interface Props {
  color?: string;
  disabled?: boolean;
  checked?: boolean;
  label?: any;
  onChange?: () => void;
  small?: boolean;
  theme?: string;
  labelStyle?: CSSProperties;
  style?: any;
}
export default function SwitchButton({
  color,
  disabled,
  checked,
  label,
  onChange,
  small,
  theme,
  labelStyle = { fontSize: small ? '1.1rem' : '1.3rem' },
  style
}: Props) {
  const { profileTheme } = useKeyContext((v) => v.myState);
  const {
    switch: { color: switchColor }
  } = useTheme(theme || profileTheme);

  return (
    <ErrorBoundary
      componentPath="SwitchButton"
      style={{
        display: 'flex',
        flexDirection: small ? 'column' : 'row',
        alignItems: 'center',
        ...style,
        ...(disabled ? { opacity: 0.2 } : {})
      }}
    >
      {label && (
        <div
          style={{
            marginRight: small ? 0 : '1rem',
            ...labelStyle
          }}
        >
          {label}
        </div>
      )}
      <label
        className={css`
          position: relative;
          display: inline-block;
          width: ${small ? '35px' : '60px'};
          height: ${small ? '19px' : '34px'};
          input {
            display: none;
          }
        `}
      >
        <input
          className={css`
            &:checked + span {
              background-color: ${color || Color[switchColor]()};
            }
            &:checked + span:before {
              transform: translateX(${small ? 16 : 26}px);
            }
          `}
          checked={checked}
          onChange={disabled ? () => {} : onChange}
          type="checkbox"
        />
        <span
          className={css`
            position: absolute;
            cursor: ${disabled ? 'default' : 'pointer'};
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #ccc;
            transition: 0.4s;
            border-radius: ${small ? '30px' : '34px'};
            &:before {
              position: absolute;
              content: '';
              height: ${small ? '15px' : '26px'};
              width: ${small ? '15px' : '26px'};
              left: ${small ? '2px' : '4px'};
              bottom: ${small ? '2px' : '4px'};
              background-color: white;
              transition: 0.4s;
              border-radius: 50%;
            }
          `}
        />
      </label>
    </ErrorBoundary>
  );
}
