import React from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import ProfilePic from '~/components/ProfilePic';
import UsernameText from '~/components/Texts/UsernameText';
import { timeSinceShort } from '~/helpers/timeStampHelpers';
import type { User } from '~/types';

const inheritedUsernameTextStyle: React.CSSProperties = {
  color: 'inherit',
  fontSize: 'inherit',
  fontWeight: 'inherit'
};

const rowClass = css`
  width: 100%;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.7rem;
  padding: 0.9rem 1rem;
  border: 0;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  background: transparent;
  color: var(--chat-text);
  text-align: left;
  cursor: pointer;

  &:hover {
    background: rgba(65, 140, 235, 0.06);
  }

  &:last-child {
    border-bottom: 0;
  }
`;

const iconBubbleClass = css`
  width: 2.35rem;
  height: 2.35rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgba(65, 140, 235, 0.12);
  color: #1d4ed8;
  border: 1px solid rgba(65, 140, 235, 0.2);
`;

const rowBodyClass = css`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

const rowMessageClass = css`
  color: var(--chat-text);
  font-size: 1.1rem;
  font-weight: 800;
  line-height: 1.32;
  overflow-wrap: anywhere;
`;

const actorNameClass = css`
  color: #1d4ed8;
  font-weight: 900;
`;

const subjectClass = css`
  color: var(--chat-text);
  font-size: 1.1rem;
  font-weight: 800;
  opacity: 0.68;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const rowMetaClass = css`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
  color: var(--chat-text);
  font-size: 1.1rem;
  font-weight: 800;
  opacity: 0.64;
`;

const activityDetailClass = css`
  color: var(--chat-text);
  font-size: 1.1rem;
  line-height: 1.35;
  opacity: 0.74;
  overflow-wrap: anywhere;
`;

export default function ActivityPanelRow({
  actor,
  currentUserId,
  detail = '',
  hideActor = false,
  icon,
  message,
  onClick,
  quoteDetail = false,
  subjectLabel,
  timeStamp
}: {
  actor: {
    id: number;
    username: string;
    profilePicUrl?: string | null;
  };
  currentUserId: number;
  detail?: string;
  hideActor?: boolean;
  icon: string;
  message: string;
  onClick: () => void;
  quoteDetail?: boolean;
  subjectLabel: string;
  timeStamp: number;
}) {
  const actorLabel =
    Number(actor.id || 0) === Number(currentUserId || 0)
      ? 'You'
      : actor.username || 'Someone';
  const normalizedDetail = truncateActivityText(detail);

  return (
    <button type="button" className={rowClass} onClick={onClick}>
      {actor.id ? (
        <ProfilePic
          userId={actor.id}
          profilePicUrl={actor.profilePicUrl || undefined}
          size="2.35rem"
        />
      ) : (
        <span className={iconBubbleClass}>
          <Icon icon={icon} />
        </span>
      )}
      <span className={rowBodyClass}>
        <span className={rowMessageClass}>
          {!hideActor ? (
            <>
              <span
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
              >
                <UsernameText
                  className={actorNameClass}
                  color="inherit"
                  displayedName={actorLabel}
                  textStyle={inheritedUsernameTextStyle}
                  user={getActivityActorUser(actor)}
                />
              </span>{' '}
            </>
          ) : null}
          {message}
        </span>
        <span className={subjectClass}>{subjectLabel}</span>
        {normalizedDetail ? (
          <span className={activityDetailClass}>
            {quoteDetail ? `“${normalizedDetail}”` : normalizedDetail}
          </span>
        ) : null}
        <span className={rowMetaClass}>
          <Icon icon={icon} />
          <span>{timeSinceShort(timeStamp)}</span>
        </span>
      </span>
    </button>
  );
}

function getActivityActorUser(actor: {
  id: number;
  username: string;
  profilePicUrl?: string | null;
}): User {
  return {
    id: Number(actor.id || 0),
    profilePicUrl: actor.profilePicUrl || '',
    username: actor.username || ''
  };
}

function truncateActivityText(value: string) {
  const normalized = String(value || '').trim();
  if (normalized.length <= 90) return normalized;
  return `${normalized.slice(0, 87)}...`;
}
