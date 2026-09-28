import React from 'react';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { Color, mobileMaxWidth } from '~/constants/css';
import type { BoardCrew } from './types';

// "Looking for a crew": usernames and branch names only, nothing else.
export default function CrewBoard({
  crews,
  canJoin,
  joiningCrewId,
  onJoin
}: {
  crews: BoardCrew[];
  canJoin: boolean;
  joiningCrewId: number;
  onJoin: (crewId: number) => void;
}) {
  if (!crews.length) {
    return (
      <p
        className={css`
          font-size: 1.4rem;
          color: ${Color.darkGray()};
          margin: 0;
        `}
      >
        No crews are looking for members right now. Start one and it will show
        up here for others.
      </p>
    );
  }
  return (
    <ul
      className={css`
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(26rem, 1fr));
        gap: 1rem;
        @media (max-width: ${mobileMaxWidth}) {
          grid-template-columns: 1fr;
        }
      `}
    >
      {crews.map((crew) => (
        <li
          key={crew.crewId}
          className={css`
            border: 1px solid var(--ui-border);
            border-radius: 1rem;
            padding: 1.2rem;
            background: #fff;
            display: flex;
            flex-direction: column;
            gap: 0.8rem;
            transition: box-shadow 0.2s ease, transform 0.2s ease;
            &:hover {
              box-shadow: 0 0.4rem 1.2rem ${Color.black(0.08)};
              transform: translateY(-2px);
            }
          `}
        >
          <div
            className={css`
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 1.3rem;
              color: ${Color.darkGray()};
            `}
          >
            <span>
              <Icon icon="users" /> Crew #{crew.crewId}
            </span>
            <span>
              Students {crew.students}/3 · Branches {Math.min(crew.branches, 3)}/3
            </span>
          </div>
          <ul
            className={css`
              list-style: none;
              margin: 0;
              padding: 0;
              display: flex;
              flex-direction: column;
              gap: 0.3rem;
              font-size: 1.4rem;
            `}
          >
            {crew.members.map((member) => (
              <li key={member.username}>
                <b>{member.username}</b>
                <span style={{ color: Color.darkGray() }}> · {member.branch}</span>
              </li>
            ))}
          </ul>
          <div
            className={css`
              font-size: 1.3rem;
              color: ${crew.crewReady ? Color.green() : Color.orange()};
              font-weight: bold;
            `}
          >
            {crew.hint}
          </div>
          {canJoin && (
            <Button
              size="sm"
              color="logoBlue"
              loading={joiningCrewId === crew.crewId}
              disabled={!!joiningCrewId}
              onClick={() => onJoin(crew.crewId)}
            >
              <Icon icon="user-plus" style={{ marginRight: '0.5rem' }} />
              Join this crew
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}
