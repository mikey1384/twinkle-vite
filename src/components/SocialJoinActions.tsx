import React, { useState } from 'react';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import { useKeyContext } from '~/contexts';
import { PRESENCE_HIDDEN_USER_IDS } from '~/helpers/hiddenPresence';
import useBlockedUsers from '~/helpers/hooks/useBlockedUsers';
import { useWalkUp } from '~/helpers/hooks/useSocialWalkups';
import { isActivityShown } from '~/helpers/presenceVisibility';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import {
  joinActions,
  joinableBadge,
  readJoinable,
  type JoinIntent
} from '~/helpers/socialWalkups';

// "Play Baduk with KenGo" / "Watch": what a member can do about someone who
// is in an app that said they can be joined (Twinkle.social.setJoinable).
// Shown in the profile popup, which is also what a Live now face opens.
// Renders nothing for anyone else, so apps that have not adopted this change
// nothing here.
const panelCls = css`
  margin: 0 0 1rem;
  padding: 0.9rem 1rem 1rem;
  border-radius: 1.1rem;
  background: rgba(47, 191, 113, 0.09);
  border: 1px solid rgba(47, 191, 113, 0.28);
  .social-where {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    min-width: 0;
    font-size: 1.2rem;
    line-height: 1.35;
    color: #2a3b33;
  }
  .social-dot {
    flex: 0 0 auto;
    width: 0.8rem;
    height: 0.8rem;
    border-radius: 50%;
    background: #2fbf71;
  }
  .social-dot[data-state='busy-watchable'],
  .social-dot[data-state='busy'] {
    background: #e8a33d;
  }
  .social-where b {
    font-weight: 700;
  }
  .social-text {
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .social-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    margin-top: 0.8rem;
  }
  .social-buttons > button {
    flex: 1 1 9rem;
    min-width: 0;
    min-height: 3.6rem;
  }
  .social-buttons > button span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

export default function SocialJoinActions({
  member,
  activity,
  presence,
  source,
  onDone
}: {
  member: { id: number; username: string; profilePicUrl?: string | null };
  activity: any;
  presence: { isOnline?: boolean; isAway?: boolean } | null | undefined;
  source: 'live_now' | 'profile';
  onDone?: () => void;
}) {
  const myId = useKeyContext((v) => v.myState.userId);
  const buttonColor = useRoleColor('button', { fallback: 'logoBlue' }).colorKey;
  const blockedIds = useBlockedUsers().blockedIds;
  const walkUp = useWalkUp();
  const [pending, setPending] = useState<JoinIntent | null>(null);

  const joinable = readJoinable(activity);
  if (
    !myId ||
    !joinable ||
    member.id === myId ||
    blockedIds.has(member.id) ||
    PRESENCE_HIDDEN_USER_IDS.includes(member.id) ||
    !isActivityShown({
      userId: member.id,
      activity,
      presence,
      hiddenUserIds: PRESENCE_HIDDEN_USER_IDS
    })
  )
    return null;

  const appTitle = String(activity.title || 'this app');
  const actions = joinActions({ joinable, appTitle, username: member.username });

  return (
    <div className={panelCls} data-social-join>
      <div className="social-where">
        <span className="social-dot" data-state={joinable.state} aria-hidden />
        <span className="social-text">
          In <b>{appTitle}</b> · {joinableBadge(joinable)}
        </span>
      </div>
      <div className="social-buttons">
        {actions.map((action) => (
          <Button
            key={action.intent}
            color={buttonColor}
            variant={action.intent === 'watch' ? 'soft' : 'solid'}
            tone="raised"
            size="sm"
            uppercase={false}
            loading={pending === action.intent}
            disabled={!!pending}
            onClick={() => handleJoin(action.intent)}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );

  async function handleJoin(intent: JoinIntent) {
    if (pending || !joinable) return;
    setPending(intent);
    try {
      await walkUp({
        buildId: Number(activity.id),
        host: {
          id: member.id,
          username: member.username,
          profilePicUrl: member.profilePicUrl || null
        },
        joinable,
        intent,
        source
      });
      onDone?.();
    } finally {
      setPending(null);
    }
  }
}
