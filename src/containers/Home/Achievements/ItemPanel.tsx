import React from 'react';
import { css } from '@emotion/css';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';

export default function ItemPanel({
  itemName,
  description,
  requirements,
  style
}: {
  itemName: string;
  description?: string;
  requirements?: string[];
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={css`
        border: 1px solid ${Color.borderGray()};
        border-radius: ${borderRadius};
        padding: 1rem;
        background: #fff;
        @media (max-width: ${mobileMaxWidth}) {
          border-radius: 0;
        }
      `}
      style={style}
    >
      <div
        style={{ fontWeight: 'bold', fontSize: '2rem', color: Color.black() }}
      >
        {itemName}
      </div>
      <div style={{ color: Color.darkerGray(), fontSize: '1.3rem' }}>
        {description}
      </div>
      <div
        style={{
          marginTop: '1.5rem',
          fontWeight: 'bold',
          fontSize: '1.7rem',
          color: Color.black()
        }}
      >
        Requirement{requirements?.length === 1 ? '' : 's'}
      </div>
      {requirements && (
        <ul>
          {requirements.map((requirement, index) => (
            <li
              key={index}
              style={{ color: Color.darkerGray(), fontSize: '1.3rem' }}
            >
              {requirement}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
