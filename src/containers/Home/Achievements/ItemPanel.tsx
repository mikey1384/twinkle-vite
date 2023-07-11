import React from 'react';
import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';

export default function ItemPanel({
  itemName,
  description,
  requirements,
  badgeSrc,
  style
}: {
  itemName: string;
  description?: string;
  requirements?: string[];
  badgeSrc?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={css`
        display: grid;
        grid-template-columns: auto 1fr;
        grid-template-areas:
          'badge title'
          'badge description'
          'badge requirements';
        gap: 2rem;
        align-items: start;
        border: 1px solid ${Color.borderGray()};
        border-radius: ${borderRadius};
        padding: 1rem;
        background: #fff;
        @media (max-width: ${mobileMaxWidth}) {
          grid-template-columns: 1fr;
          grid-template-areas:
            'title'
            'badge'
            'description'
            'requirements';
          border-radius: 0;
          text-align: center;
        }
      `}
      style={style}
    >
      {badgeSrc && (
        <img
          src={badgeSrc}
          alt="Badge"
          className={css`
            grid-area: badge;
            width: 13rem;
            height: 13rem;
            justify-self: center;
          `}
        />
      )}
      <h2
        className={css`
          grid-area: title;
          font-weight: bold;
          font-size: 2rem;
          color: ${Color.black()};
        `}
      >
        {itemName}
      </h2>
      <p
        className={css`
          grid-area: description;
          color: ${Color.darkerGray()};
          font-size: 1.3rem;
        `}
      >
        {description}
      </p>
      <div
        className={css`
          grid-area: requirements;
        `}
      >
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
    </div>
  );
}
