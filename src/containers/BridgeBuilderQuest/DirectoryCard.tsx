import React from 'react';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import ProfilePic from '~/components/ProfilePic';
import { Color } from '~/constants/css';
import CrewCover from './CrewCover';
import type { DirectoryCrew } from './types';

export function crewPath(crewId: number) {
  return `/achievements/bridge-builder/crew/${crewId}`;
}

export function BranchChips({ names }: { names: string[] }) {
  return (
    <div
      className={css`
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
      `}
    >
      {names.map((name) => (
        <span
          key={name}
          className={css`
            padding: 0.15rem 0.8rem;
            border-radius: 999px;
            background: ${Color.logoBlue(0.1)};
            color: ${Color.darkBlue()};
            font-size: 1.15rem;
            font-weight: bold;
          `}
        >
          {name}
        </span>
      ))}
    </div>
  );
}

export function MemberAvatars({
  members,
  size = '3rem'
}: {
  members: { userId: number; profilePicUrl?: string; username: string }[];
  size?: string;
}) {
  const shown = members.slice(0, 5);
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {shown.map((member, index) => (
        <span
          key={member.userId}
          title={member.username}
          className={css`
            width: ${size};
            height: ${size};
            border-radius: 50%;
            border: 2px solid #fff;
            margin-left: ${index ? '-0.8rem' : '0'};
            background: #fff;
            overflow: hidden;
            display: inline-flex;
          `}
        >
          <ProfilePic
            userId={member.userId}
            profilePicUrl={member.profilePicUrl}
            style={{ width: '100%', height: '100%' }}
          />
        </span>
      ))}
      {members.length > shown.length && (
        <span
          className={css`
            margin-left: 0.4rem;
            font-size: 1.2rem;
            color: ${Color.darkGray()};
          `}
        >
          +{members.length - shown.length}
        </span>
      )}
    </div>
  );
}

export default function DirectoryCard({
  crew,
  achievementTitle,
  onJoin
}: {
  crew: DirectoryCrew;
  achievementTitle: string;
  onJoin: (crew: DirectoryCrew) => void;
}) {
  const navigate = useNavigate();
  const done = crew.status === 'completed';
  return (
    <article
      onClick={() => navigate(crewPath(crew.crewId))}
      className={css`
        display: flex;
        flex-direction: column;
        border-radius: 1.2rem;
        border: 1px solid var(--ui-border);
        background: #fff;
        cursor: pointer;
        min-width: 0;
        transition: box-shadow 0.2s ease, transform 0.2s ease;
        &:hover {
          box-shadow: 0 0.6rem 1.8rem rgba(0, 0, 0, 0.1);
          transform: translateY(-3px);
        }
      `}
    >
      <CrewCover
        cover={crew.cover}
        height="8.5rem"
        stage={crew.stage}
        achievementTitle={achievementTitle}
      />
      <div
        className={css`
          padding: 1.1rem 1.2rem 1.2rem;
          display: flex;
          flex-direction: column;
          gap: 0.7rem;
          flex: 1;
        `}
      >
        <div>
          <h3
            className={css`
              margin: 0;
              font-size: 1.6rem;
              font-weight: bold;
              color: ${Color.black()};
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            `}
          >
            {crew.displayName}
          </h3>
          <div
            className={css`
              font-size: 1.2rem;
              color: ${Color.darkGray()};
            `}
          >
            <Icon icon="crown" style={{ color: Color.gold() }} /> {crew.founderUsername}
          </div>
        </div>
        <BranchChips names={crew.branchNames} />
        <div
          className={css`
            display: flex;
            align-items: center;
            gap: 0.8rem;
            flex-wrap: wrap;
          `}
        >
          <MemberAvatars members={crew.members} />
          <span
            className={css`
              font-size: 1.2rem;
              color: ${Color.darkerGray()};
            `}
          >
            {crew.students} student{crew.students === 1 ? '' : 's'} · {crew.branches}{' '}
            branch{crew.branches === 1 ? '' : 'es'}
          </span>
        </div>
        {!done && (
          <div
            className={css`
              font-size: 1.25rem;
              font-weight: bold;
              color: ${crew.stage === 'forming' ? Color.orange() : Color.darkerGray()};
            `}
          >
            {crew.hint}
          </div>
        )}
        <div style={{ marginTop: 'auto' }} onClick={(event) => event.stopPropagation()}>
          {crew.isMine ? (
            <Button size="sm" variant="soft" color="green" stretch onClick={() => navigate(crewPath(crew.crewId))}>
              Your crew
            </Button>
          ) : crew.inviteId ? (
            <Button size="sm" color="purple" stretch onClick={() => onJoin(crew)}>
              <Icon icon="user-plus" style={{ marginRight: '0.5rem' }} />
              Accept invite
            </Button>
          ) : crew.joinable ? (
            <Button size="sm" color="logoBlue" stretch onClick={() => onJoin(crew)}>
              <Icon icon="user-plus" style={{ marginRight: '0.5rem' }} />
              Join
            </Button>
          ) : (
            <Button
              size="sm"
              variant="soft"
              color="darkGray"
              stretch
              onClick={() => navigate(crewPath(crew.crewId))}
            >
              {done ? 'See the crew' : 'View crew'}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
