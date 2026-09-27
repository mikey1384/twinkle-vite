import React, { useState } from 'react';
import { css } from '@emotion/css';
import ProfilePic from '~/components/ProfilePic';
import Loading from '~/components/Loading';
import BlockUserModal from '~/components/ChatSafety/BlockUserModal';
import useBlockedUsers from '~/helpers/hooks/useBlockedUsers';
import { homePanelClass } from '~/theme/homePanels';
import { useHomePanelVars } from '~/theme/hooks/useHomePanelVars';
import { Color, mobileMaxWidth } from '~/constants/css';

// Settings > Blocked members: the canonical list, each with a confirmed Unblock.
export default function BlockedUsersItem() {
  const blockList = useBlockedUsers();
  const { panelVars } = useHomePanelVars(0.08, { neutralSurface: true });
  const [unblockTarget, setUnblockTarget] = useState<{
    id: number;
    username: string;
  } | null>(null);

  return (
    <div
      className={homePanelClass}
      data-scroll-anchor-id="home-settings:blocked-members"
      style={
        {
          ...panelVars,
          ['--home-panel-border' as const]: 'var(--ui-border)',
          ['--home-panel-color' as const]: Color.darkerGray(),
          ['--home-panel-gap' as const]: '1.4rem',
          ['--home-panel-padding' as const]: '2.2rem 2.4rem',
          ['--home-panel-mobile-padding' as const]: '1.8rem 1.6rem',
          ['--home-panel-card-border' as const]: 'var(--ui-border)'
        } as React.CSSProperties
      }
    >
      <h2 className={titleClass}>Blocked members</h2>
      <p className={descriptionClass}>
        Blocked members can’t message you, and their messages in group chats
        are hidden for you. They aren’t told. To block someone, open their
        profile or your chat with them and choose Block.
      </p>
      {blockList.status === 'loading' || blockList.status === 'idle' ? (
        <Loading style={{ height: '8rem' }} />
      ) : blockList.status === 'error' ? (
        <p className={descriptionClass}>
          Your blocked members couldn’t be loaded. Please try again later.
        </p>
      ) : blockList.blockedUsers.length === 0 ? (
        <p className={emptyClass}>You haven’t blocked anyone.</p>
      ) : (
        <ul className={listClass}>
          {blockList.blockedUsers.map((user) => (
            <li key={user.id} className={rowClass}>
              <ProfilePic
                userId={user.id}
                profilePicUrl={user.profilePicUrl || undefined}
                style={{ width: '4rem', flex: '0 0 auto' }}
              />
              <span className={nameClass}>{user.username || 'Member'}</span>
              <button
                type="button"
                className={unblockButtonClass}
                onClick={() =>
                  setUnblockTarget({ id: user.id, username: user.username })
                }
              >
                Unblock
              </button>
            </li>
          ))}
        </ul>
      )}
      {unblockTarget && (
        <BlockUserModal
          user={unblockTarget}
          mode="unblock"
          onHide={() => setUnblockTarget(null)}
        />
      )}
    </div>
  );
}

const titleClass = css`
  margin: 0;
  font-size: 2.1rem;
  font-weight: 700;
  color: ${Color.darkerGray()};
`;

const descriptionClass = css`
  margin: 0;
  color: ${Color.darkGray()};
  font-size: 1.5rem;
  line-height: 1.5;
`;

const emptyClass = css`
  margin: 0;
  color: ${Color.darkGray()};
  font-size: 1.5rem;
  font-weight: 700;
`;

const listClass = css`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;

const rowClass = css`
  display: flex;
  align-items: center;
  gap: 1.2rem;
  padding: 0.8rem 1.2rem;
  border: 1px solid var(--ui-border);
  border-radius: 10px;
  background: #fff;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 0.8rem;
  }
`;

const nameClass = css`
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 1.6rem;
  font-weight: 700;
  color: ${Color.darkerGray()};
`;

const unblockButtonClass = css`
  appearance: none;
  flex: 0 0 auto;
  min-height: 44px;
  padding: 0.6rem 1.6rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  color: #1e293b;
  font: inherit;
  font-size: 1.4rem;
  font-weight: 700;
  cursor: pointer;
  touch-action: manipulation;
  &:hover {
    background: #f1f5f9;
  }
  &:focus-visible {
    outline: 2px solid #334155;
    outline-offset: 1px;
  }
`;
