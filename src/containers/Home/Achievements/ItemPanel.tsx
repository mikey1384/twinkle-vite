import React from 'react';
import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import Icon from '~/components/Icon';

export default function ItemPanel({
  itemName,
  description,
  requirements,
  badgeSrc,
  milestones,
  style
}: {
  itemName: string;
  description?: string;
  requirements?: React.ReactNode[];
  badgeSrc?: string;
  milestones?: { name: string; completed: boolean }[];
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={css`
        display: grid;
        grid-template-columns: auto 1fr 1fr;
        grid-template-areas:
          'badge title title'
          'badge description description'
          'badge requirements milestones';
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
            'requirements'
            'milestones';
          border-radius: 0;
          border-right: 0;
          border-left: 0;
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
      {!!milestones?.length && (
        <div
          className={css`
            grid-area: milestones;
            margin-top: 1.5rem;
          `}
        >
          <h3
            className={css`
              font-weight: bold;
              font-size: 1.7rem;
              color: ${Color.black()};
            `}
          >
            Progress
          </h3>
          <ul
            className={css`
              list-style: none;
              padding-left: 0;
            `}
          >
            {milestones.map((milestone, index) => (
              <li
                key={index}
                className={css`
                  justify-content: flex-start;
                  display: flex;
                  align-items: center;
                  color: ${Color.darkerGray()};
                  font-size: 1.3rem;
                  border-bottom: 1px solid ${Color.borderGray()};
                  @media (max-width: ${mobileMaxWidth}) {
                    justify-content: center;
                  }
                `}
              >
                <span
                  className={css`
                    display: inline-block;
                    font-size: 1.6rem;
                    width: 2rem;
                  `}
                >
                  {milestone.completed ? (
                    <Icon color={Color.green()} icon="check" />
                  ) : (
                    ' '
                  )}
                </span>
                {milestone.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
