import React from 'react';
import { innerBorderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { useRoleColor } from '~/theme/useRoleColor';

export default function Checkbox({
  backgroundColor = Color.inputGray(),
  className,
  checked,
  label,
  onClick,
  style,
  textIsClickable
}: {
  backgroundColor?: string;
  className?: string;
  checked: boolean;
  label?: string;
  onClick: () => void;
  style?: React.CSSProperties;
  textIsClickable?: boolean;
}) {
  const switchRole = useRoleColor('switch', { fallback: 'logoBlue' });
  const switchColor = switchRole.colorKey || 'logoBlue';

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        fontSize: '1.2rem',
        ...style
      }}
    >
      {label && (
        <p
          style={{
            color: Color.darkerGray(),
            cursor: textIsClickable ? 'pointer' : 'default'
          }}
          onClick={textIsClickable ? onClick : () => null}
        >
          {label}
          &nbsp;&nbsp;
        </p>
      )}
      <div
        onClick={onClick}
        style={{
          borderRadius: innerBorderRadius,
          border: '1px solid var(--ui-border)',
          width: '2rem',
          height: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          background: checked ? Color[switchColor]() : backgroundColor
        }}
      >
        {checked && (
          <div
            className={css`
              display: inline-block;
              width: 0.6rem;
              height: 1rem;
              margin-top: 2%;
              border: solid #fff;
              border-width: 0 3px 3px 0;
              transform: rotate(45deg);
              @media (max-width: ${mobileMaxWidth}) {
                border-width: 0 2px 2px 0;
              }
            `}
          />
        )}
      </div>
    </div>
  );
}
