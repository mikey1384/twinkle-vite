import React from 'react';
import CloseButton from '~/components/Buttons/CloseButton';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

export default function SelectedStyle({
  selectedStyle,
  onClear,
  style
}: {
  selectedStyle: string;
  onClear: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        position: 'relative',
        fontWeight: 'bold',
        fontSize: '2rem',
        fontFamily: "'Roboto', sans-serif",
        color: Color.logoBlue(),
        display: 'flex',
        ...style
      }}
      className={css`
        font-size: 2rem;
        @media (max-width: ${mobileMaxWidth}) {
          font-size: 1.5rem;
        }
      `}
    >
      {selectedStyle || 'Any'}
      {selectedStyle && (
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            marginLeft: '0.7rem'
          }}
        >
          <CloseButton
            style={{
              padding: 0,
              margin: 0,
              right: 0,
              top: 0,
              display: 'block',
              position: 'static',
              width: '1.7rem',
              height: '1.7rem',
              background: Color.logoBlue()
            }}
            onClick={onClear}
          />
        </div>
      )}
    </div>
  );
}
