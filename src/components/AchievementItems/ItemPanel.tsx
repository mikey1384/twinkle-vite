import React, { useMemo } from 'react';
import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import Icon from '~/components/Icon';
import { addCommasToNumber } from '~/helpers/stringHelpers';

export default function ItemPanel({
  ap,
  itemName,
  isNotification,
  isUnlocked,
  description,
  unlockMessage,
  requirements = [],
  badgeSrc,
  milestones,
  style
}: {
  ap: number;
  itemName: string;
  isNotification?: boolean;
  isUnlocked?: boolean;
  description?: string;
  unlockMessage?: string;
  requirements?: React.ReactNode[];
  badgeSrc?: string;
  milestones?: { name: string; completed: boolean }[];
  style?: React.CSSProperties;
}) {
  const milestonesShown = milestones && milestones.length > 0 && !isUnlocked;
  const displayedAP = useMemo(
    () => (typeof ap === 'number' ? addCommasToNumber(ap) : null),
    [ap]
  );
  return (
    <div
      className={css`
        display: grid;
        grid-template-columns: auto 1fr 1fr;
        grid-template-areas:
          'badge title title'
          'badge description description'
          'badge requirements ${milestonesShown
            ? 'milestones'
            : 'requirements'}';
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
            ${milestonesShown ? "'milestones'" : ''};
          border-radius: 0;
          border-right: 0;
          border-left: 0;
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
          color: ${Color.black()};
          font-size: 2rem;
        `}
      >
        {itemName}
        {displayedAP && (
          <span
            className={css`
              margin-left: 0.5rem;
              font-size: 1.6rem;
              color: ${Color.darkGray()};
              font-weight: normal;
            `}
          >
            ({displayedAP} AP)
          </span>
        )}
        {!isUnlocked && !isNotification && (
          <Icon
            className={css`
              margin-left: 1rem;
            `}
            icon="lock"
          />
        )}
      </h2>
      <div
        className={css`
          grid-area: description;
        `}
      >
        <p
          className={css`
            color: ${Color.darkerGray()};
            font-size: 1.5rem;
          `}
        >
          {description}
          {isUnlocked && unlockMessage ? ` ${unlockMessage}` : ''}
        </p>
      </div>
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
          Requirement{requirements.length > 1 ? 's' : ''}
        </h3>
        {requirements.map((requirement, index) => (
          <div
            key={index}
            className={css`
              margin-top: 0.3rem;
              color: ${Color.darkerGray()};
              font-size: 1.3rem;
            `}
          >
            {isUnlocked && (
              <div
                className={css`
                  display: inline-block;
                  font-size: 1.6rem;
                  width: 2rem;
                `}
              >
                <Icon color={Color.green()} icon="check" />
              </div>
            )}
            {!isUnlocked && requirements.length > 1 ? (
              <span
                className={css`
                  font-weight: bold;
                  margin-right: 0.5rem;
                `}
              >
                {`${index + 1}.`}
              </span>
            ) : (
              ''
            )}
            {requirement}
          </div>
        ))}
      </div>
      {milestonesShown && !isNotification && (
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
            Check List
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
                <div
                  className={css`
                    display: inline-block;
                    font-size: 1.6rem;
                    width: 2rem;
                  `}
                >
                  {milestone.completed ? (
                    <Icon color={Color.green()} icon="check" />
                  ) : !isNotification ? (
                    <Icon icon="times" />
                  ) : (
                    ' '
                  )}
                </div>
                {milestone.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
