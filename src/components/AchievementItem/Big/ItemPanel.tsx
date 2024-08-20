import React, { useMemo, useState } from 'react';
import Icon from '~/components/Icon';
import ProgressBar from '~/components/ProgressBar';
import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';

const mockupAccomplishers = [
  {
    id: '1',
    profilePicUrl: '/img/default.png'
  },
  {
    id: '2',
    profilePicUrl: '/img/default.png'
  },
  {
    id: '3',
    profilePicUrl: '/img/default.png'
  },
  {
    id: '4',
    profilePicUrl: '/img/default.png'
  },
  {
    id: '5',
    profilePicUrl: '/img/default.png'
  },
  {
    id: '6',
    profilePicUrl: '/img/default.png'
  },
  {
    id: '7',
    profilePicUrl: '/img/default.png'
  },
  {
    id: '8',
    profilePicUrl: '/img/default.png'
  },
  {
    id: '9',
    profilePicUrl: '/img/default.png'
  },
  {
    id: '10',
    profilePicUrl: '/img/default.png'
  }
];

export default function ItemPanel({
  ap,
  itemName,
  isThumb,
  isNotification,
  isUnlocked,
  description,
  unlockMessage,
  requirements = [],
  badgeSrc,
  milestones,
  progressObj,
  style,
  accomplishers = mockupAccomplishers
}: {
  ap: number;
  itemName: string;
  isThumb?: boolean;
  isNotification?: boolean;
  isUnlocked?: boolean;
  description?: string;
  unlockMessage?: string;
  requirements?: React.ReactNode[];
  badgeSrc?: string;
  milestones?: { name: string; completed: boolean }[];
  progressObj?: { label: string; currentValue: number; targetValue: number };
  style?: React.CSSProperties;
  accomplishers?: { id: string; profilePicUrl: string }[]; // New prop type
}) {
  const milestonesShown = milestones && milestones.length > 0 && !isUnlocked;
  const displayedAP = useMemo(
    () => (typeof ap === 'number' ? addCommasToNumber(ap) : null),
    [ap]
  );
  const progress = useMemo(() => {
    if (progressObj) {
      const { currentValue, targetValue } = progressObj;
      return Math.ceil(100 * (currentValue / targetValue));
    } else {
      return 0;
    }
  }, [progressObj]);

  const [showAllAccomplishers, setShowAllAccomplishers] = useState(false);
  const displayedAccomplishers = showAllAccomplishers
    ? accomplishers
    : accomplishers.slice(0, 5);

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
            : 'requirements'}'
          'accomplishers accomplishers accomplishers';
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
            ${milestonesShown ? "'milestones'" : ''}
            'accomplishers';
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
      {!isThumb && (
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
          {!isNotification &&
            (isUnlocked ? (
              <Icon
                color={Color.green()}
                className={css`
                  margin-left: 1rem;
                `}
                icon="check"
              />
            ) : (
              <Icon
                className={css`
                  margin-left: 1rem;
                `}
                icon="lock"
              />
            ))}
        </h2>
      )}
      {!isThumb && (
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
            {!isNotification && isUnlocked && unlockMessage
              ? ` ${unlockMessage}`
              : ''}
          </p>
        </div>
      )}
      {!isThumb && (
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
              {!isNotification && isUnlocked && (
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
          {progressObj && !isUnlocked && (
            <div style={{ width: '100%', marginTop: '1.5rem' }}>
              <h3
                className={css`
                  margin-top: 1.7rem;
                  margin-bottom: -0.5rem;
                  font-weight: bold;
                  font-size: 1.5rem;
                  color: ${Color.black()};
                `}
              >
                {progressObj.label}:{' '}
                {addCommasToNumber(progressObj.currentValue)}
              </h3>
              <ProgressBar progress={progress} />
            </div>
          )}
        </div>
      )}
      {milestonesShown && !isNotification && !isThumb && (
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
      {accomplishers.length > 0 && (
        <div
          className={css`
            grid-area: accomplishers;
            margin-top: 1.5rem;
          `}
        >
          <div
            className={css`
              display: flex;
              flex-wrap: wrap;
              gap: 0.5rem;
              align-items: center;
              justify-content: center;
            `}
          >
            {displayedAccomplishers.map((accomplisher) => (
              <img
                key={accomplisher.id}
                src={accomplisher.profilePicUrl}
                alt="Accomplisher"
                className={css`
                  width: 2.5rem;
                  height: 2.5rem;
                  border-radius: 50%;
                  object-fit: cover;
                `}
              />
            ))}
            {accomplishers.length > 5 && (
              <button
                onClick={() => setShowAllAccomplishers(!showAllAccomplishers)}
                className={css`
                  background: none;
                  border: none;
                  color: ${Color.blue()};
                  cursor: pointer;
                  font-size: 1.3rem;
                  padding: 0.5rem;
                  &:hover {
                    text-decoration: underline;
                  }
                `}
              >
                ...more
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
