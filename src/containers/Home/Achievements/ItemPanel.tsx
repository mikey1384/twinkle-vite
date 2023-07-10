import React from 'react';
import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';

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
        display: grid;
        grid-template-columns: 1fr;
        gap: 1rem;
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
      <h2
        className={css`
          font-weight: bold;
          font-size: 2rem;
          color: ${Color.black()};
        `}
      >
        {itemName}
      </h2>
      <p
        className={css`
          color: ${Color.darkerGray()};
          font-size: 1.3rem;
        `}
      >
        {description}
      </p>
      <h3
        className={css`
          margin-top: 1.5rem;
          font-weight: bold;
          font-size: 1.7rem;
          color: ${Color.black()};
        `}
      >
        Requirement{requirements?.length === 1 ? '' : 's'}
      </h3>
      {requirements && (
        <ul
          className={css`
            list-style: none;
            padding-left: 0;
          `}
        >
          {requirements.map((requirement, index) => (
            <li
              key={index}
              className={css`
                color: ${Color.darkerGray()};
                font-size: 1.3rem;
              `}
            >
              {requirement}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
