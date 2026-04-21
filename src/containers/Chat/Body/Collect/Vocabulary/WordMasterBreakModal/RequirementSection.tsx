import React from 'react';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import Icon from '~/components/Icon';
import ProfilePic from '~/components/ProfilePic';
import { Color, mobileMaxWidth } from '~/constants/css';
import { timeSinceShort } from '~/helpers/timeStampHelpers';
import {
  RequirementSectionProps,
  SuggestedOmokUser
} from './types';
import { getToneColor } from './utils';

export default function RequirementSection({
  title,
  description,
  rows,
  footer,
  extra,
  tone
}: RequirementSectionProps) {
  return (
    <section
      className={css`
        padding: 1.8rem;
        border-radius: 1.2rem;
        border: 1px solid ${Color.borderGray()};
        background: ${Color.white()};
        display: flex;
        flex-direction: column;
        gap: 1.4rem;
        box-shadow: 0 10px 20px ${Color.black(0.04)};
      `}
    >
      <SectionHeader title={title} description={description} tone={tone} />
      <div
        className={css`
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
        `}
      >
        {rows.map((row) => (
          <RequirementRow
            key={row.label}
            label={row.label}
            done={row.done}
            onClick={row.onClick}
          />
        ))}
      </div>
      {extra ? extra : null}
      {footer ? (
        <div
          className={css`
            font-size: 1.2rem;
            color: ${Color.gray()};
            font-weight: 600;
          `}
        >
          {footer}
        </div>
      ) : null}
    </section>
  );
}

export function SectionHeader({
  title,
  description,
  tone
}: {
  title: string;
  description?: React.ReactNode;
  tone?: string;
}) {
  const accentColor = getToneColor(tone);
  return (
    <div
      className={css`
        display: flex;
        align-items: flex-start;
        gap: 0.9rem;
      `}
    >
      <div
        className={css`
          width: 0.7rem;
          height: 2.6rem;
          border-radius: 999px;
          background: ${accentColor};
          margin-top: 0.2rem;
        `}
      />
      <div>
        <div
          className={css`
            font-size: 1.6rem;
            font-weight: 700;
            color: ${Color.darkerGray()};
          `}
        >
          {title}
        </div>
        {description ? (
          <div
            className={css`
              font-size: 1.2rem;
              color: ${Color.gray()};
              margin-top: 0.3rem;
            `}
          >
            {description}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function SuggestedOmokPlayers({
  hidden,
  users,
  onSelectUser,
  onBrowse
}: {
  hidden?: boolean;
  users: SuggestedOmokUser[];
  onSelectUser?: (user: SuggestedOmokUser) => void;
  onBrowse?: () => void;
}) {
  if (hidden) return null;
  const hasUsers = users.length > 0;
  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        gap: 0.9rem;
        padding: 0.9rem 1rem;
        border-radius: 1rem;
        border: 1px solid ${Color.borderGray()};
        background: ${Color.whiteGray()};
      `}
    >
      <div
        className={css`
          font-size: 1.2rem;
          color: ${Color.gray()};
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        `}
      >
        Suggested players
      </div>
      {hasUsers ? (
        <div
          className={css`
            display: flex;
            flex-direction: column;
            gap: 0.8rem;
          `}
        >
          {users.map((user) => (
            <SuggestedOmokPlayerRow
              key={user.id}
              user={user}
              onSelect={onSelectUser}
            />
          ))}
        </div>
      ) : (
        <div
          className={css`
            font-size: 1.2rem;
            color: ${Color.darkGray()};
          `}
        >
          No recent players right now.
        </div>
      )}
      {!hasUsers && onBrowse ? (
        <div>
          <Button variant="ghost" onClick={onBrowse}>
            Browse users
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function RequirementRow({
  label,
  done,
  onClick
}: {
  label: string;
  done: boolean;
  onClick?: () => void;
}) {
  const isClickable = Boolean(onClick) && !done;
  return (
    <div
      className={css`
        display: flex;
        align-items: center;
        gap: 0.8rem;
        font-size: 1.3rem;
        font-weight: 600;
        color: ${done ? Color.green() : Color.darkerGray()};
        @media (max-width: ${mobileMaxWidth}) {
          font-size: 1.2rem;
        }
      `}
    >
      <Icon
        icon={done ? 'check' : 'times'}
        style={{ color: done ? Color.green() : Color.gray() }}
      />
      {isClickable ? (
        <span
          role="button"
          tabIndex={0}
          onClick={onClick}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onClick?.();
            }
          }}
          className={css`
            color: ${Color.logoBlue()};
            cursor: pointer;
            text-decoration: underline;
            text-underline-offset: 2px;

            &:hover {
              color: ${Color.darkBlue()};
            }
          `}
        >
          {label}
        </span>
      ) : (
        <span>{label}</span>
      )}
    </div>
  );
}

function SuggestedOmokPlayerRow({
  user,
  onSelect
}: {
  user: SuggestedOmokUser;
  onSelect?: (user: SuggestedOmokUser) => void;
}) {
  const lastActiveLabel =
    typeof user.lastActive === 'number'
      ? `Active ${timeSinceShort(user.lastActive)} ago`
      : 'Recently active';
  return (
    <div
      className={css`
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.7rem 0.9rem;
        border-radius: 0.9rem;
        background: ${Color.white()};
        border: 1px solid ${Color.borderGray()};
        @media (max-width: ${mobileMaxWidth}) {
          flex-direction: column;
          align-items: stretch;
        }
      `}
    >
      <div
        className={css`
          display: flex;
          align-items: center;
          gap: 0.8rem;
        `}
      >
        <ProfilePic
          userId={user.id}
          profilePicUrl={user.profilePicUrl}
          size="3rem"
        />
        <div>
          <div
            className={css`
              font-size: 1.3rem;
              font-weight: 700;
              color: ${Color.darkerGray()};
            `}
          >
            {user.username}
          </div>
          <div
            className={css`
              font-size: 1.1rem;
              color: ${Color.gray()};
            `}
          >
            {lastActiveLabel}
          </div>
        </div>
      </div>
      <GameCTAButton
        variant="orange"
        size="sm"
        icon="comments"
        shiny
        disabled={!onSelect}
        onClick={() => onSelect?.(user)}
      >
        Send omok move
      </GameCTAButton>
    </div>
  );
}
